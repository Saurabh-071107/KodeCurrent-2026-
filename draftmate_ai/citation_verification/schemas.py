"""Pydantic schemas and typed models for legal citation verification."""

from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class VerificationStatus(str, Enum):
    """Overall verification status of a legal citation."""
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    CONFLICTING = "CONFLICTING"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"


class ExistenceStatus(str, Enum):
    """Authority existence dimension."""
    FOUND = "FOUND"
    NOT_FOUND = "NOT_FOUND"
    AMBIGUOUS = "AMBIGUOUS"


class MetadataAccuracyStatus(str, Enum):
    """Metadata accuracy dimension."""
    MATCH = "MATCH"
    PARTIAL_MATCH = "PARTIAL_MATCH"
    MISMATCH = "MISMATCH"
    NOT_CHECKED = "NOT_CHECKED"


class PropositionSupportStatus(str, Enum):
    """Proposition support dimension."""
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class PinpointAccuracyStatus(str, Enum):
    """Pinpoint paragraph or page accuracy dimension."""
    VERIFIED = "VERIFIED"
    PAGE_EXISTS_NO_SUPPORT = "PAGE_EXISTS_NO_SUPPORT"
    PAGE_NOT_FOUND = "PAGE_NOT_FOUND"
    NOT_SPECIFIED = "NOT_SPECIFIED"


class LegalCurrencyStatus(str, Enum):
    """Subsequent treatment and legal currency dimension."""
    GOOD_LAW = "GOOD_LAW"
    OVERRULED = "OVERRULED"
    DOUBTED = "DOUBTED"
    DISTINGUISHED = "DISTINGUISHED"
    UNKNOWN = "UNKNOWN"


class CitationType(str, Enum):
    """Classification of legal authority."""
    CASE_LAW = "CASE_LAW"
    STATUTE = "STATUTE"
    CONSTITUTIONAL = "CONSTITUTIONAL"
    REGULATION = "REGULATION"
    TREATISE = "TREATISE"


class ExtractedCitation(BaseModel):
    """Raw legal citation extracted from document context."""
    citation_id: str
    raw_citation: str
    citation_type: CitationType = CitationType.CASE_LAW
    case_name: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    court: Optional[str] = None
    reporter: Optional[str] = None
    volume: Optional[str] = None
    page: Optional[str] = None
    year: Optional[int] = None
    pinpoint: Optional[str] = None
    statute_name: Optional[str] = None
    section_number: Optional[str] = None
    associated_proposition: Optional[str] = None
    surrounding_text: str = ""
    start_char_idx: Optional[int] = None
    end_char_idx: Optional[int] = None
    document_id: Optional[str] = None
    page_number: Optional[int] = None
    clause_or_element_id: Optional[str] = None


class NormalizedCitation(BaseModel):
    """Canonical, normalized representation of a legal citation."""
    canonical_citation: str
    canonical_case_name: Optional[str] = None
    petitioner_normalized: Optional[str] = None
    respondent_normalized: Optional[str] = None
    normalized_court: Optional[str] = None
    standard_reporter: Optional[str] = None
    year: Optional[int] = None
    volume: Optional[str] = None
    page: Optional[str] = None
    pinpoint_normalized: Optional[str] = None
    statute_canonical: Optional[str] = None
    section_canonical: Optional[str] = None


class AuthorityRecord(BaseModel):
    """Official or authoritative record of a legal precedent or statute."""
    authority_id: str
    canonical_name: str
    citations: List[str] = Field(default_factory=list)
    court: str = "Supreme Court of India"
    decision_date: Optional[str] = None
    bench: List[str] = Field(default_factory=list)
    full_text: Optional[str] = None
    headnotes: List[str] = Field(default_factory=list)
    paragraphs: Dict[str, str] = Field(default_factory=dict)
    currency_status: LegalCurrencyStatus = LegalCurrencyStatus.GOOD_LAW
    subsequent_treatment: List[str] = Field(default_factory=list)
    source_identifier: str = "corpus://local"
    is_statute: bool = False


class VerificationResult(BaseModel):
    """Comprehensive multi-dimensional verification report for a citation."""
    citation_id: str
    raw_citation: str
    normalized_citation: str
    overall_status: VerificationStatus
    existence: ExistenceStatus
    metadata_accuracy: MetadataAccuracyStatus
    proposition_support: PropositionSupportStatus
    pinpoint_accuracy: PinpointAccuracyStatus
    legal_currency: LegalCurrencyStatus
    matched_authority_id: Optional[str] = None
    matched_authority_title: Optional[str] = None
    supporting_excerpts: List[str] = Field(default_factory=list)
    explanation: str
    currency_notes: Optional[str] = None
    limitations_disclosed: List[str] = Field(default_factory=list)
    provenance_record: Optional[Dict[str, Any]] = None


class DocumentCitationReport(BaseModel):
    """Aggregation of all citations verified within a processed document."""
    document_id: str
    total_citations: int = 0
    verified_count: int = 0
    partially_verified_count: int = 0
    unverified_count: int = 0
    conflicting_count: int = 0
    source_unavailable_count: int = 0
    results: List[VerificationResult] = Field(default_factory=list)

