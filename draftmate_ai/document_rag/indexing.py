"""Persistent vector index manager using Chroma with document lifecycle support.

Provides document-level indexing, reindexing, deduplication, schema validation,
and safe model compatibility checks.
"""

import json
import os
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from draftmate_ai.document_rag.embeddings import BaseEmbeddingModel, get_embedding_model
from draftmate_ai.document_rag.schemas import RetrievedChunk, RetrievalFilter
from draftmate_ai.shared.configuration import get_settings
from draftmate_ai.shared.document_models import DocumentChunk, ProcessedDocument
from draftmate_ai.shared.exceptions import ConfigurationError, DraftMateError
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

INDEX_METADATA_FILE = "index_metadata.json"


class VectorIndexManager:
    """Manages persistence, indexing, deletion, and querying of vector indices."""

    def __init__(
        self,
        storage_dir: Optional[str] = None,
        collection_name: str = "draftmate_documents",
        embedding_model: Optional[BaseEmbeddingModel] = None,
        recreate_if_incompatible: bool = False,
    ):
        settings = get_settings()
        self.storage_dir = Path(storage_dir or os.path.join(settings.STORAGE_DIR, "vector_index"))
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.collection_name = collection_name
        self.embedding_model = embedding_model or get_embedding_model()
        self.recreate_if_incompatible = recreate_if_incompatible

        # Validate or initialize index metadata
        self._check_and_init_metadata()

        # Initialize Chroma persistent client
        self.client = chromadb.PersistentClient(
            path=str(self.storage_dir),
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"embedding_model": self.embedding_model.model_name, "dimension": self.embedding_model.dimension},
        )

    def _metadata_path(self) -> Path:
        return self.storage_dir / INDEX_METADATA_FILE

    def _check_and_init_metadata(self) -> None:
        """Check for existing index metadata and detect incompatibility with current embedding model."""
        meta_file = self._metadata_path()

        if meta_file.exists():
            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
                saved_model = meta.get("embedding_model")
                saved_dim = meta.get("dimension")

                if saved_model != self.embedding_model.model_name or saved_dim != self.embedding_model.dimension:
                    msg = (
                        f"Incompatible vector index at '{self.storage_dir}': index was built with "
                        f"model '{saved_model}' (dim {saved_dim}), but current model is "
                        f"'{self.embedding_model.model_name}' (dim {self.embedding_model.dimension})."
                    )
                    if self.recreate_if_incompatible:
                        logger.warning(f"{msg} Recreating index directory...")
                        shutil.rmtree(self.storage_dir)
                        self.storage_dir.mkdir(parents=True, exist_ok=True)
                        self._save_metadata({"indexed_documents": {}})
                    else:
                        raise ConfigurationError(msg)
            except (json.JSONDecodeError, OSError) as e:
                raise DraftMateError(f"Corrupted index metadata file at '{meta_file}': {e}") from e
        else:
            self._save_metadata({"indexed_documents": {}})

    def _get_metadata(self) -> Dict[str, Any]:
        meta_file = self._metadata_path()
        if meta_file.exists():
            return json.loads(meta_file.read_text(encoding="utf-8"))
        return {"indexed_documents": {}}

    def _save_metadata(self, extra: Optional[Dict[str, Any]] = None) -> None:
        current = self._get_metadata() if self._metadata_path().exists() else {}
        if extra:
            current.update(extra)
        current["embedding_model"] = self.embedding_model.model_name
        current["dimension"] = self.embedding_model.dimension
        self._metadata_path().write_text(json.dumps(current, indent=2), encoding="utf-8")

    def index_chunks(
        self,
        chunks: List[DocumentChunk],
        document_name: str = "",
        skip_duplicates: bool = True,
    ) -> int:
        """Index a batch of DocumentChunks into the persistent vector database.

        Returns:
            Number of newly indexed chunks.
        """
        if not chunks:
            return 0

        # Retrieve existing IDs to avoid duplicates
        existing_ids = set()
        if skip_duplicates:
            try:
                existing = self.collection.get(ids=[c.chunk_id for c in chunks])
                if existing and existing.get("ids"):
                    existing_ids = set(existing["ids"])
            except Exception as e:
                logger.debug(f"Could not fetch existing IDs: {e}")

        chunks_to_add = [c for c in chunks if c.chunk_id not in existing_ids]
        if not chunks_to_add:
            logger.info("All chunks already present in index. Skipping duplicate insertion.")
            return 0

        texts = [c.text for c in chunks_to_add]
        embeddings = self.embedding_model.embed_batch(texts, batch_size=32)

        ids = [c.chunk_id for c in chunks_to_add]
        metadatas = []

        for c in chunks_to_add:
            doc_filename = document_name or c.metadata.get("filename", "document")
            metadatas.append({
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "document_name": doc_filename,
                "page_start": c.page_start if c.page_start is not None else -1,
                "page_end": c.page_end if c.page_end is not None else -1,
                "section_heading": c.section_heading or "",
                "clause_number": c.clause_number or "",
                "paragraph_numbers": ",".join(map(str, c.paragraph_numbers)),
                "original_text": c.original_text,
                "extraction_method": c.extraction_method,
            })

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

        # Update metadata index tracking
        doc_ids = {c.document_id for c in chunks_to_add}
        meta = self._get_metadata()
        indexed_docs = meta.setdefault("indexed_documents", {})
        for d_id in doc_ids:
            doc_chunks = indexed_docs.setdefault(d_id, {"chunk_count": 0, "filename": document_name})
            doc_chunks["chunk_count"] += len([c for c in chunks_to_add if c.document_id == d_id])

        self._save_metadata(meta)
        logger.info(f"Indexed {len(chunks_to_add)} new chunks into '{self.collection_name}'.")
        return len(chunks_to_add)

    def index_document(
        self,
        document: ProcessedDocument,
        skip_duplicates: bool = True,
    ) -> int:
        """Index all chunks belonging to a ProcessedDocument."""
        if not document.chunks:
            logger.warning(f"Document '{document.metadata.filename}' has no chunks to index.")
            return 0

        return self.index_chunks(
            chunks=document.chunks,
            document_name=document.metadata.filename,
            skip_duplicates=skip_duplicates,
        )

    def delete_document(self, document_id: str) -> int:
        """Remove all chunks associated with a document ID from the vector index."""
        meta = self._get_metadata()
        indexed_docs = meta.get("indexed_documents", {})

        if document_id not in indexed_docs:
            logger.warning(f"Document ID '{document_id}' not found in index registry.")
            return 0

        # Query and delete by document_id filter
        try:
            records = self.collection.get(where={"document_id": document_id})
            ids_to_del = records.get("ids", [])
            if ids_to_del:
                self.collection.delete(ids=ids_to_del)
                logger.info(f"Deleted {len(ids_to_del)} chunks for document '{document_id}'.")

            del indexed_docs[document_id]
            self._save_metadata(meta)
            return len(ids_to_del)
        except Exception as e:
            raise DraftMateError(f"Failed deleting document '{document_id}': {e}") from e

    def reindex_document(self, document: ProcessedDocument) -> int:
        """Safely delete and re-insert a document's chunks."""
        self.delete_document(document.metadata.document_id)
        return self.index_document(document, skip_duplicates=False)

    def search_dense(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[RetrievalFilter] = None,
    ) -> List[RetrievedChunk]:
        """Perform dense vector similarity search against the indexed chunks."""
        if self.count() == 0:
            return []

        query_vec = self.embedding_model.embed_text(query)

        where_clause = None
        if filters:
            conditions = []
            if filters.document_ids:
                if len(filters.document_ids) == 1:
                    conditions.append({"document_id": filters.document_ids[0]})
                else:
                    conditions.append({"document_id": {"$in": filters.document_ids}})
            if filters.filenames:
                if len(filters.filenames) == 1:
                    conditions.append({"document_name": filters.filenames[0]})
                else:
                    conditions.append({"document_name": {"$in": filters.filenames}})
            if filters.clause_numbers:
                if len(filters.clause_numbers) == 1:
                    conditions.append({"clause_number": filters.clause_numbers[0]})
                else:
                    conditions.append({"clause_number": {"$in": filters.clause_numbers}})

            if len(conditions) == 1:
                where_clause = conditions[0]
            elif len(conditions) > 1:
                where_clause = {"$and": conditions}

        results = self.collection.query(
            query_embeddings=[query_vec],
            n_results=top_k,
            where=where_clause,
            include=["documents", "metadatas", "distances"],
        )

        retrieved: List[RetrievedChunk] = []
        if not results or not results.get("ids") or not results["ids"][0]:
            return []

        ids = results["ids"][0]
        docs = results["documents"][0] if results.get("documents") else []
        metas = results["metadatas"][0] if results.get("metadatas") else []
        dists = results["distances"][0] if results.get("distances") else []

        for cid, doc, meta, dist in zip(ids, docs, metas, dists):
            # Chroma default cosine distance is 1 - cosine_similarity
            score = max(0.0, 1.0 - float(dist)) if dist is not None else 1.0

            p_start = meta.get("page_start")
            p_end = meta.get("page_end")
            paras_raw = meta.get("paragraph_numbers", "")
            paras = [int(p) for p in paras_raw.split(",") if p.isdigit()]

            retrieved.append(
                RetrievedChunk(
                    chunk_id=cid,
                    document_id=meta.get("document_id", "unknown"),
                    document_name=meta.get("document_name", "unknown"),
                    text=doc,
                    original_text=meta.get("original_text", doc),
                    page_start=p_start if p_start != -1 else None,
                    page_end=p_end if p_end != -1 else None,
                    section_heading=meta.get("section_heading") or None,
                    clause_number=meta.get("clause_number") or None,
                    paragraph_numbers=paras,
                    score=score,
                    dense_score=score,
                    retrieval_method="dense",
                    metadata=meta,
                )
            )

        return retrieved

    def get_all_chunks(self) -> List[RetrievedChunk]:
        """Fetch all indexed chunks with their metadata."""
        if self.count() == 0:
            return []

        data = self.collection.get(include=["documents", "metadatas"])
        chunks: List[RetrievedChunk] = []

        ids = data.get("ids", [])
        docs = data.get("documents", [])
        metas = data.get("metadatas", [])

        for cid, doc, meta in zip(ids, docs, metas):
            p_start = meta.get("page_start")
            p_end = meta.get("page_end")
            paras_raw = meta.get("paragraph_numbers", "")
            paras = [int(p) for p in paras_raw.split(",") if p.isdigit()]

            chunks.append(
                RetrievedChunk(
                    chunk_id=cid,
                    document_id=meta.get("document_id", "unknown"),
                    document_name=meta.get("document_name", "unknown"),
                    text=doc,
                    original_text=meta.get("original_text", doc),
                    page_start=p_start if p_start != -1 else None,
                    page_end=p_end if p_end != -1 else None,
                    section_heading=meta.get("section_heading") or None,
                    clause_number=meta.get("clause_number") or None,
                    paragraph_numbers=paras,
                    score=1.0,
                    retrieval_method="indexed",
                    metadata=meta,
                )
            )

        return chunks

    def count(self) -> int:
        """Total number of chunks in the collection."""
        return self.collection.count()

