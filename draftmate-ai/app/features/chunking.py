"""Document chunking module."""
import re
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class DocumentChunk:
    """A chunk of document text with metadata."""
    chunk_id: str
    document_id: str
    text: str
    page_number: Optional[int]
    source_filename: str
    file_type: str
    start_char: int
    end_char: int
    metadata: Dict[str, Any] = field(default_factory=dict)


def generate_chunk_id(document_id: str, index: int, text: str) -> str:
    """Generate a deterministic chunk ID."""
    content_hash = hashlib.md5(text.encode()).hexdigest()[:8]
    return f"{document_id}_chunk_{index}_{content_hash}"


def split_text_into_chunks(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
    separators: List[str] = None,
) -> List[Tuple[str, int, int]]:
    """
    Split text into overlapping chunks.
    
    Args:
        text: Text to split
        chunk_size: Maximum characters per chunk
        chunk_overlap: Overlap between chunks
        separators: Preferred split points (paragraphs, sentences, etc.)
        
    Returns:
        List of (chunk_text, start_char, end_char) tuples
    """
    if separators is None:
        separators = ["\n\n", "\n", ". ", " ", ""]

    if len(text) <= chunk_size:
        return [(text, 0, len(text))]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        # Try to find a good split point
        if end < len(text):
            # Look for separators near the end
            for sep in separators:
                if sep:
                    # Search backwards from end for separator
                    sep_pos = text.rfind(sep, start, end)
                    if sep_pos != -1 and sep_pos > start:
                        end = sep_pos + len(sep)
                        break

        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append((chunk_text, start, end))

        # Move start position with overlap
        if end >= len(text):
            break
        start = max(start + 1, end - chunk_overlap)

    return chunks


def create_chunks_from_document(
    document_id: str,
    document_text_chunks: List[Tuple[str, Dict[str, Any]]],
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> List[DocumentChunk]:
    """
    Create DocumentChunk objects from parsed document text.
    
    Args:
        document_id: Unique document identifier
        document_text_chunks: List of (text, page_metadata) from document parsing
        chunk_size: Maximum characters per chunk
        chunk_overlap: Overlap between chunks
        
    Returns:
        List of DocumentChunk objects
    """
    all_chunks = []
    chunk_index = 0

    for page_text, page_metadata in document_text_chunks:
        page_number = page_metadata.get("page_number")
        source_filename = page_metadata.get("source_filename", "")
        file_type = page_metadata.get("file_type", "")

        # Split page text into chunks
        text_chunks = split_text_into_chunks(page_text, chunk_size, chunk_overlap)

        for chunk_text, start_char, end_char in text_chunks:
            chunk_id = generate_chunk_id(document_id, chunk_index, chunk_text)
            chunk = DocumentChunk(
                chunk_id=chunk_id,
                document_id=document_id,
                text=chunk_text,
                page_number=page_number,
                source_filename=source_filename,
                file_type=file_type,
                start_char=start_char,
                end_char=end_char,
                metadata={
                    **page_metadata,
                    "chunk_index": chunk_index,
                },
            )
            all_chunks.append(chunk)
            chunk_index += 1

    logger.info("chunks_created", document_id=document_id, chunk_count=len(all_chunks))
    return all_chunks


class ChunkStore:
    """In-memory chunk store with optional persistence."""

    def __init__(self):
        self._chunks: Dict[str, DocumentChunk] = {}
        self._document_chunks: Dict[str, List[str]] = {}  # doc_id -> list of chunk_ids

    def add_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Add chunks to the store."""
        for chunk in chunks:
            self._chunks[chunk.chunk_id] = chunk
            if chunk.document_id not in self._document_chunks:
                self._document_chunks[chunk.document_id] = []
            self._document_chunks[chunk.document_id].append(chunk.chunk_id)

    def get_chunk(self, chunk_id: str) -> Optional[DocumentChunk]:
        """Get a chunk by ID."""
        return self._chunks.get(chunk_id)

    def get_document_chunks(self, document_id: str) -> List[DocumentChunk]:
        """Get all chunks for a document."""
        chunk_ids = self._document_chunks.get(document_id, [])
        return [self._chunks[cid] for cid in chunk_ids if cid in self._chunks]

    def get_chunks_by_document_ids(self, document_ids: List[str]) -> List[DocumentChunk]:
        """Get chunks for multiple documents."""
        chunks = []
        for doc_id in document_ids:
            chunks.extend(self.get_document_chunks(doc_id))
        return chunks

    def delete_document_chunks(self, document_id: str) -> int:
        """Delete all chunks for a document. Returns count deleted."""
        chunk_ids = self._document_chunks.pop(document_id, [])
        count = 0
        for cid in chunk_ids:
            if cid in self._chunks:
                del self._chunks[cid]
                count += 1
        return count

    def clear(self) -> None:
        """Clear all chunks."""
        self._chunks.clear()
        self._document_chunks.clear()

    def __len__(self) -> int:
        return len(self._chunks)


# Global chunk store
_chunk_store: Optional[ChunkStore] = None


def get_chunk_store() -> ChunkStore:
    """Get global chunk store instance."""
    global _chunk_store
    if _chunk_store is None:
        _chunk_store = ChunkStore()
    return _chunk_store