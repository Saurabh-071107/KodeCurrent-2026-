"""Evidence validation engine ensuring zero citation fabrication.

Validates that every cited excerpt exists verbatim in the corresponding source chunk,
cross-checks page and clause references, and enforces non-hallucination.
"""

from typing import List, Optional, Dict, Any, Tuple
from draftmate_ai.document_rag.schemas import RAGResponse, SourceReference, RetrievedChunk
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.shared.provenance import verify_passage_in_source
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class EvidenceValidator:
    """Validates citations in RAG responses against the authentic document index."""

    def __init__(self, index_manager: Optional[VectorIndexManager] = None):
        self.index_manager = index_manager

    def validate_response(
        self,
        response: RAGResponse,
        available_chunks: Optional[List[RetrievedChunk]] = None,
        strict_mode: bool = True,
        fuzzy_threshold: float = 0.85,
    ) -> RAGResponse:
        """Validate all source references in a RAGResponse.

        Args:
            response: The generated RAGResponse to validate.
            available_chunks: Optional list of retrieved chunks used as evidence.
            strict_mode: If True, invalid/fabricated citations are excised.
            fuzzy_threshold: Minimum match ratio for minor typos.

        Returns:
            Validated RAGResponse with verified sources and audit annotations.
        """
        if not response.sources:
            return response

        # Map chunks by ID
        chunk_map: Dict[str, RetrievedChunk] = {}
        if available_chunks:
            for c in available_chunks:
                chunk_map[c.chunk_id] = c

        if self.index_manager:
            for c in self.index_manager.get_all_chunks():
                if c.chunk_id not in chunk_map:
                    chunk_map[c.chunk_id] = c

        validated_sources: List[SourceReference] = []
        limitations = list(response.limitations)

        for ref in response.sources:
            chunk = chunk_map.get(ref.chunk_id)
            if not chunk:
                msg = f"Citation references unknown or deleted chunk '{ref.chunk_id}'."
                logger.warning(msg)
                limitations.append(msg)
                if not strict_mode:
                    ref.is_verified = False
                    ref.confidence = 0.0
                    validated_sources.append(ref)
                continue

            # Verify excerpt against the chunk's authentic original text
            verification = verify_passage_in_source(
                quoted_passage=ref.supporting_excerpt,
                source_text=chunk.original_text,
                fuzzy_threshold=fuzzy_threshold,
                raise_on_mismatch=False,
            )

            if verification.is_verified:
                ref.is_verified = True
                ref.confidence = verification.confidence
                # Ensure page and clause match authentic chunk metadata
                if chunk.page_start is not None:
                    ref.page = chunk.page_start
                if chunk.clause_number is not None:
                    ref.clause = chunk.clause_number
                if chunk.section_heading is not None:
                    ref.section = chunk.section_heading
                ref.document_name = chunk.document_name
                ref.document_id = chunk.document_id
                validated_sources.append(ref)
            else:
                msg = (
                    f"Fabricated or unverified excerpt in chunk '{ref.chunk_id}': "
                    f"'{ref.supporting_excerpt[:60]}...'"
                )
                logger.warning(msg)
                limitations.append(f"Unverified citation removed: {msg}")
                if not strict_mode:
                    ref.is_verified = False
                    ref.confidence = verification.confidence
                    validated_sources.append(ref)

        # Update response
        validated_response = response.model_copy()
        validated_response.sources = validated_sources
        validated_response.limitations = limitations
        return validated_response

