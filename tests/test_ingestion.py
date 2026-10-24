"""Tests for the ingestion pipeline, format validation, and size limit checks."""

import pytest
from draftmate_ai.document_processing.ingestion import (
    ingest_document,
    detect_and_validate_format,
    get_ingestion_summary,
)
from draftmate_ai.shared.configuration import get_settings
from draftmate_ai.shared.exceptions import (
    UnsupportedFileFormatError,
    FileCorruptedError,
    FileSizeLimitExceededError,
    EmptyDocumentError,
)


def test_ingest_pdf_pipeline(sample_pdf_bytes):
    """Test full ingestion pipeline on PDF document."""
    doc = ingest_document(source=sample_pdf_bytes, filename="agreement.pdf")
    assert doc.metadata.filename == "agreement.pdf"
    assert doc.metadata.file_type == "pdf"
    assert len(doc.elements) > 0
    assert len(doc.chunks) > 0

    summary = get_ingestion_summary(doc, duration_ms=125.0)
    assert summary.filename == "agreement.pdf"
    assert summary.chunk_count == len(doc.chunks)
    assert summary.processing_time_ms == 125.0


def test_ingest_docx_pipeline(sample_docx_bytes):
    """Test full ingestion pipeline on DOCX document."""
    doc = ingest_document(source=sample_docx_bytes, filename="contract.docx")
    assert doc.metadata.filename == "contract.docx"
    assert doc.metadata.file_type == "docx"
    assert len(doc.elements) > 0
    assert len(doc.chunks) > 0


def test_ingest_txt_pipeline(sample_legal_text):
    """Test full ingestion pipeline on TXT document."""
    doc = ingest_document(source=sample_legal_text.encode("utf-8"), filename="lease.txt")
    assert doc.metadata.filename == "lease.txt"
    assert doc.metadata.file_type == "txt"
    assert len(doc.elements) > 0
    assert len(doc.chunks) > 0


def test_ingestion_unsupported_extension():
    """Test rejection of unsupported file extensions."""
    with pytest.raises(UnsupportedFileFormatError):
        detect_and_validate_format(b"Some text", filename="script.sh")

    with pytest.raises(UnsupportedFileFormatError):
        detect_and_validate_format(b"Some image", filename="image.png")


def test_ingestion_conflicting_magic_bytes():
    """Test detecting mismatch between filename extension and actual magic bytes."""
    # PDF bytes given a .docx extension
    pdf_header = b"%PDF-1.7\nSample content"
    with pytest.raises(UnsupportedFileFormatError):
        detect_and_validate_format(pdf_header, filename="fake.docx")


def test_ingestion_corrupted_header_for_extension():
    """Test that a file with .pdf extension but missing %PDF- header is rejected as corrupted."""
    with pytest.raises(FileCorruptedError):
        detect_and_validate_format(b"Hello world without PDF header", filename="bad.pdf")


def test_ingestion_empty_document():
    """Test rejection of empty 0-byte document."""
    with pytest.raises(EmptyDocumentError):
        ingest_document(b"", filename="empty.txt")


def test_ingestion_file_size_exceeded(monkeypatch):
    """Test rejecting files that exceed MAX_FILE_SIZE_MB limit."""
    settings = get_settings()
    # Temporarily set max file size to 1 KB for test
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_MB", 0.001)  # ~1000 bytes

    oversized_data = b"A" * 2000
    with pytest.raises(FileSizeLimitExceededError):
        ingest_document(oversized_data, filename="too_large.txt")

