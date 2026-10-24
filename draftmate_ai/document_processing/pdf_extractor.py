"""PDF text and structure extractor powered by PyMuPDF and OCR integration."""

import hashlib
import io
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Union, BinaryIO

import pymupdf

from draftmate_ai.document_processing.ocr import (
    is_scanned_page,
    ocr_pymupdf_page,
    is_tesseract_installed,
)
from draftmate_ai.document_processing.structure_parser import (
    StructureParser,
    build_processed_document,
)
from draftmate_ai.shared.document_models import (
    DocumentMetadata,
    ProcessedDocument,
    StructuralElement,
    PageBoundary,
    TableData,
    BoundingBox,
    ElementType,
)
from draftmate_ai.shared.exceptions import (
    FileCorruptedError,
    EmptyDocumentError,
    ExtractionError,
)
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def _is_bbox_inside(inner: tuple, outer: tuple, tolerance: float = 2.0) -> bool:
    """Check if inner bbox (x0, y0, x1, y1) is contained within outer bbox."""
    return (
        inner[0] >= outer[0] - tolerance
        and inner[1] >= outer[1] - tolerance
        and inner[2] <= outer[2] + tolerance
        and inner[3] <= outer[3] + tolerance
    )


class PDFExtractor:
    """Extracts structured text, tables, headings, and metadata from PDF documents."""

    def __init__(self, enable_ocr: bool = True, strict_ocr: bool = False):
        self.enable_ocr = enable_ocr
        self.strict_ocr = strict_ocr

    def extract(
        self,
        source: Union[str, Path, bytes, BinaryIO],
        filename: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> ProcessedDocument:
        """Extract typed document structure from a PDF path or byte stream."""
        pdf_bytes: bytes
        derived_filename: str

        if isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {path}")
            derived_filename = filename or path.name
            try:
                pdf_bytes = path.read_bytes()
            except Exception as e:
                raise FileCorruptedError(f"Could not read PDF file '{path}': {str(e)}") from e
        elif isinstance(source, bytes):
            pdf_bytes = source
            derived_filename = filename or "document.pdf"
        elif hasattr(source, "read"):
            try:
                source.seek(0)
                pdf_bytes = source.read()
                derived_filename = filename or getattr(source, "name", "document.pdf")
            except Exception as e:
                raise FileCorruptedError(f"Failed to read from PDF stream: {str(e)}") from e
        else:
            raise ValueError("Source must be a file path, bytes, or file-like object.")

        if not pdf_bytes:
            raise EmptyDocumentError(f"PDF document '{derived_filename}' is empty (0 bytes).")

        # Compute SHA-256 checksum
        checksum = hashlib.sha256(pdf_bytes).hexdigest()
        doc_id = document_id or f"doc_{checksum[:12]}"

        # Open with PyMuPDF
        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise FileCorruptedError(f"PDF document is corrupted or malformed: {str(e)}") from e

        if doc.is_encrypted:
            # Attempt empty password authentication
            if not doc.authenticate(""):
                raise FileCorruptedError(f"PDF document '{derived_filename}' is encrypted and password-protected.")

        page_count = len(doc)
        if page_count == 0:
            raise EmptyDocumentError(f"PDF document '{derived_filename}' contains zero pages.")

        warnings: List[str] = []
        elements: List[StructuralElement] = []
        page_boundaries: List[PageBoundary] = []
        used_ocr = False
        parser = StructureParser()

        try:
            for page_index in range(page_count):
                page = doc[page_index]
                page_num = page_index + 1
                page_rect = page.rect
                page_elem_ids: List[str] = []

                # 1. Extract and process tables first
                table_bboxes = []
                try:
                    tables = page.find_tables()
                    if tables and tables.tables:
                        for tab in tables.tables:
                            extracted_rows = tab.extract()
                            if extracted_rows:
                                headers = [str(c or "").strip() for c in extracted_rows[0]]
                                rows = [[str(c or "").strip() for c in r] for r in extracted_rows[1:]]
                                t_data = TableData(
                                    headers=headers,
                                    rows=rows,
                                    page_number=page_num,
                                )
                                t_bbox = BoundingBox(
                                    x0=tab.bbox[0],
                                    y0=tab.bbox[1],
                                    x1=tab.bbox[2],
                                    y1=tab.bbox[3],
                                    page_number=page_num,
                                )
                                table_bboxes.append(tab.bbox)
                                elem = parser.parse_raw_element(
                                    raw_text=t_data.to_markdown(),
                                    page_number=page_num,
                                    table_data=t_data,
                                    bbox=t_bbox,
                                    extraction_method="pymupdf_table",
                                )
                                elements.append(elem)
                                page_elem_ids.append(elem.element_id)
                except Exception as e:
                    logger.debug(f"Table detection skipped on page {page_num}: {e}")

                # 2. Extract text blocks and layout spans
                page_dict = page.get_text("dict")
                blocks = page_dict.get("blocks", [])
                page_text_pieces: List[str] = []
                image_count = 0

                # Compute baseline average font size for heading detection
                font_sizes: List[float] = []
                for block in blocks:
                    if block.get("type") == 0:  # Text block
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                if span.get("size"):
                                    font_sizes.append(span["size"])
                    elif block.get("type") == 1:  # Image block
                        image_count += 1

                avg_font_size = (sum(font_sizes) / len(font_sizes)) if font_sizes else 11.0

                for block in blocks:
                    if block.get("type") != 0:
                        continue

                    bbox_tuple = (block["bbox"][0], block["bbox"][1], block["bbox"][2], block["bbox"][3])
                    # Skip if block is part of an already extracted table
                    if any(_is_bbox_inside(bbox_tuple, tb) for tb in table_bboxes):
                        continue

                    # Assemble block text and detect dominant font size / bold
                    block_text_lines = []
                    max_size = 0.0
                    is_bold = False

                    for line in block.get("lines", []):
                        line_spans = []
                        for span in line.get("spans", []):
                            t = span.get("text", "")
                            line_spans.append(t)
                            size = span.get("size", 11.0)
                            if size > max_size:
                                max_size = size
                            # Flag 2 or 'bold' in font name signifies bold font
                            font_name = span.get("font", "").lower()
                            flags = span.get("flags", 0)
                            if (flags & 2 != 0) or ("bold" in font_name):
                                is_bold = True
                        block_text_lines.append("".join(line_spans))

                    block_text = "\n".join(block_text_lines).strip()
                    if not block_text:
                        continue

                    page_text_pieces.append(block_text)
                    b_bbox = BoundingBox(
                        x0=bbox_tuple[0],
                        y0=bbox_tuple[1],
                        x1=bbox_tuple[2],
                        y1=bbox_tuple[3],
                        page_number=page_num,
                    )
                    elem = parser.parse_raw_element(
                        raw_text=block_text,
                        page_number=page_num,
                        font_size=max_size,
                        is_bold=is_bold,
                        avg_font_size=avg_font_size,
                        bbox=b_bbox,
                        extraction_method="pymupdf_text",
                    )
                    elements.append(elem)
                    page_elem_ids.append(elem.element_id)

                full_page_text = "\n".join(page_text_pieces).strip()

                # 3. Check for Scanned Page & OCR Fallback
                is_scanned = is_scanned_page(full_page_text, image_count=image_count)
                if is_scanned:
                    if self.enable_ocr:
                        logger.info(f"Page {page_num} in '{derived_filename}' is scanned. Attempting OCR...")
                        ocr_text, ocr_conf = ocr_pymupdf_page(
                            page,
                            dpi=300,
                            strict=self.strict_ocr,
                        )
                        if ocr_text:
                            used_ocr = True
                            # Split OCR text into paragraphs
                            ocr_paras = [p.strip() for p in ocr_text.split("\n\n") if p.strip()]
                            for p_text in ocr_paras:
                                elem = parser.parse_raw_element(
                                    raw_text=p_text,
                                    page_number=page_num,
                                    extraction_method="pymupdf_ocr",
                                    metadata={"ocr_confidence": ocr_conf},
                                )
                                elements.append(elem)
                                page_elem_ids.append(elem.element_id)
                        else:
                            warning_msg = (
                                f"Page {page_num} appears scanned, but OCR did not produce text or is unavailable."
                            )
                            warnings.append(warning_msg)
                            logger.warning(warning_msg)
                    else:
                        warning_msg = f"Page {page_num} appears scanned, but OCR is disabled."
                        warnings.append(warning_msg)

                page_boundaries.append(
                    PageBoundary(
                        page_number=page_num,
                        width=page_rect.width,
                        height=page_rect.height,
                        element_ids=page_elem_ids,
                        has_images=image_count > 0,
                        is_scanned=is_scanned,
                    )
                )

        finally:
            doc.close()

        # Check if entire extraction yielded no content
        total_text = "".join(el.original_text for el in elements).strip()
        if not total_text:
            raise EmptyDocumentError(
                f"PDF document '{derived_filename}' contains no extractable text or content."
            )

        extraction_method = "hybrid_ocr" if used_ocr else "pymupdf_text"

        metadata = DocumentMetadata(
            document_id=doc_id,
            filename=derived_filename,
            file_type="pdf",
            file_size_bytes=len(pdf_bytes),
            sha256_checksum=checksum,
            page_count=page_count,
            extraction_method=extraction_method,
            created_at=datetime.now(timezone.utc).isoformat(),
            processing_warnings=warnings,
        )

        return build_processed_document(
            metadata=metadata,
            elements=elements,
            pages=page_boundaries,
        )

