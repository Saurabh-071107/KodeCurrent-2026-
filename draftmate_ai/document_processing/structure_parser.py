"""Structure parsing and legal clause identification engine.

Transforms raw extracted blocks and runs into typed StructuralElements,
detecting legal clauses, headings, lists, tables, and maintaining section hierarchy.
"""

import re
import unicodedata
import uuid
from typing import Optional, List, Tuple, Dict, Any

from draftmate_ai.shared.document_models import (
    ElementType,
    StructuralElement,
    TableData,
    PageBoundary,
    DocumentMetadata,
    ProcessedDocument,
    BoundingBox,
)
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Regular expressions for legal clauses and document structure
# 1. Article / Section / Clause prefixes: e.g., "Section 4.1", "Article III", "Clause 2.01"
LEGAL_SECTION_PREFIX_RE = re.compile(
    r"^\s*(?:ARTICLE|SECTION|CLAUSE|SCHEDULE|EXHIBIT|ATTACHMENT)\s+([0-9A-ZIVXLCDM]+(?:\.[0-9A-Za-z]+)*)(?:[\.\:\-\s]+(.*))?$",
    re.IGNORECASE,
)

# 2. Hierarchical numeric numbering at start of line: e.g., "1.1", "1.1.2", "4.02.1"
HIERARCHICAL_NUMBER_RE = re.compile(
    r"^\s*(\d+(?:\.\d+)+)(?:[\.\:\s]+(.*))?$"
)

# 3. Simple numeric with period/colon: e.g., "1. Definitions" or "10. Term"
NUMBERED_TITLE_RE = re.compile(
    r"^\s*(\d+)\.\s+([A-Z][A-Za-z0-9\s\,\-\'\"]+)$"
)

# 4. Parenthetical clause numbering: e.g., "(a)", "(b)", "(i)", "(iv)", "(1)"
PARENTHETICAL_CLAUSE_RE = re.compile(
    r"^\s*(\((?:[a-z]{1,3}|\d{1,3}|[ivxlcdm]{1,4}|[A-Z]{1,2})\))\s*(.*)$"
)

# 5. List item bullets
BULLET_LIST_RE = re.compile(
    r"^\s*([\*\-\•\–\◦\▪\⁃])\s+(.*)$"
)


def normalize_text(text: str) -> str:
    """Normalize extracted text for search and downstream NLP while preserving semantic content.

    Applies Unicode NFKC normalization, handles smart quotes, dashes, non-breaking
    spaces, and normalizes excessive whitespace.
    """
    if not text:
        return ""

    # Unicode NFKC normalization
    s = unicodedata.normalize("NFKC", text)

    # Normalize special whitespace characters
    s = s.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")
    s = s.replace("\r\n", "\n").replace("\r", "\n")

    # Normalize typographical quotes and apostrophes
    s = s.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")

    # Normalize dashes and hyphens
    s = s.replace("—", "-").replace("–", "-").replace("−", "-")

    # Collapse multiple consecutive horizontal spaces to a single space
    s = re.sub(r"[ \t]+", " ", s)

    # Collapse excessive blank lines
    s = re.sub(r"\n{3,}", "\n\n", s)

    return s.strip()


def detect_clause_info(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Detect whether a string begins with a legal clause identifier.

    Returns:
        Tuple of (clause_number, clause_title, body_text).
        If not a legal clause, returns (None, None, None).
    """
    clean = text.strip()
    if not clean:
        return None, None, None

    # Check for "Article X", "Section Y", "Clause Z"
    match = LEGAL_SECTION_PREFIX_RE.match(clean)
    if match:
        clause_num = match.group(0).split()[0].title() + " " + match.group(1)
        rest = match.group(2).strip() if match.group(2) else ""
        title = None
        body = rest
        if rest and ("-" in rest or ":" in rest or "." in rest):
            parts = re.split(r"[\-\:\.]\s+", rest, maxsplit=1)
            title = parts[0].strip()
            body = parts[1].strip() if len(parts) > 1 else ""
        elif rest and len(rest.split()) <= 6:
            title = rest
            body = ""
        return clause_num, title, body

    # Check for "1.1", "1.1.2", etc.
    match = HIERARCHICAL_NUMBER_RE.match(clean)
    if match:
        clause_num = match.group(1)
        rest = match.group(2).strip() if match.group(2) else ""
        title = None
        body = rest
        if rest and len(rest.split()) <= 6 and not rest.endswith("."):
            title = rest
            body = ""
        return clause_num, title, body

    # Check for "(a)", "(i)", "(1)", etc.
    match = PARENTHETICAL_CLAUSE_RE.match(clean)
    if match:
        clause_num = match.group(1)
        body = match.group(2).strip() if match.group(2) else ""
        return clause_num, None, body

    return None, None, None


def is_heading_candidate(
    text: str,
    font_size: Optional[float] = None,
    is_bold: Optional[bool] = None,
    avg_font_size: float = 11.0,
) -> Tuple[bool, int]:
    """Determine whether a block of text represents a heading and estimate its level (1-4)."""
    clean = text.strip()
    if not clean or len(clean) > 200:
        return False, 0

    # Font size cues from PDF
    if font_size is not None and font_size > avg_font_size * 1.25:
        if font_size > avg_font_size * 1.6:
            return True, 1
        return True, 2

    # Bold uppercase cues
    if is_bold and clean.isupper() and len(clean.split()) <= 12:
        return True, 1

    # Numbered titles: e.g. "1. DEFINITIONS"
    num_match = NUMBERED_TITLE_RE.match(clean)
    if num_match:
        return True, 2

    # All-caps short line
    words = clean.split()
    if clean.isupper() and 1 <= len(words) <= 10 and not clean.endswith("."):
        return True, 1

    # Markdown style
    if clean.startswith("#"):
        level = len(clean) - len(clean.lstrip("#"))
        return True, min(max(1, level), 4)

    return False, 0


class StructureParser:
    """Stateful parser that organizes document fragments into a coherent, typed structure."""

    def __init__(self):
        self.current_section: Optional[str] = None
        self.current_heading_level: Optional[int] = None
        self.current_clause_number: Optional[str] = None
        self.paragraph_counter: int = 0

    def parse_raw_element(
        self,
        raw_text: str,
        page_number: Optional[int] = None,
        font_size: Optional[float] = None,
        is_bold: Optional[bool] = None,
        extraction_method: str = "unknown",
        table_data: Optional[TableData] = None,
        bbox: Optional[BoundingBox] = None,
        avg_font_size: float = 11.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> StructuralElement:
        """Classify and build a single StructuralElement while maintaining document context."""
        element_id = f"elem_{uuid.uuid4().hex[:10]}"
        norm = normalize_text(raw_text)

        # 1. Handle Table
        if table_data is not None:
            self.paragraph_counter += 1
            return StructuralElement(
                element_id=element_id,
                element_type=ElementType.TABLE,
                original_text=raw_text,
                normalized_text=norm,
                page_number=page_number,
                paragraph_number=self.paragraph_counter,
                section_heading=self.current_section,
                clause_number=self.current_clause_number,
                table_data=table_data,
                bbox=bbox,
                extraction_method=extraction_method,
                metadata=metadata or {},
            )

        # 2. Check for Heading
        is_heading, heading_level = is_heading_candidate(
            norm, font_size=font_size, is_bold=is_bold, avg_font_size=avg_font_size
        )
        if is_heading:
            clean_heading = norm.lstrip("#").strip()
            self.current_section = clean_heading
            self.current_heading_level = heading_level
            # Reset current clause when entering a major section heading
            if heading_level <= 2:
                self.current_clause_number = None

            return StructuralElement(
                element_id=element_id,
                element_type=ElementType.HEADING,
                original_text=raw_text,
                normalized_text=norm,
                page_number=page_number,
                section_heading=self.current_section,
                heading_level=heading_level,
                bbox=bbox,
                extraction_method=extraction_method,
                metadata=metadata or {},
            )

        # 3. Check for Legal Clause
        clause_num, clause_title, _ = detect_clause_info(norm)
        if clause_num:
            self.paragraph_counter += 1
            self.current_clause_number = clause_num
            return StructuralElement(
                element_id=element_id,
                element_type=ElementType.CLAUSE,
                original_text=raw_text,
                normalized_text=norm,
                page_number=page_number,
                paragraph_number=self.paragraph_counter,
                section_heading=self.current_section,
                clause_number=clause_num,
                clause_title=clause_title,
                bbox=bbox,
                extraction_method=extraction_method,
                metadata=metadata or {},
            )

        # 4. Check for List Item
        bullet_match = BULLET_LIST_RE.match(norm)
        if bullet_match:
            self.paragraph_counter += 1
            return StructuralElement(
                element_id=element_id,
                element_type=ElementType.LIST_ITEM,
                original_text=raw_text,
                normalized_text=norm,
                page_number=page_number,
                paragraph_number=self.paragraph_counter,
                section_heading=self.current_section,
                clause_number=self.current_clause_number,
                bbox=bbox,
                extraction_method=extraction_method,
                metadata=metadata or {},
            )

        # 5. Default: Paragraph
        self.paragraph_counter += 1
        return StructuralElement(
            element_id=element_id,
            element_type=ElementType.PARAGRAPH,
            original_text=raw_text,
            normalized_text=norm,
            page_number=page_number,
            paragraph_number=self.paragraph_counter,
            section_heading=self.current_section,
            clause_number=self.current_clause_number,
            bbox=bbox,
            extraction_method=extraction_method,
            metadata=metadata or {},
        )


def build_processed_document(
    metadata: DocumentMetadata,
    elements: List[StructuralElement],
    pages: Optional[List[PageBoundary]] = None,
    raw_text: Optional[str] = None,
    normalized_text: Optional[str] = None,
) -> ProcessedDocument:
    """Assemble a ProcessedDocument and compute unified text bodies if not provided."""
    if raw_text is None:
        raw_text = "\n\n".join(el.original_text for el in elements if el.original_text)

    if normalized_text is None:
        normalized_text = "\n\n".join(el.normalized_text for el in elements if el.normalized_text)

    # Link page elements
    page_boundaries = pages or []
    if not page_boundaries and elements:
        # Generate inferred page boundaries if not explicitly provided
        page_nums = sorted(list({el.page_number for el in elements if el.page_number is not None}))
        for p_num in page_nums:
            page_elem_ids = [el.element_id for el in elements if el.page_number == p_num]
            page_boundaries.append(PageBoundary(page_number=p_num, element_ids=page_elem_ids))

    return ProcessedDocument(
        metadata=metadata,
        elements=elements,
        pages=page_boundaries,
        raw_text=raw_text,
        normalized_text=normalized_text,
    )

