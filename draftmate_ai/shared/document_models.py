"""Strongly-typed data models representing structured document hierarchy, elements, and chunks."""

from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class ElementType(str, Enum):
    """Categorization of document structural elements."""
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    CLAUSE = "clause"
    LIST_ITEM = "list_item"
    TABLE = "table"
    PAGE_BREAK = "page_break"


class BoundingBox(BaseModel):
    """Coordinates of an element on a rendered page (if available)."""
    x0: float
    y0: float
    x1: float
    y1: float
    page_number: int


class TableCell(BaseModel):
    """A single cell inside an extracted table."""
    row: int
    col: int
    text: str
    original_text: str
    is_header: bool = False
    rowspan: int = 1
    colspan: int = 1


class TableData(BaseModel):
    """Structured representation of tabular content extracted from a document."""
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)
    caption: Optional[str] = None
    page_number: Optional[int] = None

    def to_markdown(self) -> str:
        """Render table data into standard GitHub-flavored markdown."""
        lines: List[str] = []
        if self.caption:
            lines.append(f"*{self.caption}*\n")

        if self.headers:
            lines.append("| " + " | ".join(self.headers) + " |")
            lines.append("| " + " | ".join(["---"] * len(self.headers)) + " |")

        for row in self.rows:
            # Pad row if columns don't match headers
            col_count = len(self.headers) if self.headers else len(row)
            padded = row + [""] * (col_count - len(row))
            clean_cells = [cell.replace("\n", " ").strip() for cell in padded[:col_count]]
            lines.append("| " + " | ".join(clean_cells) + " |")

        return "\n".join(lines)

    def to_text(self) -> str:
        """Render table as plain text representation."""
        output: List[str] = []
        if self.caption:
            output.append(f"Table: {self.caption}")
        if self.headers:
            output.append(" | ".join(self.headers))
            output.append("-" * 40)
        for row in self.rows:
            output.append(" | ".join(row))
        return "\n".join(output)


class StructuralElement(BaseModel):
    """An individual structural element parsed from the document."""
    element_id: str
    element_type: ElementType
    original_text: str = Field(description="Unaltered raw extracted text directly from document.")
    normalized_text: str = Field(description="Normalized text for downstream indexing and NLP.")
    page_number: Optional[int] = None
    paragraph_number: Optional[int] = None
    section_heading: Optional[str] = None
    heading_level: Optional[int] = None
    clause_number: Optional[str] = None
    clause_title: Optional[str] = None
    list_index: Optional[int] = None
    table_data: Optional[TableData] = None
    bbox: Optional[BoundingBox] = None
    extraction_method: str = "unknown"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PageBoundary(BaseModel):
    """Metadata describing a page boundary in a multi-page document."""
    page_number: int
    width: Optional[float] = None
    height: Optional[float] = None
    element_ids: List[str] = Field(default_factory=list)
    has_images: bool = False
    is_scanned: bool = False


class DocumentMetadata(BaseModel):
    """Provenance and file-level metadata for an ingested document."""
    document_id: str
    filename: str
    file_type: str
    file_size_bytes: int
    sha256_checksum: str
    page_count: int = 1
    extraction_method: str
    created_at: str
    author: Optional[str] = None
    title: Optional[str] = None
    processing_warnings: List[str] = Field(default_factory=list)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class DocumentChunk(BaseModel):
    """A discrete chunk produced by structure-aware document chunking."""
    chunk_id: str
    document_id: str
    chunk_index: int
    text: str = Field(description="Chunk content used for embeddings, citation, and retrieval.")
    original_text: str = Field(description="Verbatim original text preserved without alteration.")
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    section_heading: Optional[str] = None
    clause_number: Optional[str] = None
    paragraph_numbers: List[int] = Field(default_factory=list)
    element_ids: List[str] = Field(default_factory=list)
    extraction_method: str = "unknown"
    token_count: Optional[int] = None
    character_count: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ProcessedDocument(BaseModel):
    """Complete typed representation of an ingested and processed document."""
    metadata: DocumentMetadata
    elements: List[StructuralElement] = Field(default_factory=list)
    pages: List[PageBoundary] = Field(default_factory=list)
    raw_text: str = Field(default="", description="Complete raw text extracted across all pages.")
    normalized_text: str = Field(default="", description="Complete normalized text.")
    chunks: List[DocumentChunk] = Field(default_factory=list)

    @property
    def document_id(self) -> str:
        """Convenience property accessing document_id from metadata."""
        return self.metadata.document_id

    def get_elements_by_type(self, element_type: ElementType) -> List[StructuralElement]:
        """Return all structural elements matching a given ElementType."""
        return [el for el in self.elements if el.element_type == element_type]

    def get_elements_by_page(self, page_number: int) -> List[StructuralElement]:
        """Return all structural elements located on a specific page."""
        return [el for el in self.elements if el.page_number == page_number]

    def get_clauses(self) -> List[StructuralElement]:
        """Return all elements tagged as legal clauses."""
        return [el for el in self.elements if el.element_type == ElementType.CLAUSE or el.clause_number is not None]

    def get_headings(self) -> List[StructuralElement]:
        """Return all heading elements."""
        return [el for el in self.elements if el.element_type == ElementType.HEADING]

    def get_tables(self) -> List[TableData]:
        """Return all extracted table objects."""
        return [el.table_data for el in self.elements if el.table_data is not None]

