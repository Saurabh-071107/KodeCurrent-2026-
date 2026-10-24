"""Document ingestion orchestrator and format validation pipeline."""

import io
import time
from pathlib import Path
from typing import Optional, Union, BinaryIO

from draftmate_ai.document_processing.chunking import StructureAwareChunker
from draftmate_ai.document_processing.docx_extractor import DOCXExtractor
from draftmate_ai.document_processing.pdf_extractor import PDFExtractor
from draftmate_ai.document_processing.text_extractor import TextExtractor
from draftmate_ai.shared.configuration import get_settings
from draftmate_ai.shared.document_models import ProcessedDocument
from draftmate_ai.shared.exceptions import (
    UnsupportedFileFormatError,
    FileCorruptedError,
    FileSizeLimitExceededError,
    EmptyDocumentError,
)
from draftmate_ai.shared.logging_utils import get_logger
from draftmate_ai.shared.schemas import ChunkingConfig, IngestionResponse

logger = get_logger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def detect_and_validate_format(
    raw_bytes: bytes,
    filename: Optional[str] = None,
) -> str:
    """Validate extension and inspect magic bytes to confirm file format.

    Returns:
        One of 'pdf', 'docx', 'txt'.

    Raises:
        UnsupportedFileFormatError: If extension is unsupported or content does not match.
        FileCorruptedError: If header is damaged or invalid.
    """
    ext = Path(filename).suffix.lower() if filename else ""

    if ext and ext not in SUPPORTED_EXTENSIONS:
        raise UnsupportedFileFormatError(
            f"Unsupported file format '{ext}'. DraftMate AI accepts: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    # Magic byte checks
    if raw_bytes.startswith(b"%PDF-"):
        if ext and ext != ".pdf":
            raise UnsupportedFileFormatError(
                f"File content is PDF, but filename has conflicting extension '{ext}'."
            )
        return "pdf"

    if raw_bytes.startswith(b"PK\x03\x04"):
        if ext and ext != ".docx":
            raise UnsupportedFileFormatError(
                f"File content is a ZIP archive (DOCX), but extension is '{ext}'."
            )
        return "docx"

    # If extension is pdf or docx but magic bytes don't match
    if ext == ".pdf":
        raise FileCorruptedError(
            f"File '{filename}' has a .pdf extension but lacks a valid '%PDF-' header."
        )

    if ext == ".docx":
        raise FileCorruptedError(
            f"File '{filename}' has a .docx extension but lacks a valid ZIP container header."
        )

    # Check for text vs binary
    if ext == ".txt" or not ext:
        if b"\x00" in raw_bytes and not (
            raw_bytes.startswith(b"\xff\xfe") or raw_bytes.startswith(b"\xfe\xff")
        ):
            raise UnsupportedFileFormatError("File contains binary data and cannot be parsed as plain text.")
        return "txt"

    raise UnsupportedFileFormatError(f"Unable to determine file format for '{filename}'.")


def ingest_document(
    source: Union[str, Path, bytes, BinaryIO],
    filename: Optional[str] = None,
    document_id: Optional[str] = None,
    chunking_config: Optional[ChunkingConfig] = None,
    enable_ocr: bool = True,
    strict_ocr: bool = False,
) -> ProcessedDocument:
    """Ingest, validate, extract, and chunk a document into a ProcessedDocument.

    Args:
        source: File path, bytes, or file-like object.
        filename: Optional filename override.
        document_id: Optional custom identifier.
        chunking_config: Custom chunking configuration.
        enable_ocr: Whether to run OCR on scanned pages.
        strict_ocr: Whether to fail if OCR is needed but unavailable.

    Returns:
        Fully populated ProcessedDocument including elements and chunks.
    """
    start_time = time.perf_counter()
    settings = get_settings()

    raw_bytes: bytes
    resolved_filename: str

    if isinstance(source, (str, Path)):
        p = Path(source)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {p}")
        resolved_filename = filename or p.name
        try:
            raw_bytes = p.read_bytes()
        except Exception as e:
            raise FileCorruptedError(f"Failed to read file '{p}': {e}") from e
    elif isinstance(source, bytes):
        raw_bytes = source
        resolved_filename = filename or "document.bin"
    elif hasattr(source, "read"):
        resolved_filename = filename or getattr(source, "name", "document.bin")
        try:
            source.seek(0)
            data = source.read()
            raw_bytes = data.encode("utf-8") if isinstance(data, str) else data
        except Exception as e:
            raise FileCorruptedError(f"Failed reading stream: {e}") from e
    else:
        raise ValueError("Source must be a file path, bytes, or file-like object.")

    # 1. Size Validation
    if not raw_bytes or len(raw_bytes.strip()) == 0:
        raise EmptyDocumentError(f"Document '{resolved_filename}' is empty (0 bytes).")

    if len(raw_bytes) > settings.max_file_size_bytes:
        raise FileSizeLimitExceededError(
            f"File '{resolved_filename}' ({len(raw_bytes)/(1024*1024):.2f} MB) exceeds maximum allowed size "
            f"of {settings.MAX_FILE_SIZE_MB} MB."
        )

    # 2. Format Validation
    file_format = detect_and_validate_format(raw_bytes, filename=resolved_filename)

    # 3. Extraction Dispatch
    logger.info(f"Ingesting {file_format.upper()} document '{resolved_filename}' ({len(raw_bytes)} bytes)")

    if file_format == "pdf":
        extractor = PDFExtractor(enable_ocr=enable_ocr, strict_ocr=strict_ocr)
        processed_doc = extractor.extract(
            source=raw_bytes,
            filename=resolved_filename,
            document_id=document_id,
        )
    elif file_format == "docx":
        extractor = DOCXExtractor()
        processed_doc = extractor.extract(
            source=raw_bytes,
            filename=resolved_filename,
            document_id=document_id,
        )
    elif file_format == "txt":
        extractor = TextExtractor()
        processed_doc = extractor.extract(
            source=raw_bytes,
            filename=resolved_filename,
            document_id=document_id,
        )
    else:
        raise UnsupportedFileFormatError(f"Unsupported format: {file_format}")

    # 4. Chunking
    chunker = StructureAwareChunker(config=chunking_config)
    chunks = chunker.chunk_document(processed_doc)
    processed_doc.chunks = chunks

    duration_ms = (time.perf_counter() - start_time) * 1000.0
    logger.info(
        f"Successfully processed '{resolved_filename}': {len(processed_doc.elements)} elements, "
        f"{len(chunks)} chunks in {duration_ms:.1f}ms."
    )

    return processed_doc


def get_ingestion_summary(doc: ProcessedDocument, duration_ms: float = 0.0) -> IngestionResponse:
    """Generate IngestionResponse summary from a ProcessedDocument."""
    return IngestionResponse(
        document_id=doc.metadata.document_id,
        filename=doc.metadata.filename,
        file_type=doc.metadata.file_type,
        page_count=doc.metadata.page_count,
        element_count=len(doc.elements),
        chunk_count=len(doc.chunks),
        raw_character_count=len(doc.raw_text),
        extraction_method=doc.metadata.extraction_method,
        processing_warnings=doc.metadata.processing_warnings,
        processing_time_ms=round(duration_ms, 2),
    )

