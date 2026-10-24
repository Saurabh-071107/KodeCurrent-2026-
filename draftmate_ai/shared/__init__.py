"""Shared utilities, models, schemas, and configurations for DraftMate AI."""

from draftmate_ai.shared.exceptions import (
    DraftMateError,
    ConfigurationError,
    DocumentProcessingError,
    UnsupportedFileFormatError,
    FileCorruptedError,
    FileSizeLimitExceededError,
    EmptyDocumentError,
    ExtractionError,
    OCRError,
    ProvenanceError,
    VerificationMismatchError,
)
from draftmate_ai.shared.configuration import Settings, get_settings
from draftmate_ai.shared.document_models import (
    ElementType,
    DocumentMetadata,
    StructuralElement,
    TableData,
    ProcessedDocument,
    DocumentChunk,
)
from draftmate_ai.shared.schemas import (
    IngestionRequest,
    IngestionResponse,
    ChunkingConfig,
    ExtractionMethod,
)
from draftmate_ai.shared.provenance import (
    ProvenanceRecord,
    VerificationResult,
    verify_passage_in_source,
    build_provenance_record,
)
from draftmate_ai.shared.logging_utils import get_logger

__all__ = [
    "DraftMateError",
    "ConfigurationError",
    "DocumentProcessingError",
    "UnsupportedFileFormatError",
    "FileCorruptedError",
    "FileSizeLimitExceededError",
    "EmptyDocumentError",
    "ExtractionError",
    "OCRError",
    "ProvenanceError",
    "VerificationMismatchError",
    "Settings",
    "get_settings",
    "ElementType",
    "DocumentMetadata",
    "StructuralElement",
    "TableData",
    "ProcessedDocument",
    "DocumentChunk",
    "IngestionRequest",
    "IngestionResponse",
    "ChunkingConfig",
    "ExtractionMethod",
    "ProvenanceRecord",
    "VerificationResult",
    "verify_passage_in_source",
    "build_provenance_record",
    "get_logger",
]

