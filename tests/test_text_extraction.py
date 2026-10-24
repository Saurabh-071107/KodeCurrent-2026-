"""Tests for plain text extraction and multi-encoding handling."""

import pytest
from draftmate_ai.document_processing.text_extractor import TextExtractor, decode_bytes
from draftmate_ai.shared.exceptions import EmptyDocumentError, FileCorruptedError


def test_text_extraction_valid(sample_legal_text):
    """Test extracting structure, headings, and clauses from plain text."""
    extractor = TextExtractor()
    doc = extractor.extract(sample_legal_text.encode("utf-8"), filename="lease.txt")

    assert doc.metadata.filename == "lease.txt"
    assert doc.metadata.file_type == "txt"
    assert doc.metadata.page_count == 1
    assert doc.metadata.extraction_method == "text_extractor"

    # Headings
    headings = doc.get_headings()
    assert len(headings) >= 2
    assert any("COMMERCIAL LEASE" in h.normalized_text for h in headings)

    # Clauses
    clauses = doc.get_clauses()
    assert len(clauses) >= 2
    clause_numbers = [c.clause_number for c in clauses if c.clause_number]
    assert any("2.1" in cn or "Section 2.1" in cn for cn in clause_numbers)


@pytest.mark.parametrize("encoding", ["utf-8", "utf-8-sig", "utf-16", "cp1252", "latin-1"])
def test_text_extraction_encodings(encoding):
    """Test decoding text saved with various character encodings."""
    # Use characters compatible across single-byte European encodings (£, café, naïve)
    content = "ARTICLE 1: CONFIDENTIALITY\n\nEach party shall protect proprietary information: café, naïve, £100."
    encoded_bytes = content.encode(encoding)

    extractor = TextExtractor()
    doc = extractor.extract(encoded_bytes, filename=f"test_{encoding}.txt")

    assert "CONFIDENTIALITY" in doc.raw_text
    assert "café" in doc.raw_text or "caf" in doc.raw_text


def test_text_extraction_cp1252_euro_symbol():
    """Test Windows CP1252 specific Euro symbol (€) decoding."""
    content = "ARTICLE 2: FEES\n\nPayment amount: €5,000."
    encoded_bytes = content.encode("cp1252")

    extractor = TextExtractor()
    doc = extractor.extract(encoded_bytes, filename="euro_cp1252.txt")
    assert "€5,000" in doc.raw_text


def test_text_extraction_empty():
    """Test zero-byte text file."""
    extractor = TextExtractor()
    with pytest.raises(EmptyDocumentError):
        extractor.extract(b"", filename="empty.txt")


def test_text_extraction_whitespace_only():
    """Test whitespace-only text file."""
    extractor = TextExtractor()
    with pytest.raises(EmptyDocumentError):
        extractor.extract(b"   \n\n   \t  \n  ", filename="whitespace.txt")


def test_text_extraction_binary_detection():
    """Test that a binary file with high null-byte density is rejected."""
    binary_data = b"\x00\x01\x00\x02\x00\x03\x00\x04" * 50
    extractor = TextExtractor()
    with pytest.raises(FileCorruptedError):
        extractor.extract(binary_data, filename="binary.txt")

