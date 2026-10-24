"""Hybrid retrieval engine combining dense vector search, BM25 lexical search, and RRF."""

import re
from typing import List, Optional, Dict, Any, Tuple
from rank_bm25 import BM25Okapi

from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.query_processing import LegalQueryProcessor, ProcessedQuery
from draftmate_ai.document_rag.reranking import BaseReranker, CrossEncoderReranker
from draftmate_ai.document_rag.schemas import RetrievedChunk, RetrievalFilter, RetrievalConfig
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def tokenize_for_bm25(text: str) -> List[str]:
    """Tokenize text into lowercase alphanumeric words for BM25."""
    return re.findall(r"\b[A-Za-z0-9\-\.]+\b", text.lower())


class HybridRetriever:
    """Orchestrates query processing, dense semantic search, BM25 lexical search, RRF, and reranking."""

    def __init__(
        self,
        index_manager: VectorIndexManager,
        config: Optional[RetrievalConfig] = None,
        query_processor: Optional[LegalQueryProcessor] = None,
        reranker: Optional[BaseReranker] = None,
    ):
        self.index_manager = index_manager
        self.config = config or RetrievalConfig()
        self.query_processor = query_processor or LegalQueryProcessor()
        self.reranker = reranker or CrossEncoderReranker()

        self._bm25: Optional[BM25Okapi] = None
        self._bm25_chunks: List[RetrievedChunk] = []
        self._sync_bm25_corpus()

    def _sync_bm25_corpus(self) -> None:
        """Synchronize the in-memory BM25 index with chunks from the vector database."""
        all_chunks = self.index_manager.get_all_chunks()
        if not all_chunks:
            self._bm25 = None
            self._bm25_chunks = []
            return

        self._bm25_chunks = all_chunks
        corpus_tokens = [tokenize_for_bm25(c.text) for c in all_chunks]
        self._bm25 = BM25Okapi(corpus_tokens)
        logger.debug(f"BM25 index synchronized with {len(all_chunks)} chunks.")

    def refresh_index(self) -> None:
        """Public hook to rebuild BM25 corpus after new documents are indexed or deleted."""
        self._sync_bm25_corpus()

    def _search_lexical(
        self,
        query_tokens: List[str],
        top_k: int = 10,
        filters: Optional[RetrievalFilter] = None,
    ) -> List[RetrievedChunk]:
        """Perform BM25 lexical search over indexed chunks with optional filtering."""
        if not self._bm25 or not query_tokens or not self._bm25_chunks:
            return []

        scores = self._bm25.get_scores(query_tokens)
        # Pair chunks with scores
        scored: List[Tuple[float, RetrievedChunk]] = []

        for score, chunk in zip(scores, self._bm25_chunks):
            if score <= 0.0:
                continue

            # Apply filters
            if filters:
                if filters.document_ids and chunk.document_id not in filters.document_ids:
                    continue
                if filters.filenames and chunk.document_name not in filters.filenames:
                    continue
                if filters.clause_numbers and chunk.clause_number not in filters.clause_numbers:
                    continue

            # Create scored copy
            chunk_copy = chunk.model_copy()
            chunk_copy.score = float(score)
            chunk_copy.lexical_score = float(score)
            chunk_copy.retrieval_method = "lexical"
            scored.append((float(score), chunk_copy))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:top_k]]

    def _reciprocal_rank_fusion(
        self,
        dense_results: List[RetrievedChunk],
        lexical_results: List[RetrievedChunk],
        k: int = 60,
        w_dense: float = 0.6,
        w_lexical: float = 0.4,
    ) -> List[RetrievedChunk]:
        """Combine dense and lexical rankings using weighted Reciprocal Rank Fusion (RRF)."""
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, RetrievedChunk] = {}

        # 1. Process dense ranks
        for rank, chunk in enumerate(dense_results, start=1):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0.0) + (w_dense / (k + rank))
            if chunk.chunk_id not in chunk_map:
                chunk_map[chunk.chunk_id] = chunk.model_copy()
            chunk_map[chunk.chunk_id].dense_score = chunk.score

        # 2. Process lexical ranks
        for rank, chunk in enumerate(lexical_results, start=1):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0.0) + (w_lexical / (k + rank))
            if chunk.chunk_id not in chunk_map:
                chunk_map[chunk.chunk_id] = chunk.model_copy()
            chunk_map[chunk.chunk_id].lexical_score = chunk.score

        # 3. Assemble combined chunks with normalized RRF score
        fused: List[RetrievedChunk] = []
        max_possible_rrf = (w_dense / (k + 1)) + (w_lexical / (k + 1))

        for cid, raw_rrf in rrf_scores.items():
            chunk = chunk_map[cid]
            norm_score = min(1.0, raw_rrf / max_possible_rrf)
            chunk.score = round(norm_score, 4)
            chunk.retrieval_method = "hybrid_rrf"
            fused.append(chunk)

        fused.sort(key=lambda x: x.score, reverse=True)
        return fused

    def retrieve(
        self,
        query: str,
        filters: Optional[RetrievalFilter] = None,
        top_k: Optional[int] = None,
        config_override: Optional[RetrievalConfig] = None,
    ) -> List[RetrievedChunk]:
        """Execute the end-to-end hybrid retrieval pipeline.

        Args:
            query: User's question or search query.
            filters: Optional metadata filtering constraints.
            top_k: Number of final results to return (overrides config).
            config_override: Optional custom retrieval hyperparameters.

        Returns:
            Ranked list of RetrievedChunk objects.
        """
        cfg = config_override or self.config
        final_k = top_k or cfg.top_k
        fetch_k = cfg.rerank_top_k if cfg.enable_reranking else final_k

        # 1. Query Processing
        processed_query: ProcessedQuery = self.query_processor.process(query)

        # Merge explicit filters with inferred filters from query if not already constrained
        merged_filters = filters
        if not merged_filters and processed_query.inferred_filter:
            # We don't hard-restrict unless specified, but can prioritize
            pass

        # 2. Dense Semantic Search
        dense_results = self.index_manager.search_dense(
            query=processed_query.clean_query,
            top_k=fetch_k,
            filters=merged_filters,
        )

        # 3. Lexical BM25 Search
        lexical_results = self._search_lexical(
            query_tokens=processed_query.lexical_tokens,
            top_k=fetch_k,
            filters=merged_filters,
        )

        # 4. Hybrid Fusion (RRF)
        fused_candidates = self._reciprocal_rank_fusion(
            dense_results=dense_results,
            lexical_results=lexical_results,
            k=cfg.rrf_k,
            w_dense=cfg.semantic_weight,
            w_lexical=cfg.lexical_weight,
        )

        # Fallback if both dense and lexical produced nothing
        if not fused_candidates:
            return []

        # 5. Optional Cross-Encoder Reranking
        if cfg.enable_reranking and self.reranker:
            final_results = self.reranker.rerank(
                query=query,
                candidates=fused_candidates,
                top_k=final_k,
                min_score=cfg.min_score_threshold,
            )
        else:
            filtered = [c for c in fused_candidates if c.score >= cfg.min_score_threshold]
            final_results = filtered[:final_k]

        # 6. Safety Guarantee: ensure every chunk maps back to a valid document
        valid_results = [
            c for c in final_results
            if c.document_id and c.document_id != "unknown" and c.text.strip()
        ]

        return valid_results

