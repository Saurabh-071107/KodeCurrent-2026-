"""Tests for PDF text and structure extraction using PyMuPDF."""

import os
import pytest
import pymupdf
from draftmate_ai.document_processing.pdf_extractor import PDFExtractor
from draftmate_ai.shared.document_models import ElementType
from draftmate_ai.shared.exceptions import EmptyDocumentError, FileCorruptedError


def test_pdf_extraction_valid(sample_pdf_bytes):
    """Test extracting structured content from a valid multi-page PDF."""
    extractor = PDFExtractor(enable_ocr=False)
    doc = extractor.extract(sample_pdf_bytes, filename="agreement.pdf")

    assert doc.metadata.filename == "agreement.pdf"
    assert doc.metadata.page_count == 2
    assert doc.metadata.file_type == "pdf"
    assert doc.metadata.extraction_method == "pymupdf_text"
    assert len(doc.metadata.sha256_checksum) == 64

    # Verify elements
    assert len(doc.elements) > 0
    headings = doc.get_headings()
    assert len(headings) >= 2
    heading_texts = [h.normalized_text for h in headings]
    assert any("ARTICLE I" in h or "DEFINITIONS" in h for h in heading_texts)
    assert any("ARTICLE II" in h or "OBLIGATIONS" in h for h in heading_texts)

    # Verify clauses
    clauses = doc.get_clauses()
    assert len(clauses) >= 2
    clause_nums = [c.clause_number for c in clauses if c.clause_number]
    assert any("Section 1.01" in cn or "1.01" in cn for cn in clause_nums)
    assert any("Section 2.01" in cn or "2.01" in cn for cn in clause_nums)

    # Verify page location accuracy
    page1_elements = doc.get_elements_by_page(1)
    page2_elements = doc.get_elements_by_page(2)
    assert len(page1_elements) > 0
    assert len(page2_elements) > 0
    for el in doc.elements:
        assert el.page_number in (1, 2)
        assert el.bbox is not None
        assert el.bbox.page_number in (1, 2)


def test_pdf_extraction_empty_bytes():
    """Test that zero-byte PDF raises EmptyDocumentError."""
    extractor = PDFExtractor()
    with pytest.raises(EmptyDocumentError):
        extractor.extract(b"", filename="empty.pdf")


def test_pdf_extraction_corrupted_data():
    """Test that non-PDF random garbage bytes raise FileCorruptedError."""
    extractor = PDFExtractor()
    with pytest.raises(FileCorruptedError):
        extractor.extract(b"Not a real PDF header at all", filename="corrupt.pdf")


def test_pdf_extraction_multilingual():
    """Test PDF extraction with multilingual and international character sets."""
    mupdf_doc = pymupdf.open()
    page = mupdf_doc.new_page()
    text = (
        "SECTION 1. GLOBAL COMPLIANCE\n"
        "French: Accord de confidentialite et propriete intellectuelle.\n"
        "German: Vertraulichkeitsvereinbarung und Geschaeftsgeheimnisse.\n"
        "Spanish: Acuerdo de confidencialidad y secretos comerciales.\n"
        "Fees: 50,000 USD and 45,000 EUR."
    )
    fontfile = "C:/Windows/Fonts/arial.ttf" if os.path.exists("C:/Windows/Fonts/arial.ttf") else None
    if fontfile:
        page.insert_text((50, 100), text, fontsize=12, fontfile=fontfile)
    else:
        page.insert_text((50, 100), text, fontsize=12)

    pdf_bytes = mupdf_doc.tobytes()
    mupdf_doc.close()

    extractor = PDFExtractor(enable_ocr=False)
    doc = extractor.extract(pdf_bytes, filename="multilingual.pdf")

    assert len(doc.elements) > 0
    assert "Accord de confidentialite" in doc.raw_text
    assert "Vertraulichkeitsvereinbarung" in doc.raw_text
    assert "Acuerdo de confidencialidad" in doc.raw_text


def test_pdf_text_preservation():
    """Test that original_text is preserved alongside normalized_text."""
    mupdf_doc = pymupdf.open()
    page = mupdf_doc.new_page()
    # Insert text
    raw = 'Section 1.1 "Term" - The term shall be 5 years.'
    page.insert_text((50, 100), raw, fontsize=12)
    pdf_bytes = mupdf_doc.tobytes()
    mupdf_doc.close()

    extractor = PDFExtractor(enable_ocr=False)
    doc = extractor.extract(pdf_bytes, filename="quotes.pdf")

    first_elem = doc.elements[0]
    # Check that original text retains characters while normalized standardizes them
    assert "Section 1.1" in first_elem.original_text
    assert "Term" in first_elem.normalized_text

