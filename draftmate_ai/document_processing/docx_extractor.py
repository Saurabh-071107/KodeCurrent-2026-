"""DOCX text, table, and structure extractor powered by python-docx."""

import hashlib
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Union, BinaryIO

import docx
from docx.opc.exceptions import PackageNotFoundError

from draftmate_ai.document_processing.structure_parser import (
    StructureParser,
    build_processed_document,
)
from draftmate_ai.shared.document_models import (
    DocumentMetadata,
    ProcessedDocument,
    StructuralElement,
    TableData,
    PageBoundary,
    ElementType,
)
from draftmate_ai.shared.exceptions import (
    FileCorruptedError,
    EmptyDocumentError,
    ExtractionError,
)
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def _has_page_break(paragraph) -> bool:
    """Detect whether a python-docx paragraph contains an explicit page break."""
    try:
        # Check for w:br with w:type="page" or w:lastRenderedPageBreak
        breaks = paragraph._element.xpath('.//w:br[@w:type="page"] | .//w:lastRenderedPageBreak')
        return len(breaks) > 0
    except Exception:
        return False


class DOCXExtractor:
    """Extracts structured elements, styles, tables, and metadata from DOCX files."""

    def extract(
        self,
        source: Union[str, Path, bytes, BinaryIO],
        filename: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> ProcessedDocument:
        """Extract structured document from a DOCX file path, byte array, or stream."""
        docx_bytes: bytes
        derived_filename: str

        if isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {path}")
            derived_filename = filename or path.name
            try:
                docx_bytes = path.read_bytes()
            except Exception as e:
                raise FileCorruptedError(f"Could not read DOCX file '{path}': {str(e)}") from e
        elif isinstance(source, bytes):
            docx_bytes = source
            derived_filename = filename or "document.docx"
        elif hasattr(source, "read"):
            try:
                source.seek(0)
                docx_bytes = source.read()
                derived_filename = filename or getattr(source, "name", "document.docx")
            except Exception as e:
                raise FileCorruptedError(f"Failed to read from DOCX stream: {str(e)}") from e
        else:
            raise ValueError("Source must be a file path, bytes, or file-like object.")

        if not docx_bytes:
            raise EmptyDocumentError(f"DOCX document '{derived_filename}' is empty (0 bytes).")

        # Verify ZIP header for DOCX
        if not docx_bytes.startswith(b"PK\x03\x04"):
            raise FileCorruptedError(
                f"File '{derived_filename}' does not contain a valid DOCX container header."
            )

        checksum = hashlib.sha256(docx_bytes).hexdigest()
        doc_id = document_id or f"doc_{checksum[:12]}"

        try:
            doc = docx.Document(io.BytesIO(docx_bytes))
        except PackageNotFoundError as e:
            raise FileCorruptedError(f"Corrupted or invalid DOCX archive: {str(e)}") from e
        except Exception as e:
            raise FileCorruptedError(f"Failed to parse DOCX file structure: {str(e)}") from e

        elements: List[StructuralElement] = []
        warnings: List[str] = []
        parser = StructureParser()

        # Extract core document metadata properties
        author: Optional[str] = None
        title: Optional[str] = None
        try:
            props = doc.core_properties
            author = props.author or None
            title = props.title or None
        except Exception as e:
            logger.debug(f"Failed reading core properties: {e}")

        # Page tracking in DOCX: DOCX is reflowable, but we can track explicit page breaks
        current_page = 1
        page_elem_ids: List[str] = []
        page_boundaries: List[PageBoundary] = []

        # Iterate through paragraphs and tables in order of document flow
        # docx body elements contain both paragraphs and tables
        body_elements = []
        try:
            # We can preserve document order by inspecting doc._element.body
            for child in doc._element.body:
                if child.tag.endswith("p"):
                    # Find corresponding Paragraph
                    p = docx.text.paragraph.Paragraph(child, doc)
                    body_elements.append(("paragraph", p))
                elif child.tag.endswith("tbl"):
                    # Find corresponding Table
                    t = docx.table.Table(child, doc)
                    body_elements.append(("table", t))
        except Exception as e:
            # Fallback to sequential paragraph and table extraction
            logger.debug(f"Ordered iteration fallback: {e}")
            body_elements = [("paragraph", p) for p in doc.paragraphs] + [("table", t) for t in doc.tables]

        for item_type, item in body_elements:
            if item_type == "paragraph":
                p = item
                text = p.text.strip()

                # Check if paragraph causes page break
                if _has_page_break(p):
                    page_boundaries.append(
                        PageBoundary(page_number=current_page, element_ids=list(page_elem_ids))
                    )
                    page_elem_ids = []
                    current_page += 1

                if not text:
                    continue

                # Check style for headings
                style_name = p.style.name if p.style else ""
                is_bold = any(run.bold for run in p.runs if run.bold is not None)
                font_size = None
                for run in p.runs:
                    if run.font.size:
                        font_size = run.font.size.pt
                        break

                # Translate Word Heading styles
                if "Heading" in style_name or "Title" in style_name:
                    # Treat style heading explicitly
                    norm = text
                    level = 1
                    if "1" in style_name:
                        level = 1
                    elif "2" in style_name:
                        level = 2
                    elif "3" in style_name:
                        level = 3
                    elif "4" in style_name:
                        level = 4

                    elem = parser.parse_raw_element(
                        raw_text=text,
                        page_number=current_page,
                        font_size=18.0 if level == 1 else 14.0,
                        is_bold=True,
                        extraction_method="python_docx",
                        metadata={"style": style_name},
                    )
                else:
                    elem = parser.parse_raw_element(
                        raw_text=text,
                        page_number=current_page,
                        font_size=font_size,
                        is_bold=is_bold,
                        extraction_method="python_docx",
                        metadata={"style": style_name},
                    )

                elements.append(elem)
                page_elem_ids.append(elem.element_id)

            elif item_type == "table":
                t = item
                try:
                    rows_data: List[List[str]] = []
                    for row in t.rows:
                        # Deduplicate merged cells in row if identical XML elements
                        cell_texts = [cell.text.strip() for cell in row.cells]
                        rows_data.append(cell_texts)

                    if rows_data:
                        headers = rows_data[0]
                        data_rows = rows_data[1:] if len(rows_data) > 1 else []
                        t_data = TableData(
                            headers=headers,
                            rows=data_rows,
                            page_number=current_page,
                        )
                        elem = parser.parse_raw_element(
                            raw_text=t_data.to_markdown(),
                            page_number=current_page,
                            table_data=t_data,
                            extraction_method="python_docx",
                        )
                        elements.append(elem)
                        page_elem_ids.append(elem.element_id)
                except Exception as e:
                    logger.warning(f"Failed to extract table in DOCX: {e}")
                    warnings.append(f"Table extraction warning: {str(e)}")

        # Append final page boundary
        if page_elem_ids or not page_boundaries:
            page_boundaries.append(
                PageBoundary(page_number=current_page, element_ids=list(page_elem_ids))
            )

        total_text = "".join(el.original_text for el in elements).strip()
        if not total_text:
            raise EmptyDocumentError(
                f"DOCX document '{derived_filename}' contains no extractable text or content."
            )

        metadata = DocumentMetadata(
            document_id=doc_id,
            filename=derived_filename,
            file_type="docx",
            file_size_bytes=len(docx_bytes),
            sha256_checksum=checksum,
            page_count=current_page,
            extraction_method="python_docx",
            created_at=datetime.now(timezone.utc).isoformat(),
            author=author,
            title=title,
            processing_warnings=warnings,
        )

        return build_processed_document(
            metadata=metadata,
            elements=elements,
            pages=page_boundaries,
        )

