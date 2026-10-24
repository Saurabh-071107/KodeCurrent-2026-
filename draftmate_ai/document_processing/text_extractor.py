"""Plain text extractor supporting diverse encodings and structure detection."""

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Union, BinaryIO

from draftmate_ai.document_processing.structure_parser import (
    StructureParser,
    build_processed_document,
    is_heading_candidate,
    detect_clause_info,
    BULLET_LIST_RE,
)
from draftmate_ai.shared.document_models import (
    DocumentMetadata,
    ProcessedDocument,
    StructuralElement,
    PageBoundary,
)
from draftmate_ai.shared.exceptions import (
    FileCorruptedError,
    EmptyDocumentError,
)
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def decode_bytes(data: bytes) -> str:
    """Robustly decode raw bytes into string by testing candidate encodings.

    Prioritizes UTF-8, handles BOM signatures (UTF-8-SIG, UTF-16), and falls back
    to Windows CP1252 and Latin-1 before final error replacement.
    """
    if not data:
        return ""

    # 1. Check for explicit BOM markers
    if data.startswith(b"\xef\xbb\xbf"):
        return data.decode("utf-8-sig")
    if data.startswith(b"\xff\xfe") or data.startswith(b"\xfe\xff"):
        return data.decode("utf-16")

    # 2. Check for binary files (excessive null bytes)
    if b"\x00" in data:
        null_count = data.count(b"\x00")
        if null_count > len(data) * 0.1:
            raise FileCorruptedError("File appears to be a binary file, not a text document.")

    # 3. Try UTF-8 strict first (covers ASCII and standard UTF-8 files)
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        pass

    # 4. Try standard single-byte 8-bit encodings
    for encoding in ["cp1252", "latin-1"]:
        try:
            return data.decode(encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue

    # 5. Final fallback with replacement characters
    return data.decode("utf-8", errors="replace")


def split_text_into_structural_units(text: str) -> List[str]:
    """Segment plain text into discrete structural units (headings, clauses, paragraphs, lists)."""
    units: List[str] = []
    current_lines: List[str] = []

    for line in text.splitlines():
        clean = line.strip()
        if not clean:
            if current_lines:
                units.append("\n".join(current_lines))
                current_lines = []
            continue

        # Check if line indicates a new structural element boundary
        is_heading, _ = is_heading_candidate(clean)
        clause_num, _, _ = detect_clause_info(clean)
        is_bullet = bool(BULLET_LIST_RE.match(clean))

        if is_heading or clause_num or is_bullet:
            if current_lines:
                units.append("\n".join(current_lines))
                current_lines = []
            current_lines.append(clean)
        else:
            current_lines.append(clean)

    if current_lines:
        units.append("\n".join(current_lines))

    return units


class TextExtractor:
    """Extracts structured elements and clauses from plain text files."""

    def extract(
        self,
        source: Union[str, Path, bytes, BinaryIO],
        filename: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> ProcessedDocument:
        """Extract structured document from a text file path, bytes, or stream."""
        raw_bytes: bytes
        derived_filename: str

        if isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {path}")
            derived_filename = filename or path.name
            try:
                raw_bytes = path.read_bytes()
            except Exception as e:
                raise FileCorruptedError(f"Could not read text file '{path}': {str(e)}") from e
        elif isinstance(source, bytes):
            raw_bytes = source
            derived_filename = filename or "document.txt"
        elif hasattr(source, "read"):
            try:
                source.seek(0)
                raw_bytes = source.read()
                if isinstance(raw_bytes, str):
                    raw_bytes = raw_bytes.encode("utf-8")
                derived_filename = filename or getattr(source, "name", "document.txt")
            except Exception as e:
                raise FileCorruptedError(f"Failed to read from stream: {str(e)}") from e
        else:
            raise ValueError("Source must be a file path, bytes, or file-like object.")

        if not raw_bytes or not raw_bytes.strip():
            raise EmptyDocumentError(f"Text document '{derived_filename}' is empty (0 bytes).")

        text_content = decode_bytes(raw_bytes)
        if not text_content.strip():
            raise EmptyDocumentError(f"Text document '{derived_filename}' contains only whitespace.")

        checksum = hashlib.sha256(raw_bytes).hexdigest()
        doc_id = document_id or f"doc_{checksum[:12]}"

        # Segment content into structural units
        structural_units = split_text_into_structural_units(text_content)
        if not structural_units:
            structural_units = [text_content.strip()]

        elements: List[StructuralElement] = []
        parser = StructureParser()

        for unit in structural_units:
            elem = parser.parse_raw_element(
                raw_text=unit,
                page_number=1,  # TXT files are single continuous page
                extraction_method="text_extractor",
            )
            elements.append(elem)

        page_boundaries = [
            PageBoundary(
                page_number=1,
                element_ids=[el.element_id for el in elements],
                has_images=False,
                is_scanned=False,
            )
        ]

        metadata = DocumentMetadata(
            document_id=doc_id,
            filename=derived_filename,
            file_type="txt",
            file_size_bytes=len(raw_bytes),
            sha256_checksum=checksum,
            page_count=1,
            extraction_method="text_extractor",
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        return build_processed_document(
            metadata=metadata,
            elements=elements,
            pages=page_boundaries,
            raw_text=text_content,
        )

