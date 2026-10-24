"""Document processing subsystem: ingestion, extraction, structure parsing, OCR, and chunking."""

from draftmate_ai.document_processing.ingestion import (
    ingest_document,
    detect_and_validate_format,
    get_ingestion_summary,
)
from draftmate_ai.document_processing.pdf_extractor import PDFExtractor
from draftmate_ai.document_processing.docx_extractor import DOCXExtractor
from draftmate_ai.document_processing.text_extractor import TextExtractor
from draftmate_ai.document_processing.chunking import StructureAwareChunker
from draftmate_ai.document_processing.structure_parser import (
    StructureParser,
    normalize_text,
    detect_clause_info,
    build_processed_document,
)
from draftmate_ai.document_processing.ocr import (
    is_scanned_page,
    ocr_image,
    ocr_pymupdf_page,
    is_tesseract_installed,
)

__all__ = [
    "ingest_document",
    "detect_and_validate_format",
    "get_ingestion_summary",
    "PDFExtractor",
    "DOCXExtractor",
    "TextExtractor",
    "StructureAwareChunker",
    "StructureParser",
    "normalize_text",
    "detect_clause_info",
    "build_processed_document",
    "is_scanned_page",
    "ocr_image",
    "ocr_pymupdf_page",
    "is_tesseract_installed",
]

