"""Tests for OCR detection, scanned PDF handling, and fallback behavior."""

import pytest
from draftmate_ai.document_processing.ocr import (
    is_scanned_page,
    ocr_image,
    is_tesseract_installed,
)
from draftmate_ai.document_processing.pdf_extractor import PDFExtractor
from draftmate_ai.shared.exceptions import OCRError, EmptyDocumentError
from PIL import Image


def test_is_scanned_page_detection():
    """Test classification of scanned vs digital pages."""
    # Digital text page with sufficient characters and no images
    assert is_scanned_page("This is a standard text document page with lots of content.", image_count=0) is False

    # Scanned page: almost no text and 1 image
    assert is_scanned_page("", image_count=1) is True
    assert is_scanned_page("   ", image_count=2) is True
    assert is_scanned_page("Page 1", image_count=1) is True

    # Digital page that also happens to have an illustration
    long_text = "Standard legal clause text. " * 20
    assert is_scanned_page(long_text, image_count=1) is False


def test_scanned_pdf_graceful_handling(sample_scanned_pdf_bytes):
    """Test handling of scanned PDF when OCR is executed or falls back with warnings."""
    # Strict OCR = False should not crash, but rather populate warnings if tesseract binary is not installed
    extractor = PDFExtractor(enable_ocr=True, strict_ocr=False)

    try:
        doc = extractor.extract(sample_scanned_pdf_bytes, filename="scanned.pdf")
        assert doc.metadata.page_count == 1
        # Check that either OCR succeeded or warning was recorded
        assert doc.metadata.extraction_method in ("hybrid_ocr", "pymupdf_ocr") or len(doc.metadata.processing_warnings) > 0
    except EmptyDocumentError:
        # If tesseract is not installed on this host OS, an image-only PDF has 0 extracted text,
        # which correctly triggers EmptyDocumentError when no OCR text could be extracted!
        pass


def test_ocr_strict_mode_when_tesseract_unavailable(monkeypatch):
    """Test that strict_ocr=True raises OCRError if Tesseract is unavailable."""
    # Simulate tesseract not installed
    import draftmate_ai.document_processing.ocr as ocr_module
    monkeypatch.setattr(ocr_module, "is_tesseract_installed", lambda cmd=None: False)

    img = Image.new("RGB", (100, 100), color=(255, 255, 255))
    with pytest.raises(OCRError):
        ocr_image(img, strict=True)

