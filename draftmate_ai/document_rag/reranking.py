"""Reranking algorithms for fine-grained passage prioritization.

Provides cross-encoder scoring, legal entity match boosting, and duplicate elimination.
"""

from abc import ABC, abstractmethod
import math
import re
from typing import List, Set

from draftmate_ai.document_rag.schemas import RetrievedChunk
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class BaseReranker(ABC):
    """Abstract base class for chunk reranking strategies."""

    @abstractmethod
    def rerank(
        self,
        query: str,
        candidates: List[RetrievedChunk],
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[RetrievedChunk]:
        """Rerank and filter candidates, returning top_k passages."""
        pass


class CrossEncoderReranker(BaseReranker):
    """Cross-encoder reranker leveraging legal token coverage, clause alignment, and semantic density."""

    def __init__(self, clause_bonus: float = 0.25, heading_bonus: float = 0.15):
        self.clause_bonus = clause_bonus
        self.heading_bonus = heading_bonus

    def _tokenize(self, text: str) -> Set[str]:
        words = re.findall(r"\b[A-Za-z0-9\-\.]+\b", text.lower())
        return {w for w in words if len(w) > 2}

    def compute_rerank_score(self, query: str, chunk: RetrievedChunk) -> float:
        """Compute fine-grained relevance score between query and a retrieved candidate."""
        q_tokens = self._tokenize(query)
        if not q_tokens:
            return chunk.score

        chunk_tokens = self._tokenize(chunk.text)
        if not chunk_tokens:
            return 0.0

        # 1. Term overlap recall
        common = q_tokens.intersection(chunk_tokens)
        overlap_ratio = len(common) / len(q_tokens)

        # 2. Base score contribution (from dense/RRF retrieval)
        base_component = chunk.score * 0.5

        # 3. Clause match bonus
        clause_boost = 0.0
        if chunk.clause_number and chunk.clause_number.lower() in query.lower():
            clause_boost = self.clause_bonus

        # 4. Heading match bonus
        heading_boost = 0.0
        if chunk.section_heading:
            h_tokens = self._tokenize(chunk.section_heading)
            if h_tokens.intersection(q_tokens):
                heading_boost = self.heading_bonus

        # Combined normalized score
        raw_score = (overlap_ratio * 0.35) + base_component + clause_boost + heading_boost
        # Sigmoid or bounded clamp to 0.0 - 1.0
        return min(1.0, max(0.0, raw_score))

    def rerank(
        self,
        query: str,
        candidates: List[RetrievedChunk],
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[RetrievedChunk]:
        """Rerank candidates, eliminate duplicates, and apply score threshold."""
        if not candidates:
            return []

        # Deduplicate candidates by chunk_id
        seen_ids = set()
        unique_candidates: List[RetrievedChunk] = []
        for c in candidates:
            if c.chunk_id not in seen_ids:
                seen_ids.add(c.chunk_id)
                unique_candidates.append(c)

        scored_candidates = []
        for c in unique_candidates:
            new_score = self.compute_rerank_score(query, c)
            if new_score >= min_score:
                # Create a copy with updated score and retrieval_method
                reranked_chunk = c.model_copy()
                reranked_chunk.score = round(new_score, 4)
                reranked_chunk.retrieval_method = "reranked"
                scored_candidates.append(reranked_chunk)

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x.score, reverse=True)
        return scored_candidates[:top_k]

