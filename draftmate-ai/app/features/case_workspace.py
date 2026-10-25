"""Case workspace and document intake feature module."""
import hashlib
import json
import uuid
import structlog
from typing import Any, Dict, List, Optional
from datetime import datetime
from pathlib import Path

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.core.storage import get_document_store, initialize_document_store, DocumentRecord
from app.features.document_parsing import (
    parse_document,
    extract_text_for_chunking,
    DocumentParsingError,
    UnsupportedFileTypeError,
    FileTooLargeError,
)
from app.features.chunking import create_chunks_from_document, get_chunk_store, DocumentChunk
from app.features.retriever_instance import get_retriever, initialize_retriever
from app.schemas import (
    CaseWorkspaceCreateRequest,
    CaseWorkspaceResponse,
    CaseDocumentInfo,
    CaseDocumentCategory,
    CaseDocumentType,
    CaseDocumentUploadResponse,
    PartyInfo,
)

logger = structlog.get_logger(__name__)


class CaseWorkspaceError(Exception):
    """Case workspace specific errors."""
    pass


def _parse_datetime(val: Any, default: Optional[datetime] = None) -> datetime:
    """Safely parse a datetime or ISO string."""
    if isinstance(val, datetime):
        return val
    if isinstance(val, str) and val:
        try:
            return datetime.fromisoformat(val.replace("Z", ""))
        except Exception:
            pass
    return default if default is not None else datetime.utcnow()


async def create_case_workspace(request: 'CaseWorkspaceCreateRequest') -> CaseWorkspaceResponse:
    """
    Create a new case workspace.
    
    Args:
        request: CaseWorkspaceCreateRequest with case details
        
    Returns:
        CaseWorkspaceResponse with created workspace
    """
    settings = get_settings()
    upload_dir = Path(settings.document.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate case ID
    case_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Create workspace directory
    case_dir = upload_dir / "cases" / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    
    # Store in document store
    store = get_document_store()
    # Store as a special document record
    record = DocumentRecord(
        id=case_id,
        filename=f"case_{request.case_name}",
        file_type="case_workspace",
        file_size=0,
        upload_timestamp=now,
        extraction_status="completed",
        extraction_error=None,
        metadata={
            "case_name": request.case_name,
            "case_number": request.case_number,
            "court": request.court,
            "jurisdiction": request.jurisdiction,
            "case_type": request.case_type,
            "parties": [p.model_dump() for p in request.parties],
            "description": request.description,
            "is_case_workspace": True,
            "documents": [],
            "document_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        chunk_count=0,
    )
    await store.create(record)
    
    logger.info("case_workspace_created", case_id=case_id, case_name=request.case_name)
    
    return CaseWorkspaceResponse(
        case_id=case_id,
        case_name=request.case_name,
        case_number=request.case_number,
        court=request.court,
        jurisdiction=request.jurisdiction,
        case_type=request.case_type,
        parties=request.parties,
        description=request.description,
        created_at=now,
        updated_at=now,
        documents=[],
        document_count=0,
    )


async def list_case_workspaces(
    limit: int = 20,
    offset: int = 0,
) -> List[CaseWorkspaceResponse]:
    """List all case workspaces."""
    store = get_document_store()
    # Query for case workspaces
    records = await store.list(limit=limit, offset=offset, status=None)
    cases = [r for r in records if r.metadata.get("is_case_workspace")]
    
    result = []
    for r in cases:
        created_at = _parse_datetime(r.upload_timestamp)
        updated_at = _parse_datetime(r.metadata.get("updated_at"), default=created_at)
        result.append(
            CaseWorkspaceResponse(
                case_id=r.id,
                case_name=r.metadata.get("case_name", ""),
                case_number=r.metadata.get("case_number"),
                court=r.metadata.get("court"),
                jurisdiction=r.metadata.get("jurisdiction"),
                case_type=r.metadata.get("case_type"),
                parties=[PartyInfo(**p) for p in r.metadata.get("parties", [])],
                description=r.metadata.get("description"),
                created_at=created_at,
                updated_at=updated_at,
                documents=[CaseDocumentInfo(**d) for d in r.metadata.get("documents", [])],
                document_count=r.metadata.get("document_count", len(r.metadata.get("documents", []))),
            )
        )
    return result


async def get_case_workspace(case_id: str) -> Optional[CaseWorkspaceResponse]:
    """Get case workspace by ID."""
    store = get_document_store()
    record = await store.get(case_id)
    if record is None or not record.metadata.get("is_case_workspace"):
        return None
    
    created_at = _parse_datetime(record.upload_timestamp)
    updated_at = _parse_datetime(record.metadata.get("updated_at"), default=created_at)
    
    return CaseWorkspaceResponse(
        case_id=record.id,
        case_name=record.metadata.get("case_name", ""),
        case_number=record.metadata.get("case_number"),
        court=record.metadata.get("court"),
        jurisdiction=record.metadata.get("jurisdiction"),
        case_type=record.metadata.get("case_type"),
        parties=[PartyInfo(**p) for p in record.metadata.get("parties", [])],
        description=record.metadata.get("description"),
        created_at=created_at,
        updated_at=updated_at,
        documents=[CaseDocumentInfo(**d) for d in record.metadata.get("documents", [])],
        document_count=record.metadata.get("document_count", len(record.metadata.get("documents", []))),
    )


async def delete_case_workspace(case_id: str) -> bool:
    """Delete a case workspace and all its documents."""
    store = get_document_store()
    record = await store.get(case_id)
    if record is None or not record.metadata.get("is_case_workspace"):
        return False
    
    # Delete all associated documents
    chunk_store = get_chunk_store()
    doc_store = get_document_store()
    
    doc_ids = [d["document_id"] for d in record.metadata.get("documents", [])]
    for doc_id in doc_ids:
        chunk_store.delete_document_chunks(doc_id)
        await doc_store.delete(doc_id)
    
    # Delete file from disk
    upload_dir = Path(get_settings().document.upload_dir) / "cases" / case_id
    if upload_dir.exists():
        import shutil
        shutil.rmtree(upload_dir)
    
    # Delete case record
    await store.delete(case_id)
    
    logger.info("case_workspace_deleted", case_id=case_id)
    return True


async def upload_case_document(
    case_id: str,
    file_content: bytes,
    filename: str,
    category: str,
    document_type: str,
    content_type: Optional[str] = None,
    party_side: Optional[str] = None,
    description: Optional[str] = None,
) -> CaseDocumentUploadResponse:
    """
    Upload a document to a case workspace.
    
    Args:
        case_id: Case workspace ID
        file_content: Raw file bytes
        filename: Original filename
        category: Document category
        document_type: Document type
        content_type: MIME content type (optional)
        party_side: Which party's document (optional)
        description: Document description (optional)
        
    Returns:
        CaseDocumentUploadResponse with metadata
    """
    settings = get_settings()
    upload_dir = Path(settings.document.upload_dir) / "cases" / case_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Validate case exists
    store = get_document_store()
    case_record = await get_document_store().get(case_id)
    if not case_record or not case_record.metadata.get("is_case_workspace"):
        raise ValueError(f"Case workspace {case_id} not found")
    
    # Validate extension
    ext = Path(filename).suffix.lower()
    allowed = settings.document.allowed_extensions
    if ext not in allowed:
        raise ValueError(f"File type {ext} not allowed. Allowed: {allowed}")
    
    # Validate size
    file_size = len(file_content)
    max_size = settings.document.max_file_size_mb * 1024 * 1024
    if file_size > max_size:
        raise ValueError(f"File size exceeds limit ({settings.document.max_file_size_mb} MB)")
    
    # Generate document ID and save file
    document_id = str(uuid.uuid4())
    safe_filename = f"{document_id}_{ext}"
    file_path = upload_dir / safe_filename
    file_path.write_bytes(file_content)
    
    # Create document record
    record = DocumentRecord(
        id=document_id,
        filename=filename,
        file_type=ext[1:],
        file_size=file_size,
        upload_timestamp=datetime.utcnow(),
        extraction_status="pending",
        extraction_error=None,
        metadata={
            "case_id": case_id,
            "category": category,
            "document_type": document_type,
            "party_side": party_side,
            "description": description,
            "stored_filename": safe_filename,
            "content_type": content_type,
        },
        chunk_count=0,
    )
    
    store = get_document_store()
    await store.create(record)
    
    # Update case workspace metadata
    case_docs = case_record.metadata.get("documents", [])
    case_docs.append({
        "document_id": document_id,
        "category": category,
        "document_type": document_type,
        "original_filename": filename,
        "party_side": party_side,
        "description": description,
        "upload_timestamp": datetime.utcnow().isoformat(),
        "file_size": file_size,
    })
    case_record.metadata["documents"] = case_docs
    case_record.metadata["document_count"] = len(case_docs)
    case_record.metadata["updated_at"] = datetime.utcnow().isoformat()
    await store.update_metadata(case_id, case_record.metadata)
    
    # Process document
    try:
        await _process_case_document(document_id, file_path, ext)
    except Exception as e:
        logger.error("case_document_processing_failed", document_id=document_id, error=str(e))
        await store.update_status(document_id, "failed", error=str(e))
        raise
    
    updated_doc = await store.get(document_id)
    chunk_count = updated_doc.chunk_count if updated_doc else 0
    page_count = updated_doc.metadata.get("page_count") if updated_doc else None
    
    return CaseDocumentUploadResponse(
        document_id=document_id,
        case_id=case_id,
        category=category,
        document_type=document_type,
        original_filename=filename,
        file_size=file_size,
        upload_timestamp=datetime.utcnow(),
        extraction_status="completed",
        page_count=page_count,
        chunk_count=chunk_count,
    )


async def _process_case_document(document_id: str, file_path: Path, ext: str) -> None:
    """Process case document: parse, chunk, and index."""
    store = get_document_store()
    chunk_store = get_chunk_store()
    
    try:
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
        existing = await store.get(document_id)
        merged_meta = dict(existing.metadata) if existing and existing.metadata else {}
        merged_meta.update({
            "page_count": parsed.total_pages,
            "parsed_metadata": parsed.metadata,
        })
        await store.update_metadata(document_id, merged_meta)
        await store.update_status(document_id, "completed", chunk_count=len(chunks))
        
        logger.info("case_document_processed", document_id=document_id, chunks=len(chunks))
        
    except Exception as e:
        logger.error("case_document_processing_failed", document_id=document_id, error=str(e))
        store = get_document_store()
        await store.update_status(document_id, "failed", error=str(e))
        raise


async def _rebuild_retrieval_index() -> None:
    """Rebuild the retrieval index from all chunks."""
    chunk_store = get_chunk_store()
    retriever = get_retriever()
    
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


async def get_case_documents(case_id: str) -> List[DocumentRecord]:
    """Get all documents in a case workspace."""
    store = get_document_store()
    record = await store.get(case_id)
    if not record or not record.metadata.get("is_case_workspace"):
        return []
    
    doc_ids = [d["document_id"] for d in record.metadata.get("documents", [])]
    docs = []
    for doc_id in doc_ids:
        doc = await get_document_store().get(doc_id)
        if doc:
            docs.append(doc)
    return docs


async def delete_case_document(case_id: str, document_id: str) -> bool:
    """Delete a document from a case workspace."""
    store = get_document_store()
    
    # Verify case exists
    case_record = await store.get(case_id)
    if not case_record or not case_record.metadata.get("is_case_workspace"):
        return False
    
    # Verify document belongs to case
    doc_record = await store.get(document_id)
    if not doc_record or doc_record.metadata.get("case_id") != case_id:
        return False
    
    # Delete file from disk
    upload_dir = Path(get_settings().document.upload_dir) / "cases" / case_id
    file_path = upload_dir / doc_record.metadata.get("stored_filename", "")
    if file_path.exists():
        file_path.unlink()
    
    # Delete chunks
    chunk_store = get_chunk_store()
    chunk_store.delete_document_chunks(document_id)
    
    # Rebuild retrieval index
    await _rebuild_retrieval_index()
    
    # Remove from case metadata
    case_docs = case_record.metadata.get("documents", [])
    case_docs = [d for d in case_docs if d["document_id"] != document_id]
    case_record.metadata["documents"] = case_docs
    case_record.metadata["document_count"] = len(case_docs)
    case_record.metadata["updated_at"] = datetime.utcnow().isoformat()
    await store.update_metadata(case_id, case_record.metadata)
    
    # Delete document record
    await store.delete(document_id)
    
    return True


async def get_case_document(document_id: str):
    """Get a case document by ID."""
    store = get_document_store()
    return await store.get(document_id)


async def list_case_documents(
    case_id: str,
    limit: int = 100,
    offset: int = 0,
    category: Optional[str] = None,
) -> List[DocumentRecord]:
    """List documents in a case workspace."""
    store = get_document_store()
    record = await store.get(case_id)
    if not record or not record.metadata.get("is_case_workspace"):
        return []
    
    doc_ids = [d["document_id"] for d in record.metadata.get("documents", [])]
    docs = []
    for doc_id in doc_ids:
        doc = await get_document_store().get(doc_id)
        if doc:
            docs.append(doc)
    
    # Apply filters
    if category:
        docs = [d for d in docs if d.metadata.get("category") == category]
    
    # Apply pagination
    return docs[offset:offset+limit]


async def get_case_documents_chunks(case_id: str):
    """Get all chunks for all documents in a case."""
    from app.features.chunking import get_chunk_store
    chunk_store = get_chunk_store()
    
    # Get all documents in the case
    store = get_document_store()
    record = await store.get(case_id)
    if not record or not record.metadata.get("is_case_workspace"):
        return []
    
    doc_ids = [d["document_id"] for d in record.metadata.get("documents", [])]
    chunks = []
    for doc_id in doc_ids:
        doc_chunks = chunk_store.get_document_chunks(doc_id)
        chunks.extend(doc_chunks)
    return chunks


async def initialize_case_workspace() -> None:
    """Initialize case workspace storage."""
    await initialize_document_store()
    await initialize_retriever()
    await _rebuild_retrieval_index()