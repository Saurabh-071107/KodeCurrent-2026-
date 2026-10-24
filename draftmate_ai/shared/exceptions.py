"""Custom exception hierarchy for DraftMate AI."""

from typing import Optional, Dict, Any


class DraftMateError(Exception):
    """Base exception for all DraftMate AI errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def __str__(self) -> str:
        if self.details:
            return f"{self.message} | Details: {self.details}"
        return self.message


class ConfigurationError(DraftMateError):
    """Raised when environment variables or application configuration are missing or invalid."""
    pass


class DocumentProcessingError(DraftMateError):
    """Base exception for document processing, parsing, or extraction failures."""
    pass


class UnsupportedFileFormatError(DocumentProcessingError):
    """Raised when an unsupported file type or MIME format is provided."""
    pass


class FileCorruptedError(DocumentProcessingError):
    """Raised when a file has invalid headers, broken structure, or corrupted data."""
    pass


class FileSizeLimitExceededError(DocumentProcessingError):
    """Raised when a file exceeds the configured maximum upload or processing size."""
    pass


class EmptyDocumentError(DocumentProcessingError):
    """Raised when a file contains no extractable content or is 0 bytes."""
    pass


class ExtractionError(DocumentProcessingError):
    """Raised when text or layout extraction fails during document parsing."""
    pass


class OCRError(DocumentProcessingError):
    """Raised when OCR execution fails or when OCR is required but unavailable."""
    pass


class StructureParsingError(DocumentProcessingError):
    """Raised when document structure (clauses, tables, headings) cannot be parsed."""
    pass


class ProvenanceError(DraftMateError):
    """Base exception for provenance tracking and citation verification errors."""
    pass


class VerificationMismatchError(ProvenanceError):
    """Raised when a quoted passage does not match its alleged source text."""
    pass

