"""Document management feature module."""
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog

from app.config import get_settings
from app.core.storage import get_document_store, initialize_document_store, DocumentRecord
from app.features.document_parsing import (
    parse_document,
    extract_text_for_chunking,
    DocumentParsingError,
    UnsupportedFileTypeError,
    FileTooLargeError,
)
from app.features.chunking import (
    create_chunks_from_document,
    get_chunk_store,
    DocumentChunk,
)
from app.features.retriever_instance import get_retriever, initialize_retriever

logger = structlog.get_logger(__name__)


class DocumentUploadError(Exception):
    """Document upload specific errors."""
    pass


async def upload_document(
    file_content: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> DocumentRecord:
    """
    Upload and process a document.
    
    Args:
        file_content: Raw file bytes
        filename: Original filename
        content_type: MIME content type (optional)
        
    Returns:
        DocumentRecord with metadata
    """
    settings = get_settings()
    upload_dir = Path(settings.document.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Validate extension
    ext = Path(filename).suffix.lower()
    allowed = settings.document.allowed_extensions
    if ext not in allowed:
        raise DocumentUploadError(
            f"File type {ext} not allowed. Allowed: {allowed}"
        )

    # Validate size
    file_size = len(file_content)
    max_size = settings.document.max_file_size_mb * 1024 * 1024
    if file_size > max_size:
        raise DocumentUploadError(
            f"File size ({file_size / (1024*1024):.1f} MB) exceeds limit ({settings.document.max_file_size_mb} MB)"
        )

    # Generate document ID and save file
    document_id = str(uuid.uuid4())
    safe_filename = f"{document_id}_{ext}"
    file_path = upload_dir / safe_filename

    # Write file
    file_path.write_bytes(file_content)

    # Create document record
    record = DocumentRecord(
        id=document_id,
        filename=filename,
        file_type=ext[1:],  # Remove dot
        file_size=file_size,
        upload_timestamp=datetime.utcnow(),
        extraction_status="pending",
        extraction_error=None,
        metadata={
            "content_type": content_type,
            "stored_filename": safe_filename,
        },
        chunk_count=0,
    )

    # Store record
    store = get_document_store()
    await store.create(record)

    # Process asynchronously (in background)
    # For now, process synchronously
    try:
        await _process_document(document_id, file_path, ext)
    except (DocumentParsingError, UnsupportedFileTypeError, FileTooLargeError) as e:
        logger.error("document_processing_failed", document_id=document_id, error=str(e))
        await store.update_status(document_id, "failed", error=str(e))
        raise DocumentUploadError(str(e)) from e
    except Exception as e:
        logger.error("document_processing_failed", document_id=document_id, error=str(e))
        await store.update_status(document_id, "failed", error=str(e))
        raise DocumentUploadError(f"Processing error: {e}") from e

    return await store.get(document_id)


async def _process_document(document_id: str, file_path: Path, ext: str) -> None:
    """Process document: parse, chunk, and index."""
    store = get_document_store()
    chunk_store = get_chunk_store()

    # Update status to processing
    await store.update_status(document_id, "processing")

    # Parse document
    parsed = parse_document(
        file_path,
        max_size_mb=get_settings().document.max_file_size_mb,
        allowed_extensions=get_settings().document.allowed_extensions,
    )

    # Extract text for chunking
    text_chunks = extract_text_for_chunking(parsed)

    # Create chunks
    chunks = create_chunks_from_document(
        document_id,
        text_chunks,
        chunk_size=get_settings().document.chunk_size,
        chunk_overlap=get_settings().document.chunk_overlap,
    )

    # Store chunks
    chunk_store.add_chunks(chunks)

    # Rebuild retrieval index
    await _rebuild_retrieval_index()

    # Update document record
    await store.update_metadata(document_id, {
        "page_count": parsed.total_pages,
        "parsed_metadata": parsed.metadata,
    })
    await store.update_status(document_id, "completed", chunk_count=len(chunks))

    logger.info("document_processed", document_id=document_id, chunks=len(chunks))


async def _rebuild_retrieval_index() -> None:
    """Rebuild the retrieval index from all chunks."""
    chunk_store = get_chunk_store()
    retriever = get_retriever()

    # Convert chunks to dict format for retriever
    chunks = []
    for chunk in chunk_store._chunks.values():
        chunks.append({
            "chunk_id": chunk.chunk_id,
            "document_id": chunk.document_id,
            "text": chunk.text,
            "source_filename": chunk.source_filename,
            "page_number": chunk.page_number,
            "file_type": chunk.file_type,
            "metadata": chunk.metadata,
        })

    retriever.build_index(chunks)


async def list_documents(
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None,
) -> List[DocumentRecord]:
    """List documents with optional filtering."""
    store = get_document_store()
    return await store.list(limit=limit, offset=offset, status=status)


async def get_document(document_id: str) -> Optional[DocumentRecord]:
    """Get document by ID."""
    store = get_document_store()
    return await store.get(document_id)


async def delete_document(document_id: str) -> bool:
    """
    Delete a document and its chunks.
    
    Args:
        document_id: Document ID to delete
        
    Returns:
        True if deleted, False if not found
    """
    store = get_document_store()
    chunk_store = get_chunk_store()

    # Get document record first
    record = await store.get(document_id)
    if record is None:
        return False

    # Delete file from disk
    upload_dir = Path(get_settings().document.upload_dir)
    file_path = upload_dir / record.metadata.get("stored_filename", "")
    if file_path.exists():
        file_path.unlink()

    # Delete chunks
    chunk_store.delete_document_chunks(document_id)

    # Rebuild retrieval index
    await _rebuild_retrieval_index()

    # Delete record
    return await store.delete(document_id)


async def get_document_chunks(document_id: str) -> List[DocumentChunk]:
    """Get all chunks for a document."""
    chunk_store = get_chunk_store()
    return chunk_store.get_document_chunks(document_id)


async def initialize_documents() -> None:
    """Initialize document storage and retrieval."""
    await initialize_document_store()
    await initialize_retriever()

    # Rebuild index from existing chunks
    await _rebuild_retrieval_index()