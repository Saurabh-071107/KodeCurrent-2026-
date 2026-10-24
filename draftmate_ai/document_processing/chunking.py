"""Structure-aware, deterministic document chunking engine.

Preserves legal clause boundaries, section headings, paragraph cohesion,
and tracks granular provenance references for every chunk.
"""

import re
from typing import List, Optional, Tuple

from draftmate_ai.shared.document_models import (
    ProcessedDocument,
    StructuralElement,
    DocumentChunk,
    ElementType,
)
from draftmate_ai.shared.schemas import ChunkingConfig
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Sentence boundary regex for safe splitting of oversized elements
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


def split_text_with_overlap(
    text: str,
    original_text: str,
    chunk_size: int,
    chunk_overlap: int,
) -> List[Tuple[str, str]]:
    """Safely split an oversized text block into smaller pieces respecting sentence boundaries.

    Returns:
        List of (sub_normalized_text, sub_original_text) tuples.
    """
    sentences = SENTENCE_SPLIT_RE.split(text)
    if not sentences:
        sentences = [text]

    chunks: List[Tuple[str, str]] = []
    current_sentences: List[str] = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)
        if current_len + sent_len > chunk_size and current_sentences:
            chunk_str = " ".join(current_sentences)
            # Find approximate corresponding original text substring or use normalized
            chunks.append((chunk_str, chunk_str))

            # Overlap management
            overlap_sentences: List[str] = []
            overlap_len = 0
            for s in reversed(current_sentences):
                if overlap_len + len(s) <= chunk_overlap:
                    overlap_sentences.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            current_sentences = overlap_sentences
            current_len = sum(len(s) for s in current_sentences)

        current_sentences.append(sent)
        current_len += sent_len

    if current_sentences:
        chunk_str = " ".join(current_sentences)
        chunks.append((chunk_str, chunk_str))

    return chunks


class StructureAwareChunker:
    """Configurable, structure-aware document chunker."""

    def __init__(self, config: Optional[ChunkingConfig] = None):
        self.config = config or ChunkingConfig()

    def chunk_document(self, document: ProcessedDocument) -> List[DocumentChunk]:
        """Convert a ProcessedDocument into structure-aware, deterministic DocumentChunks."""
        if not document.elements:
            return []

        chunks: List[DocumentChunk] = []
        chunk_index = 0

        current_elements: List[StructuralElement] = []
        current_text_parts: List[str] = []
        current_orig_parts: List[str] = []
        current_char_count = 0
        current_active_heading: Optional[str] = None
        current_active_clause: Optional[str] = None

        def flush_chunk() -> None:
            nonlocal chunk_index, current_elements, current_text_parts, current_orig_parts, current_char_count
            if not current_elements:
                return

            chunk_index += 1
            chunk_id = f"{document.metadata.document_id}_chunk_{chunk_index:04d}"

            # Calculate page span
            pages = [el.page_number for el in current_elements if el.page_number is not None]
            page_start = min(pages) if pages else None
            page_end = max(pages) if pages else None

            # Collect paragraph numbers
            paras = sorted(list({el.paragraph_number for el in current_elements if el.paragraph_number is not None}))

            # Collect element IDs
            elem_ids = [el.element_id for el in current_elements]

            full_chunk_text = "\n\n".join(current_text_parts)
            full_orig_text = "\n\n".join(current_orig_parts)

            # Estimate token count (~1.3 tokens per word)
            estimated_tokens = int(len(full_chunk_text.split()) * 1.3)

            chunk = DocumentChunk(
                chunk_id=chunk_id,
                document_id=document.metadata.document_id,
                chunk_index=chunk_index,
                text=full_chunk_text,
                original_text=full_orig_text,
                page_start=page_start,
                page_end=page_end,
                section_heading=current_active_heading,
                clause_number=current_active_clause,
                paragraph_numbers=paras,
                element_ids=elem_ids,
                extraction_method=document.metadata.extraction_method,
                token_count=estimated_tokens,
                character_count=len(full_chunk_text),
                metadata={
                    "filename": document.metadata.filename,
                    "element_count": len(current_elements),
                },
            )
            chunks.append(chunk)

            # Handle overlap if configured
            if self.config.chunk_overlap > 0 and len(current_elements) > 1:
                # Retain the last element if its length is within overlap limit
                last_el = current_elements[-1]
                if len(last_el.normalized_text) <= self.config.chunk_overlap:
                    current_elements = [last_el]
                    current_text_parts = [last_el.normalized_text]
                    current_orig_parts = [last_el.original_text]
                    current_char_count = len(last_el.normalized_text)
                    return

            # Clear buffer
            current_elements = []
            current_text_parts = []
            current_orig_parts = []
            current_char_count = 0

        for element in document.elements:
            # Handle Headings
            if element.element_type == ElementType.HEADING:
                current_active_heading = element.normalized_text
                # If current buffer has accumulated enough text, flush before starting new section
                if current_char_count >= self.config.min_chunk_size:
                    flush_chunk()
                # Attach heading context if configured
                continue

            # Update active clause if this element specifies a clause
            if element.clause_number:
                # If clause boundary preservation is active and we encounter a new clause
                if (
                    self.config.preserve_clause_boundaries
                    and current_active_clause
                    and element.clause_number != current_active_clause
                    and current_char_count >= self.config.min_chunk_size
                ):
                    flush_chunk()
                current_active_clause = element.clause_number

            el_text = element.normalized_text
            el_orig = element.original_text

            # If attach_heading_to_content is True and we're starting a new chunk with an active heading
            formatted_text = el_text
            if (
                self.config.attach_heading_to_content
                and current_active_heading
                and not current_elements
            ):
                formatted_text = f"[{current_active_heading}]\n{el_text}"

            el_len = len(formatted_text)

            # Check if this single element is exceptionally long (> chunk_size)
            if el_len > self.config.chunk_size:
                # Flush existing buffer first
                if current_elements:
                    flush_chunk()

                # Split the oversized element safely
                sub_parts = split_text_with_overlap(
                    formatted_text,
                    el_orig,
                    chunk_size=self.config.chunk_size,
                    chunk_overlap=self.config.chunk_overlap,
                )
                for sub_norm, sub_raw in sub_parts:
                    current_elements = [element]
                    current_text_parts = [sub_norm]
                    current_orig_parts = [sub_raw]
                    current_char_count = len(sub_norm)
                    flush_chunk()
                continue

            # Check if adding this element would exceed the chunk size
            if current_char_count + el_len > self.config.chunk_size and current_elements:
                flush_chunk()
                if self.config.attach_heading_to_content and current_active_heading:
                    formatted_text = f"[{current_active_heading}]\n{el_text}"
                    el_len = len(formatted_text)

            # Add to current chunk
            current_elements.append(element)
            current_text_parts.append(formatted_text)
            current_orig_parts.append(el_orig)
            current_char_count += el_len

        # Flush any remaining elements
        if current_elements:
            flush_chunk()

        return chunks

