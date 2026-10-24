"""Pydantic schemas for document ingestion requests, configuration options, and responses."""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ExtractionMethod(str, Enum):
    """Supported text extraction methodologies."""
    PYMUPDF_TEXT = "pymupdf_text"
    PYMUPDF_OCR = "pymupdf_ocr"
    PYTHON_DOCX = "python_docx"
    TEXT_EXTRACTOR = "text_extractor"
    HYBRID_OCR = "hybrid_ocr"
    UNKNOWN = "unknown"


class ChunkingConfig(BaseModel):
    """Configuration options governing structure-aware document chunking."""
    chunk_size: int = Field(default=800, ge=50, description="Target chunk size in characters or estimated tokens.")
    chunk_overlap: int = Field(default=150, ge=0, description="Overlap between consecutive chunks.")
    min_chunk_size: int = Field(default=100, ge=20, description="Minimum allowable chunk size before merging.")
    preserve_clause_boundaries: bool = Field(default=True, description="Avoid splitting across legal clauses if possible.")
    preserve_paragraph_boundaries: bool = Field(default=True, description="Prefer paragraph splits over character splits.")
    attach_heading_to_content: bool = Field(default=True, description="Prefix content with its parent section heading.")
    tokenizer_type: str = Field(default="char", description="Chunk length metric: 'char' or 'whitespace' or 'token'.")


class IngestionRequest(BaseModel):
    """Request specification for ingesting a document."""
    file_path: Optional[str] = None
    filename: Optional[str] = None
    document_id: Optional[str] = None
    chunking_config: Optional[ChunkingConfig] = None
    enable_ocr: bool = True
    strict_ocr: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestionResponse(BaseModel):
    """Summary response returned after document ingestion and processing."""
    document_id: str
    filename: str
    file_type: str
    page_count: int
    element_count: int
    chunk_count: int
    raw_character_count: int
    extraction_method: str
    processing_warnings: List[str] = Field(default_factory=list)
    processing_time_ms: float = 0.0


class VerificationRequest(BaseModel):
    """Request specification for validating a quoted citation against source text."""
    quoted_passage: str
    document_id: str
    chunk_id: Optional[str] = None
    expected_page: Optional[int] = None


class VerificationResponse(BaseModel):
    """Result of citation / passage provenance verification."""
    is_verified: bool
    confidence: float
    match_type: str
    matched_text: Optional[str] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    page_number: Optional[int] = None
    clause_number: Optional[str] = None
    failure_reason: Optional[str] = None

