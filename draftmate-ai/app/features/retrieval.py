"""Retrieval module with keyword-based and optional embedding-based search."""
import json
import os
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class RetrievalResult:
    """A retrieved chunk with relevance score."""
    chunk_id: str
    document_id: str
    text: str
    score: float
    source_filename: str
    page_number: Optional[int]
    file_type: str
    metadata: Dict[str, Any]


class KeywordRetriever:
    """BM25-based keyword retrieval."""

    def __init__(self):
        self._index = None
        self._chunk_texts: List[str] = []
        self._chunk_ids: List[str] = []

    def build_index(self, chunks: List[Dict[str, Any]]) -> None:
        """Build BM25 index from chunks."""
        try:
            from rank_bm25 import BM25Okapi
        except ImportError:
            logger.warning("rank_bm25 not installed, keyword retrieval disabled")
            return

        self._chunk_texts = []
        self._chunk_ids = []

        for chunk in chunks:
            text = chunk.get("text", "")
            if text.strip():
                self._chunk_texts.append(text)
                self._chunk_ids.append(chunk.get("chunk_id", ""))

        if self._chunk_texts:
            tokenized_corpus = [self._tokenize(text) for text in self._chunk_texts]
            self._index = BM25Okapi(tokenized_corpus)
            logger.info("bm25_index_built", chunks=len(self._chunk_texts))

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization."""
        import re
        # Lowercase, split on non-alphanumeric
        tokens = re.findall(r'\w+', text.lower())
        return tokens

    def retrieve(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Retrieve top-k chunks for query.
        
        Returns:
            List of (chunk_index, score) tuples
        """
        if self._index is None or not self._chunk_texts:
            return []

        tokenized_query = self._tokenize(query)
        scores = self._index.get_scores(tokenized_query)

        # Get top-k indices
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        return [(idx, scores[idx]) for idx in top_indices if scores[idx] > 0]


class EmbeddingRetriever:
    """Optional embedding-based retrieval using sentence-transformers."""

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        cache_dir: Optional[str] = None,
    ):
        self.model_name = model_name
        self.cache_dir = cache_dir
        self._model = None
        self._embeddings = None
        self._chunk_ids: List[str] = []
        self._enabled = False

    def _load_model(self):
        """Load the embedding model lazily."""
        if self._model is not None:
            return

        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name, cache_folder=self.cache_dir)
            self._enabled = True
            logger.info("embedding_model_loaded", model=self.model_name)
        except ImportError:
            logger.warning("sentence-transformers not installed, embedding retrieval disabled")
            self._enabled = False
        except Exception as e:
            logger.error("embedding_model_load_failed", model=self.model_name, error=str(e))
            self._enabled = False

    def build_index(self, chunks: List[Dict[str, Any]]) -> None:
        """Build embedding index from chunks."""
        self._load_model()
        if not self._enabled:
            return

        texts = []
        self._chunk_ids = []

        for chunk in chunks:
            text = chunk.get("text", "")
            if text.strip():
                texts.append(text)
                self._chunk_ids.append(chunk.get("chunk_id", ""))

        if texts:
            try:
                self._embeddings = self._model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
                logger.info("embedding_index_built", chunks=len(texts))
            except Exception as e:
                logger.error("embedding_index_build_failed", error=str(e))
                self._embeddings = None

    def retrieve(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Retrieve top-k chunks for query using cosine similarity.
        
        Returns:
            List of (chunk_index, score) tuples
        """
        if not self._enabled or self._embeddings is None or self._model is None:
            return []

        try:
            query_embedding = self._model.encode([query], convert_to_numpy=True)[0]
            # Cosine similarity
            import numpy as np
            similarities = np.dot(self._embeddings, query_embedding) / (
                np.linalg.norm(self._embeddings, axis=1) * np.linalg.norm(query_embedding) + 1e-8
            )
            top_indices = np.argsort(similarities)[::-1][:top_k]
            return [(int(idx), float(similarities[idx])) for idx in top_indices if similarities[idx] > 0]
        except Exception as e:
            logger.error("embedding_retrieval_failed", error=str(e))
            return []

    def save_index(self, path: str) -> None:
        """Save index to disk."""
        if self._embeddings is not None:
            data = {
                "embeddings": self._embeddings,
                "chunk_ids": self._chunk_ids,
                "model_name": self.model_name,
            }
            with open(path, "wb") as f:
                pickle.dump(data, f)

    def load_index(self, path: str) -> bool:
        """Load index from disk."""
        if not os.path.exists(path):
            return False

        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
            self._embeddings = data["embeddings"]
            self._chunk_ids = data["chunk_ids"]
            self.model_name = data.get("model_name", self.model_name)
            self._load_model()
            logger.info("embedding_index_loaded", chunks=len(self._chunk_ids))
            return True
        except Exception as e:
            logger.error("embedding_index_load_failed", error=str(e))
            return False


class HybridRetriever:
    """Combines keyword and embedding retrieval."""

    def __init__(
        self,
        keyword_weight: float = 0.5,
        embedding_weight: float = 0.5,
        embedding_model: str = "all-MiniLM-L6-v2",
        cache_dir: Optional[str] = None,
    ):
        self.keyword_retriever = KeywordRetriever()
        self.embedding_retriever = EmbeddingRetriever(
            model_name=embedding_model,
            cache_dir=cache_dir,
        )
        self.keyword_weight = keyword_weight
        self.embedding_weight = embedding_weight
        self._chunk_map: Dict[int, Dict[str, Any]] = {}

    def build_index(self, chunks: List[Dict[str, Any]]) -> None:
        """Build both indexes."""
        # Create index mapping
        self._chunk_map = {i: chunk for i, chunk in enumerate(chunks)}

        # Build both indexes
        self.keyword_retriever.build_index(chunks)
        self.embedding_retriever.build_index(chunks)

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        document_ids: Optional[List[str]] = None,
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant chunks for a query.
        
        Args:
            query: Search query
            top_k: Maximum results to return
            document_ids: Optional filter by document IDs
            
        Returns:
            List of RetrievalResult objects
        """
        # Get results from both retrievers
        keyword_results = self.keyword_retriever.retrieve(query, top_k * 2)
        embedding_results = self.embedding_retriever.retrieve(query, top_k * 2)

        # Combine scores
        combined_scores: Dict[int, float] = {}

        for idx, score in keyword_results:
            combined_scores[idx] = combined_scores.get(idx, 0) + score * self.keyword_weight

        for idx, score in embedding_results:
            combined_scores[idx] = combined_scores.get(idx, 0) + score * self.embedding_weight

        # Sort by combined score
        sorted_results = sorted(
            combined_scores.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:top_k]

        # Convert to RetrievalResult objects
        results = []
        for idx, score in sorted_results:
            chunk_data = self._chunk_map.get(idx)
            if chunk_data is None:
                continue

            # Filter by document_ids if provided
            if document_ids and chunk_data.get("document_id") not in document_ids:
                continue

            results.append(RetrievalResult(
                chunk_id=chunk_data.get("chunk_id", ""),
                document_id=chunk_data.get("document_id", ""),
                text=chunk_data.get("text", ""),
                score=score,
                source_filename=chunk_data.get("source_filename", ""),
                page_number=chunk_data.get("page_number"),
                file_type=chunk_data.get("file_type", ""),
                metadata=chunk_data.get("metadata", {}),
            ))

            if len(results) >= top_k:
                break

        logger.info("retrieval_completed", query=query[:50], results=len(results))
        return results


def format_retrieval_context(results: List[RetrievalResult], max_chars: int = 8000) -> str:
    """Format retrieval results for LLM context."""
    parts = []
    total_chars = 0

    for i, result in enumerate(results):
        source_info = f"[Source {i+1}: {result.source_filename}"
        if result.page_number:
            source_info += f", page {result.page_number}"
        source_info += f"]\n{result.text}\n"

        if total_chars + len(source_info) > max_chars:
            break

        parts.append(source_info)
        total_chars += len(source_info)

    return "\n".join(parts)