"""Pydantic schemas for request/response validation."""
from __future__ import annotations
from datetime import date as date_cls, datetime
from enum import Enum
from typing import Any, Optional, List

from pydantic import BaseModel, Field, field_validator, model_validator


class DocumentType(str, Enum):
    """Supported document types."""

    LEGAL_NOTICE = "legal_notice"
    FORMAL_LETTER = "formal_letter"
    AGREEMENT = "agreement"
    DEMAND_LETTER = "demand_letter"
    CEASE_DESIST = "cease_desist"


class Jurisdiction(str, Enum):
    """Common jurisdictions (extendable)."""

    US_FEDERAL = "us_federal"
    US_CA = "us_ca"
    US_NY = "us_ny"
    US_TX = "us_tx"
    UK = "uk"
    CA = "ca"
    AU = "au"
    INDIA = "india"
    IN_DELHI = "in_delhi"
    IN_MUMBAI = "in_mumbai"
    OTHER = "other"


class PartyRole(str, Enum):
    """Roles a party can have in a legal matter."""

    CLAIMANT = "claimant"
    RESPONDENT = "respondent"
    PLAINTIFF = "plaintiff"
    DEFENDANT = "defendant"
    PETITIONER = "petitioner"
    RESPONDENT_PETITION = "respondent_petition"
    SENDER = "sender"
    RECIPIENT = "recipient"
    LESSOR = "lessor"
    LESSEE = "lessee"
    LICENSOR = "licensor"
    LICENSEE = "licensee"
    PARTY_A = "party_a"
    PARTY_B = "party_b"
    OTHER = "other"


class FactExtractionRequest(BaseModel):
    """Request for fact extraction from problem description."""

    problem_description: str = Field(
        ...,
        min_length=10,
        max_length=10000,
        description="Detailed description of the legal problem",
    )
    document_type: DocumentType = Field(
        ..., description="Type of document to be generated"
    )
    jurisdiction: Optional[Jurisdiction] = Field(
        default=None, description="Legal jurisdiction if known"
    )
    parties: list["PartyInfo"] = Field(
        default_factory=list, description="Known parties involved"
    )
    important_dates: list["DateInfo"] = Field(
        default_factory=list, description="Important dates related to the matter"
    )
    objective: str = Field(
        ...,
        min_length=5,
        max_length=2000,
        description="What the user wants to achieve",
    )
    context: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Additional context or background information",
    )

    @field_validator("problem_description", "objective")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class PartyInfo(BaseModel):
    """Information about a party."""

    name: str = Field(..., min_length=1, max_length=200, description="Party name")
    role: PartyRole = Field(..., description="Role in the legal matter")
    address: Optional[str] = Field(default=None, max_length=500, description="Party address")
    contact: Optional[str] = Field(default=None, max_length=200, description="Contact information")
    represented_by: Optional[str] = Field(default=None, max_length=200, description="Legal representative")


class DateInfo(BaseModel):
    """Important date information."""

    date: date_cls = Field(..., description="The date")
    description: str = Field(..., min_length=1, max_length=500, description="What happened on this date")
    is_approximate: bool = Field(default=False, description="Whether the date is approximate")


class ExtractedFact(BaseModel):
    """A single extracted fact with confidence."""

    fact: str = Field(..., description="The extracted fact")
    source_text: str = Field(..., description="Original text this fact was derived from")
    confidence: float = Field(
        default=1.0, ge=0.0, le=1.0, description="Confidence level (0-1)"
    )
    is_assumption: bool = Field(default=False, description="Whether this is an assumption")


class PartyRoleInfo(BaseModel):
    """Party with inferred role."""

    name: str = Field(..., description="Party name")
    role: PartyRole = Field(..., description="Inferred or provided role")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reasoning: str = Field(..., description="Why this role was assigned")


class FactExtractionResponse(BaseModel):
    """Response from fact extraction."""

    user_provided_facts: list[ExtractedFact] = Field(
        default_factory=list, description="Facts directly provided by user"
    )
    inferred_facts: list[ExtractedFact] = Field(
        default_factory=list, description="Facts inferred from the description"
    )
    parties_and_roles: list[PartyRoleInfo] = Field(
        default_factory=list, description="Parties with their roles"
    )
    important_dates: list[DateInfo] = Field(
        default_factory=list, description="Important dates extracted"
    )
    desired_outcome: str = Field(..., description="User's stated objective")
    missing_information: list[str] = Field(
        default_factory=list, description="Information needed but not provided"
    )
    contradictions: list[str] = Field(
        default_factory=list, description="Contradictions found in the input"
    )
    follow_up_questions: list[str] = Field(
        default_factory=list, description="Questions to clarify missing info"
    )
    assumptions: list[str] = Field(
        default_factory=list, description="Explicit assumptions made"
    )
    uncertainties: list[str] = Field(
        default_factory=list, description="Areas of uncertainty"
    )


class DraftSection(BaseModel):
    """A section of a generated draft document."""

    title: str = Field(..., description="Section title")
    content: str = Field(..., description="Section content")
    order: int = Field(..., description="Order in document")
    is_placeholder: bool = Field(default=False, description="Whether this section has placeholders")


class DraftResponse(BaseModel):
    """Response from draft generation."""

    document_type: DocumentType = Field(..., description="Type of document generated")
    title: str = Field(..., description="Document title")
    sections: list[DraftSection] = Field(..., description="Document sections")
    assumptions: list[str] = Field(
        default_factory=list, description="Assumptions made during drafting"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Warnings about the draft"
    )
    placeholders: list[str] = Field(
        default_factory=list, description="List of placeholders needing user input"
    )
    review_status: str = Field(
        default="draft_needs_review",
        description="Review status: draft_needs_review, ready_for_review, requires_legal_counsel",
    )
    disclaimer: str = Field(
        default="This document is generated by an AI assistant and does not constitute legal advice. "
        "Please consult with a qualified attorney before using this document for any legal purpose.",
        description="Legal disclaimer",
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status: healthy, degraded, unhealthy")
    version: str = Field(default="1.0.0", description="Service version")
    timestamp: str = Field(..., description="ISO format timestamp")


class LLMHealthResponse(BaseModel):
    """LLM provider health check response."""

    provider: str = Field(..., description="Provider name")
    model: str = Field(..., description="Model name")
    status: str = Field(..., description="Connection status: connected, error, not_configured")
    latency_ms: Optional[int] = Field(default=None, description="Response latency in milliseconds")
    error: Optional[str] = Field(default=None, description="Error message if any")


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict[str, Any]] = Field(default=None, description="Additional error details")


class DraftRequest(BaseModel):
    """Request for document draft generation."""

    document_type: DocumentType = Field(..., description="Type of document to generate")
    facts: FactExtractionResponse = Field(..., description="Extracted facts from fact extraction")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction")
    custom_instructions: Optional[str] = Field(
        default=None, max_length=2000, description="Additional drafting instructions"
    )
    template_id: Optional[str] = Field(default=None, description="Optional template identifier")


# Forward references resolution
FactExtractionRequest.model_rebuild()
DraftRequest.model_rebuild()


# Document Management Schemas
class DocumentUploadResponse(BaseModel):
    """Response from document upload."""

    id: str = Field(..., description="Document ID")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type (pdf, docx, txt)")
    file_size: int = Field(..., description="File size in bytes")
    upload_timestamp: datetime = Field(..., description="Upload timestamp")
    extraction_status: str = Field(..., description="Extraction status: pending, processing, completed, failed")
    extraction_error: Optional[str] = Field(default=None, description="Error message if extraction failed")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    chunk_count: int = Field(default=0, description="Number of text chunks created")


class DocumentListResponse(BaseModel):
    """Response for document listing."""

    documents: List[DocumentUploadResponse] = Field(default_factory=list)
    total: int = Field(default=0, description="Total number of documents")
    limit: int = Field(default=100, description="Limit applied")
    offset: int = Field(default=0, description="Offset applied")


class DocumentDeleteResponse(BaseModel):
    """Response from document deletion."""

    deleted: bool = Field(..., description="Whether document was deleted")
    document_id: str = Field(..., description="ID of deleted document")


# Retrieval Schemas
class RetrievalRequest(BaseModel):
    """Request for document retrieval."""

    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    document_ids: Optional[List[str]] = Field(default=None, description="Optional filter by document IDs")
    limit: int = Field(default=10, ge=1, le=50, description="Maximum results to return")


class RetrievalResult(BaseModel):
    """A single retrieval result."""

    chunk_id: str = Field(..., description="Chunk ID")
    document_id: str = Field(..., description="Document ID")
    text: str = Field(..., description="Retrieved text")
    score: float = Field(..., description="Relevance score")
    source_filename: str = Field(..., description="Source document filename")
    page_number: Optional[int] = Field(default=None, description="Page number if available")
    file_type: str = Field(..., description="Source file type")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class RetrievalResponse(BaseModel):
    """Response from retrieval."""

    results: List[RetrievalResult] = Field(default_factory=list)
    query: str = Field(..., description="Original query")
    total_results: int = Field(..., description="Total results found")


# Evidence-Grounded Drafting Schemas
class EvidenceGroundedDraftRequest(BaseModel):
    """Request for evidence-grounded document drafting."""

    document_type: DocumentType = Field(..., description="Type of document to generate")
    facts: FactExtractionResponse = Field(..., description="Extracted facts from fact extraction")
    query: str = Field(..., min_length=1, max_length=1000, description="Search query for evidence retrieval")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction")
    document_ids: Optional[List[str]] = Field(default=None, description="Optional filter by document IDs")
    custom_instructions: Optional[str] = Field(
        default=None, max_length=2000, description="Additional drafting instructions"
    )
    max_evidence_chunks: int = Field(default=8, ge=1, le=20, description="Maximum evidence chunks to retrieve")


class EvidenceExcerpt(BaseModel):
    """An excerpt from retrieved evidence."""

    source_id: int = Field(..., description="Source number for citation")
    chunk_id: str = Field(..., description="Chunk ID")
    document_id: str = Field(..., description="Document ID")
    source_filename: str = Field(..., description="Source document filename")
    page_number: Optional[int] = Field(default=None, description="Page number if available")
    excerpt: str = Field(..., description="Text excerpt")
    score: float = Field(..., description="Relevance score")


class EvidenceGroundedDraftResponse(BaseModel):
    """Response from evidence-grounded drafting."""

    draft: DraftResponse = Field(..., description="Generated draft")
    evidence_used: List[RetrievalResult] = Field(default_factory=list, description="Evidence chunks used")
    evidence_excerpts: List[EvidenceExcerpt] = Field(default_factory=list, description="Evidence excerpts for citation")
    warnings: List[str] = Field(default_factory=list, description="Warnings about evidence sufficiency")
    insufficient_evidence: bool = Field(default=False, description="Whether evidence was insufficient")


# ============================================================
# CHUNK 3: Review, Citation Verification, and Redlining Schemas
# ============================================================

class FindingCategory(str, Enum):
    """Categories of review findings."""
    AMBIGUOUS_LANGUAGE = "ambiguous_language"
    UNDEFINED_TERM = "undefined_term"
    CONTRADICTION = "contradiction"
    MISSING_INFORMATION = "missing_information"
    UNRESOLVED_PLACEHOLDER = "unresolved_placeholder"
    INCONSISTENT_PARTY = "inconsistent_party"
    INCONSISTENT_DATE = "inconsistent_date"
    INCONSISTENT_AMOUNT = "inconsistent_amount"
    INCONSISTENT_TERMINOLOGY = "inconsistent_terminology"
    INCONSISTENT_OBLIGATION = "inconsistent_obligation"
    UNSUPPORTED_CLAIM = "unsupported_claim"
    MISSING_CLAUSE = "missing_clause"
    STRUCTURAL_INCONSISTENCY = "structural_inconsistency"
    BROKEN_CROSS_REFERENCE = "broken_cross_reference"


class FindingSeverity(str, Enum):
    """Severity levels for findings."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ReviewFinding(BaseModel):
    """A single review finding."""
    finding_id: str = Field(..., description="Stable unique identifier for this finding")
    category: FindingCategory = Field(..., description="Category of the finding")
    severity: FindingSeverity = Field(..., description="Severity level")
    location: str = Field(..., description="Paragraph/section reference (e.g., 'Section 3.2', 'Paragraph 5')")
    description: str = Field(..., description="Explanation of the issue")
    suggested_correction: Optional[str] = Field(default=None, description="Suggested correction or improvement")
    evidence_ids: List[str] = Field(default_factory=list, description="Related evidence chunk IDs")
    related_finding_ids: List[str] = Field(default_factory=list, description="Related finding IDs")
    uncertainty: Optional[str] = Field(default=None, description="Limitations or uncertainty in this finding")
    confidence: float = Field(default=0.8, ge=0.0, le=1.0, description="Confidence in this finding")


class ReviewRequest(BaseModel):
    """Request for document review."""
    draft: DraftResponse = Field(..., description="Draft to review")
    facts: FactExtractionResponse = Field(..., description="Original extracted facts")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction")
    document_ids: Optional[List[str]] = Field(default=None, description="Optional uploaded document IDs for evidence")
    custom_checks: Optional[List[str]] = Field(default=None, description="Additional custom review criteria")


class ReviewResponse(BaseModel):
    """Response from document review."""
    findings: List[ReviewFinding] = Field(default_factory=list, description="All review findings")
    summary: dict = Field(default_factory=dict, description="Summary statistics (counts by category/severity)")
    document_hash: str = Field(..., description="Hash of reviewed document for staleness detection")


# Citation Verification Schemas
class CitationStatus(str, Enum):
    """Citation verification status."""
    VERIFIED = "verified"
    PARTIALLY_VERIFIED = "partially_verified"
    UNVERIFIED = "unverified"
    NOT_CHECKED = "not_checked"


class CitationSource(BaseModel):
    """Authoritative source for citation verification."""
    title: str = Field(..., description="Source title (e.g., 'California Civil Code § 1950.5')")
    url: Optional[str] = Field(default=None, description="Source URL if available")
    retrieved_at: datetime = Field(default_factory=datetime.utcnow, description="Retrieval timestamp")
    excerpt: str = Field(..., description="Relevant excerpt from source")
    jurisdiction: Optional[str] = Field(default=None, description="Jurisdiction of the source")


class Citation(BaseModel):
    """A citation extracted from a draft."""
    citation_id: str = Field(..., description="Unique citation identifier")
    raw_text: str = Field(..., description="Original citation text in draft")
    normalized_form: str = Field(..., description="Normalized citation form")
    location: str = Field(..., description="Location in draft (section, paragraph)")
    proposed_proposition: str = Field(..., description="What the draft claims this citation supports")


class CitationVerificationResult(BaseModel):
    """Result of verifying a single citation."""
    citation_id: str = Field(..., description="Citation identifier")
    status: CitationStatus = Field(..., description="Verification status")
    sources: List[CitationSource] = Field(default_factory=list, description="Authoritative sources found")
    supports_proposition: Optional[bool] = Field(default=None, description="Whether source supports the stated proposition")
    current_status_checked: bool = Field(default=False, description="Whether current legal status was checked")
    notes: Optional[str] = Field(default=None, description="Additional notes or limitations")
    checked_at: datetime = Field(default_factory=datetime.utcnow, description="Verification timestamp")


class CitationVerificationRequest(BaseModel):
    """Request for citation verification."""
    draft: DraftResponse = Field(..., description="Draft containing citations to verify")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction for source selection")
    citation_ids: Optional[List[str]] = Field(default=None, description="Optional specific citations to verify")


class CitationVerificationResponse(BaseModel):
    """Response from citation verification."""
    results: List[CitationVerificationResult] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict, description="Summary statistics by status")
    sources_configured: bool = Field(default=False, description="Whether authoritative sources are configured")


# Redlining Schemas
class RedlineOperationType(str, Enum):
    """Types of redline operations."""
    INSERT = "insert"
    DELETE = "delete"
    REPLACE = "replace"


class RedlineOperation(BaseModel):
    """A single redline edit operation."""
    operation_id: str = Field(..., description="Unique operation identifier")
    operation_type: RedlineOperationType = Field(..., description="Type of operation")
    target_location: str = Field(..., description="Target paragraph/section identifier")
    original_text: str = Field(..., description="Original text to be modified")
    proposed_text: str = Field(..., description="Proposed new text (empty for DELETE)")
    explanation: str = Field(..., description="Why this edit is proposed")
    risk_level: FindingSeverity = Field(default=FindingSeverity.MEDIUM, description="Risk level of this edit")
    related_finding_ids: List[str] = Field(default_factory=list, description="Related review finding IDs")
    evidence_ids: List[str] = Field(default_factory=list, description="Supporting evidence IDs")
    depends_on: List[str] = Field(default_factory=list, description="Operation IDs this depends on")


class RedlineRequest(BaseModel):
    """Request for generating redline proposals."""
    draft: DraftResponse = Field(..., description="Draft to redline")
    review_response: Optional[ReviewResponse] = Field(default=None, description="Optional review findings to base redlines on")
    facts: FactExtractionResponse = Field(..., description="Original extracted facts")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction")
    max_operations: int = Field(default=20, ge=1, le=50, description="Maximum redline operations to generate")


class RedlineResponse(BaseModel):
    """Response with proposed redline operations."""
    operations: List[RedlineOperation] = Field(default_factory=list, description="Proposed redline operations")
    document_hash: str = Field(..., description="Hash of source document for staleness detection")
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class RedlineDecision(BaseModel):
    """User decision on a redline operation."""
    operation_id: str = Field(..., description="Operation ID")
    accepted: bool = Field(..., description="Whether to accept this operation")


class RedlineDecisionsRequest(BaseModel):
    """Request to accept/reject redline operations."""
    document_hash: str = Field(..., description="Hash of the document these decisions apply to")
    decisions: List[RedlineDecision] = Field(..., description="Decisions for each operation")


class RedlineDecisionsResponse(BaseModel):
    """Response after applying redline decisions."""
    applied_operations: List[str] = Field(default_factory=list, description="IDs of applied operations")
    rejected_operations: List[str] = Field(default_factory=list, description="IDs of rejected operations")
    conflicts: List[dict] = Field(default_factory=list, description="Any conflicts detected")
    updated_draft: Optional[DraftResponse] = Field(default=None, description="Updated draft if requested")
    new_document_hash: str = Field(..., description="New document hash after applied changes")


class RedlinePreviewRequest(BaseModel):
    """Request for previewing accepted redline changes."""
    document_hash: str = Field(..., description="Hash of the document with applied decisions")


class RedlinePreviewResponse(BaseModel):
    """Preview of document with accepted redline changes."""
    original_draft: DraftResponse = Field(..., description="Original draft before changes")
    preview_draft: DraftResponse = Field(..., description="Draft with accepted changes applied")
    changes_summary: List[dict] = Field(default_factory=list, description="Summary of applied changes")


# ============================================================
# CHUNK 4: Style Adaptation, Export, and Voice Agent Schemas
# ============================================================

class StyleProfile(BaseModel):
    """Extracted style profile from a reference document."""
    profile_id: str = Field(..., description="Unique profile identifier")
    source_document_id: str = Field(..., description="Source document ID")
    source_filename: str = Field(..., description="Original filename")
    
    # Heading hierarchy
    heading_styles: List[dict] = Field(default_factory=list, description="Heading levels, numbering, formatting")
    
    # Paragraph and list formatting
    paragraph_style: dict = Field(default_factory=dict, description="Default paragraph formatting")
    list_styles: List[dict] = Field(default_factory=list, description="Bullet/numbered list formatting")
    
    # Tone and sentence style
    tone_indicators: dict = Field(default_factory=dict, description="Tone markers (formal, persuasive, etc.)")
    avg_sentence_length: Optional[float] = Field(default=None, description="Average sentence length in words")
    sentence_complexity: Optional[str] = Field(default=None, description="simple, moderate, complex")
    
    # Terminology
    defined_terms: List[dict] = Field(default_factory=list, description="Defined terms with definitions")
    preferred_terms: dict = Field(default_factory=dict, description="Preferred terminology mappings")
    avoid_terms: List[str] = Field(default_factory=list, description="Terms to avoid")
    
    # Table formatting
    table_style: dict = Field(default_factory=dict, description="Table formatting conventions")
    
    # Signature blocks
    signature_blocks: List[dict] = Field(default_factory=list, description="Signature block patterns")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    extracted_at: datetime = Field(default_factory=datetime.utcnow)


class StyleExtractionRequest(BaseModel):
    """Request to extract style profile from a document."""
    document_id: str = Field(..., description="ID of uploaded document to analyze")
    profile_name: Optional[str] = Field(default=None, description="Optional name for the profile")


class StyleExtractionResponse(BaseModel):
    """Response from style profile extraction."""
    profile: StyleProfile = Field(..., description="Extracted style profile")
    warnings: List[str] = Field(default_factory=list, description="Warnings about extraction")


class StyleApplicationRequest(BaseModel):
    """Request to apply style profile to a draft."""
    draft: DraftResponse = Field(..., description="Draft to restyle")
    profile: StyleProfile = Field(..., description="Style profile to apply")
    preserve_content: bool = Field(default=True, description="Preserve user content, only apply formatting")
    target_sections: Optional[List[str]] = Field(default=None, description="Specific sections to restyle (None = all)")


class StyleApplicationResponse(BaseModel):
    """Response from style application."""
    restyled_draft: DraftResponse = Field(..., description="Draft with applied style")
    changes_summary: List[dict] = Field(default_factory=list, description="Summary of style changes applied")
    warnings: List[str] = Field(default_factory=list, description="Warnings about application")


# Document Export Schemas
class ExportFormat(str, Enum):
    """Supported export formats."""
    DOCX = "docx"
    PDF = "pdf"


class ExportRequest(BaseModel):
    """Request to export a draft document."""
    draft: DraftResponse = Field(..., description="Draft to export")
    format: ExportFormat = Field(default=ExportFormat.DOCX, description="Export format")
    include_comments: bool = Field(default=False, description="Include review comments in export")
    include_changes_summary: bool = Field(default=False, description="Include changes summary page")
    filename: Optional[str] = Field(default=None, description="Custom filename (without extension)")


class ExportResponse(BaseModel):
    """Response from document export."""
    file_id: str = Field(..., description="Unique export file identifier")
    filename: str = Field(..., description="Generated filename")
    format: ExportFormat = Field(..., description="Export format")
    download_url: str = Field(..., description="URL to download the exported file")
    expires_at: datetime = Field(..., description="Expiration timestamp for download link")
    file_size_bytes: int = Field(..., description="File size in bytes")


# Voice Agent Schemas
class VoiceProvider(str, Enum):
    """Supported voice providers."""
    OPENAI = "openai"
    GOOGLE = "google"
    AZURE = "azure"
    ELEVENLABS = "elevenlabs"
    LOCAL = "local"


class VoiceCommandType(str, Enum):
    """Supported voice command types."""
    SUMMARIZE = "summarize"
    EXPLAIN_CLAUSE = "explain_clause"
    REVISE_PARAGRAPH = "revise_paragraph"
    FIND_CONTRADICTIONS = "find_contradictions"
    SUGGEST_EDIT = "suggest_edit"
    FIND_MISSING_INFO = "find_missing_info"


class VoiceProviderConfig(BaseModel):
    """Voice provider configuration."""
    stt_provider: VoiceProvider = Field(default=VoiceProvider.OPENAI, description="Speech-to-text provider")
    stt_model: str = Field(default="whisper-1", description="STT model")
    stt_api_key: Optional[str] = Field(default=None, description="STT API key")
    stt_base_url: Optional[str] = Field(default=None, description="STT base URL")
    
    tts_provider: VoiceProvider = Field(default=VoiceProvider.OPENAI, description="Text-to-speech provider")
    tts_model: str = Field(default="tts-1", description="TTS model")
    tts_voice: str = Field(default="alloy", description="TTS voice")
    tts_api_key: Optional[str] = Field(default=None, description="TTS API key")
    tts_base_url: Optional[str] = Field(default=None, description="TTS base URL")


class VoiceCommandRequest(BaseModel):
    """Request to process a voice command."""
    command_text: str = Field(..., description="Transcribed command text")
    draft: Optional[DraftResponse] = Field(default=None, description="Current draft context")
    facts: Optional[FactExtractionResponse] = Field(default=None, description="Original facts context")
    document_ids: Optional[List[str]] = Field(default=None, description="Document IDs for context")


class VoiceCommandResponse(BaseModel):
    """Response from voice command processing."""
    command_type: VoiceCommandType = Field(..., description="Detected command type")
    response_text: str = Field(..., description="Text response to user")
    action_required: bool = Field(default=False, description="Whether user confirmation is needed")
    proposed_changes: Optional[List[RedlineOperation]] = Field(default=None, description="Proposed edits if applicable")
    target_location: Optional[str] = Field(default=None, description="Target location for edits")
    explanation: str = Field(..., description="Explanation of what was done")
    requires_confirmation: bool = Field(default=False, description="Whether destructive/bulk edit needs confirmation")


class VoiceProviderConfigRequest(BaseModel):
    """Request to configure voice providers."""
    config: VoiceProviderConfig = Field(..., description="Voice provider configuration")


class VoiceProviderConfigResponse(BaseModel):
    """Response from voice provider configuration."""
    stt_configured: bool = Field(..., description="Whether STT is configured")
    tts_configured: bool = Field(..., description="Whether TTS is configured")
    stt_provider: Optional[VoiceProvider] = Field(default=None)
    tts_provider: Optional[VoiceProvider] = Field(default=None)
    message: str = Field(..., description="Configuration status message")


# ============================================================
# CHUNK 5: External Review, Legal RAG, Summarization & Q&A Schemas
# ============================================================

class ExternalReviewRequest(BaseModel):
    """Request for external document review."""
    document_id: str = Field(..., description="ID of uploaded document to review")
    facts: Optional[FactExtractionResponse] = Field(default=None, description="Optional known facts for comparison")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction")
    custom_checks: Optional[List[str]] = Field(default=None, description="Additional custom review criteria")


class ExternalReviewResponse(BaseModel):
    """Response from external document review."""
    document_id: str = Field(..., description="ID of reviewed document")
    findings: List[ReviewFinding] = Field(default_factory=list, description="All review findings")
    summary: dict = Field(default_factory=dict, description="Summary statistics (counts by category/severity)")
    document_hash: str = Field(..., description="Hash of reviewed document for staleness detection")
    suggested_edits: List[RedlineOperation] = Field(default_factory=list, description="Suggested redline edits")


class CitationVerificationExternalRequest(BaseModel):
    """Request for citation verification on external document."""
    document_id: str = Field(..., description="ID of uploaded document to verify")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction for source selection")
    citation_ids: Optional[List[str]] = Field(default=None, description="Optional specific citations to verify")


class CitationVerificationExternalResponse(BaseModel):
    """Response from citation verification on external document."""
    document_id: str = Field(..., description="ID of verified document")
    results: List[CitationVerificationResult] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict, description="Summary statistics by status")
    sources_configured: bool = Field(default=False, description="Whether authoritative sources are configured")


class SummarizationRequest(BaseModel):
    """Request for document summarization."""
    document_id: str = Field(..., description="ID of uploaded document to summarize")
    detail_level: str = Field(default="standard", description="Detail level: brief, standard, detailed")
    focus_areas: Optional[List[str]] = Field(default=None, description="Specific areas to focus on (e.g., obligations, deadlines, parties)")


class SummarizationResponse(BaseModel):
    """Response from document summarization."""
    document_id: str = Field(..., description="ID of summarized document")
    summary: str = Field(..., description="Generated summary")
    detail_level: str = Field(..., description="Detail level used")
    key_facts: List[str] = Field(default_factory=list, description="Key facts extracted")
    parties: List[str] = Field(default_factory=list, description="Parties mentioned")
    key_dates: List[str] = Field(default_factory=list, description="Key dates and deadlines")
    obligations: List[str] = Field(default_factory=list, description="Key obligations and commitments")
    risks: List[str] = Field(default_factory=list, description="Potential risks and issues")
    citations: List[str] = Field(default_factory=list, description="Legal citations found")
    references: List[str] = Field(default_factory=list, description="Page/section references")
    warnings: List[str] = Field(default_factory=list, description="Warnings about summary limitations")


class DocumentQARequest(BaseModel):
    """Request for document-specific Q&A."""
    document_id: str = Field(..., description="ID of uploaded document")
    question: str = Field(..., min_length=1, max_length=2000, description="Question about the document")
    conversation_history: Optional[List[dict]] = Field(default=None, description="Previous Q&A pairs for context")
    include_sources: bool = Field(default=True, description="Include source excerpts in response")


class DocumentQAResponse(BaseModel):
    """Response from document-specific Q&A."""
    document_id: str = Field(..., description="ID of queried document")
    question: str = Field(..., description="Original question")
    answer: str = Field(..., description="Generated answer")
    sources: List[RetrievalResult] = Field(default_factory=list, description="Supporting document excerpts")
    confidence: float = Field(default=0.8, ge=0.0, le=1.0, description="Confidence in answer")
    insufficient_evidence: bool = Field(default=False, description="Whether document lacks sufficient evidence")
    follow_up_suggestions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class LegalAssistantRequest(BaseModel):
    """Request for general legal AI assistant."""
    question: str = Field(..., min_length=1, max_length=2000, description="Legal question")
    jurisdiction: Optional[Jurisdiction] = Field(default=None, description="Legal jurisdiction (required for jurisdiction-specific questions)")
    conversation_history: Optional[List[dict]] = Field(default=None, description="Previous Q&A pairs for context")
    include_sources: bool = Field(default=True, description="Include source citations in response")


class LegalAssistantResponse(BaseModel):
    """Response from general legal AI assistant."""
    question: str = Field(..., description="Original question")
    answer: str = Field(..., description="Generated answer")
    jurisdiction: Optional[str] = Field(default=None, description="Jurisdiction used for answer")
    sources: List[CitationSource] = Field(default_factory=list, description="Supporting legal sources")
    confidence: float = Field(default=0.7, ge=0.0, le=1.0, description="Confidence in answer")
    disclaimer: str = Field(default="This is general legal information, not legal advice. Consult a qualified attorney for your specific situation.", description="Legal disclaimer")
    limitations: List[str] = Field(default_factory=list, description="Limitations and caveats")
    follow_up_suggestions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


# ============================================================
# CHUNK 6: Legal Argument Strategist for Indian Lawyers Schemas
# ============================================================

class CaseDocumentCategory(str, Enum):
    """Categories of documents in a case workspace."""
    CLIENT_PLEADINGS = "client_pleadings"
    OPPOSING_PLEADINGS = "opposing_pleadings"
    EVIDENCE = "evidence"
    COURT_ORDERS = "court_orders"
    STATUTES = "statutes"
    LEGAL_AUTHORITIES = "legal_authorities"
    LAWYER_NOTES = "lawyer_notes"
    COURT_ORDERS_JUDGMENTS = "court_orders_judgments"
    PROCEDURAL_HISTORY = "procedural_history"


class CaseDocumentCategoryEnum(str, Enum):
    """Document categories for case workspace."""
    CLIENT_PLEADINGS = "client_pleadings"
    OPPOSING_PLEADINGS = "opposing_pleadings"
    EVIDENCE = "evidence"
    COURT_ORDERS = "court_orders"
    STATUTES = "statutes"
    LEGAL_AUTHORITIES = "legal_authorities"
    LAWYER_NOTES = "lawyer_notes"
    COURT_ORDERS_JUDGMENTS = "court_orders_judgments"
    PROCEDURAL_HISTORY = "procedural_history"


class DocumentCategory(str, Enum):
    """Document categories for case workspace."""
    CLIENT_PLEADINGS = "client_pleadings"
    OPPOSING_PLEADINGS = "opposing_pleadings"
    EVIDENCE = "evidence"
    COURT_ORDERS = "court_orders"
    STATUTES = "statutes"
    LEGAL_AUTHORITIES = "legal_authorities"
    LAWYER_NOTES = "lawyer_notes"
    COURT_ORDERS_JUDGMENTS = "court_orders_judgments"
    PROCEDURAL_HISTORY = "procedural_history"


class CaseDocumentType(str, Enum):
    """Document type within a case workspace."""
    PLAINT = "plaint"
    WRITTEN_STATEMENT = "written_statement"
    AFFIDAVIT = "affidavit"
    INTERLOCUTORY_APPLICATION = "interlocutory_application"
    REPLY = "reply"
    REJOINDER = "rejoinder"
    EVIDENCE_AFFIDAVIT = "evidence_affidavit"
    EXHIBIT = "exhibit"
    COURT_ORDER = "court_order"
    JUDGMENT = "judgment"
    STATUTE = "statute"
    RULE = "rule"
    REGULATION = "regulation"
    CASE_LAW = "case_law"
    LEGAL_AUTHORITY = "legal_authority"
    LAWYER_NOTE = "lawyer_note"
    PROCEDURAL_ORDER = "procedural_order"
    OTHER = "other"


class CaseDocumentInfo(BaseModel):
    """Information about a document in a case workspace."""
    document_id: str = Field(..., description="Document ID")
    category: DocumentCategory = Field(..., description="Document category")
    document_type: CaseDocumentType = Field(..., description="Document type")
    original_filename: str = Field(..., description="Original filename")
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")
    page_count: Optional[int] = Field(default=None, description="Number of pages")
    file_size: int = Field(..., description="File size in bytes")
    extraction_status: str = Field(..., description="Extraction status")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    chunk_count: int = Field(default=0, description="Number of chunks")


class CaseWorkspaceCreateRequest(BaseModel):
    """Request to create a case workspace."""
    case_name: str = Field(..., min_length=1, max_length=500, description="Case name/title")
    case_number: Optional[str] = Field(default=None, description="Court case number")
    court: Optional[str] = Field(default=None, description="Court name")
    jurisdiction: Optional[str] = Field(default=None, description="Jurisdiction (e.g., 'India', 'Delhi High Court', 'Supreme Court of India')")
    case_type: Optional[str] = Field(default=None, description="Case type (e.g., 'Civil', 'Criminal', 'Constitutional', 'Arbitration')")
    parties: List[PartyInfo] = Field(default_factory=list, description="Parties in the case")
    description: Optional[str] = Field(default=None, max_length=5000, description="Case description")


class CaseWorkspaceResponse(BaseModel):
    """Response for case workspace operations."""
    case_id: str = Field(..., description="Case workspace ID")
    case_name: str = Field(..., description="Case name/title")
    case_number: Optional[str] = Field(default=None, description="Court case number")
    court: Optional[str] = Field(default=None, description="Court name")
    jurisdiction: Optional[str] = Field(default=None, description="Jurisdiction")
    case_type: Optional[str] = Field(default=None, description="Case type")
    parties: List[PartyInfo] = Field(default_factory=list, description="Parties in the case")
    description: Optional[str] = Field(default=None, description="Case description")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    documents: List[CaseDocumentInfo] = Field(default_factory=list, description="Documents in the workspace")
    document_count: int = Field(default=0, description="Total number of documents")


class CaseWorkspaceListResponse(BaseModel):
    """Response for listing case workspaces."""
    cases: List[CaseWorkspaceResponse] = Field(default_factory=list)
    total: int = Field(default=0, description="Total number of cases")
    limit: int = Field(default=20, description="Limit applied")
    offset: int = Field(default=0, description="Offset applied")


class CaseDocumentUploadRequest(BaseModel):
    """Request to upload a document to a case workspace."""
    case_id: str = Field(..., description="Case workspace ID")
    category: DocumentCategory = Field(..., description="Document category")
    document_type: CaseDocumentType = Field(..., description="Document type")
    party_side: Optional[str] = Field(default=None, description="Which party's document (client/opposing/court/neutral)")
    description: Optional[str] = Field(default=None, max_length=1000, description="Document description")


class CaseDocumentUploadResponse(BaseModel):
    """Response from case document upload."""
    document_id: str = Field(..., description="Document ID")
    case_id: str = Field(..., description="Case workspace ID")
    category: DocumentCategory = Field(..., description="Document category")
    document_type: CaseDocumentType = Field(..., description="Document type")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    upload_timestamp: datetime = Field(..., description="Upload timestamp")
    extraction_status: str = Field(..., description="Extraction status")
    page_count: Optional[int] = Field(default=None, description="Number of pages")
    chunk_count: int = Field(default=0, description="Number of chunks created")


class CaseBriefRequest(BaseModel):
    """Request to generate case brief and chronology."""
    case_id: str = Field(..., description="Case workspace ID")
    include_opposition_analysis: bool = Field(default=True, description="Include opposition analysis")
    include_legal_research: bool = Field(default=True, description="Include legal research suggestions")


class CaseBriefResponse(BaseModel):
    """Response with case brief and chronology."""
    case_id: str = Field(..., description="Case workspace ID")
    case_name: str = Field(..., description="Case name")
    parties: List[PartyInfo] = Field(default_factory=list, description="Parties in the case")
    court: Optional[str] = Field(default=None, description="Court")
    jurisdiction: Optional[str] = Field(default=None, description="Jurisdiction")
    case_type: Optional[str] = Field(default=None, description="Case type")
    case_number: Optional[str] = Field(default=None, description="Case number")
    claims: List[str] = Field(default_factory=list, description="Claims by plaintiff/petitioner")
    defences: List[str] = Field(default_factory=list, description="Defences by defendant/respondent")
    relief_sought: List[str] = Field(default_factory=list, description="Relief sought")
    material_facts: List[str] = Field(default_factory=list, description="Material facts from documents")
    disputed_facts: List[str] = Field(default_factory=list, description="Disputed facts between parties")
    procedural_history: List[str] = Field(default_factory=list, description="Procedural history and court orders")
    important_dates: List[DateInfo] = Field(default_factory=list, description="Important dates and deadlines")
    evidence_summary: List[str] = Field(default_factory=list, description="Summary of evidence")
    admissions: List[str] = Field(default_factory=list, description="Admissions by parties")
    denials: List[str] = Field(default_factory=list, description="Denials by parties")
    inconsistencies: List[str] = Field(default_factory=list, description="Inconsistencies found")
    missing_information: List[str] = Field(default_factory=list, description="Missing information or documents")
    timeline: List[dict] = Field(default_factory=list, description="Chronological timeline of events")
    evidence_map: dict = Field(default_factory=dict, description="Mapping of evidence to propositions")
    missing_documents: List[str] = Field(default_factory=list, description="Missing documents needed")
    confidence_assessment: str = Field(default="", description="Overall confidence in the analysis")


class OppositionComparisonRequest(BaseModel):
    """Request to compare client and opposition documents."""
    case_id: str = Field(..., description="Case workspace ID")
    client_document_ids: List[str] = Field(default_factory=list, description="Client document IDs")
    opposition_document_ids: List[str] = Field(default_factory=list, description="Opposition document IDs")
    focus_areas: Optional[List[str]] = Field(default=None, description="Specific areas to focus on")


class OppositionComparisonResponse(BaseModel):
    """Response from client-opposition comparison."""
    case_id: str = Field(..., description="Case workspace ID")
    client_arguments: List[str] = Field(default_factory=list, description="Client's key arguments")
    opposition_arguments: List[str] = Field(default_factory=list, description="Opposition's key arguments")
    unsupported_allegations: List[str] = Field(default_factory=list, description="Opposition allegations unsupported by evidence")
    contradictions_in_opposition: List[str] = Field(default_factory=list, description="Contradictions in opposition submissions")
    conflicts_pleadings_evidence: List[str] = Field(default_factory=list, description="Conflicts between pleadings and evidence")
    admitted_facts: List[str] = Field(default_factory=list, description="Facts admitted by opposition")
    denied_facts: List[str] = Field(default_factory=list, description="Facts denied by opposition")
    disputed_facts: List[str] = Field(default_factory=list, description="Facts in dispute")
    evidentiary_weaknesses: List[str] = Field(default_factory=list, description="Evidentiary weaknesses in opposition case")
    unanswered_claims: List[str] = Field(default_factory=list, description="Client claims unanswered by opposition")
    client_weaknesses: List[str] = Field(default_factory=list, description="Potential weaknesses in client's position")
    possible_objections: List[str] = Field(default_factory=list, description="Potential opposition objections")
    evidence_gaps: List[str] = Field(default_factory=list, description="Evidence gaps in both sides")
    confidence: str = Field(default="", description="Overall confidence assessment")


class LegalResearchRequest(BaseModel):
    """Request for legal research on specific issues."""
    case_id: Optional[str] = Field(default=None, description="Case workspace ID (optional)")
    issues: List[str] = Field(..., min_items=1, description="Legal issues to research")
    jurisdiction: str = Field(default="India", description="Jurisdiction (e.g., 'India', 'Supreme Court of India', 'Delhi High Court')")
    include_constitutional: bool = Field(default=True, description="Include constitutional provisions")
    include_statutes: bool = Field(default=True, description="Include statutes and rules")
    include_precedents: bool = Field(default=True, description="Include case law precedents")
    max_results_per_issue: int = Field(default=10, ge=1, le=50, description="Max results per issue")


class LegalResearchResult(BaseModel):
    """Result for a single legal research issue."""
    issue: str = Field(..., description="Legal issue researched")
    constitutional_provisions: List[dict] = Field(default_factory=list, description="Relevant constitutional provisions")
    statutes: List[dict] = Field(default_factory=list, description="Relevant statutes and sections")
    rules_regulations: List[dict] = Field(default_factory=list, description="Relevant rules and regulations")
    precedents: List[dict] = Field(default_factory=list, description="Relevant case law precedents")
    binding_authorities: List[dict] = Field(default_factory=list, description="Binding authorities")
    persuasive_authorities: List[dict] = Field(default_factory=list, description="Persuasive authorities")
    ratio_decidendi: List[str] = Field(default_factory=list, description="Ratio decidendi of key cases")
    factual_distinctions: List[str] = Field(default_factory=list, description="Material factual distinctions")
    subsequent_treatment: List[str] = Field(default_factory=list, description="Subsequent treatment of authorities")
    legal_position_summary: str = Field(default="", description="Summary of legal position")
    research_gaps: List[str] = Field(default_factory=list, description="Areas needing further research")
    sources: List[CitationSource] = Field(default_factory=list, description="Sources consulted")
    confidence: float = Field(default=0.7, ge=0.0, le=1.0, description="Confidence in research")


class LegalResearchResponse(BaseModel):
    """Response from legal research."""
    results: List[LegalResearchResult] = Field(default_factory=list)
    total_issues: int = Field(default=0, description="Total issues researched")
    overall_confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    sources_configured: bool = Field(default=False, description="Whether authoritative sources are configured")
    disclaimer: str = Field(default="This is legal research assistance, not legal advice. Verify all authorities independently.")


class ArgumentBuilderRequest(BaseModel):
    """Request to generate argument outlines."""
    case_id: str = Field(..., description="Case workspace ID")
    argument_type: str = Field(default="client", description="Type: 'client', 'opposition', 'rebuttal', 'constitutional', 'alternative'")
    target_argument: Optional[str] = Field(default=None, description="Specific opposition argument to rebut (for rebuttal type)")
    issues: List[str] = Field(default_factory=list, description="Specific issues to address")
    jurisdiction: str = Field(default="India", description="Jurisdiction")
    max_arguments: int = Field(default=5, ge=1, le=20, description="Maximum number of arguments")
    include_alternatives: bool = Field(default=True, description="Include alternative arguments")
    include_rebuttals: bool = Field(default=True, description="Include rebuttals to expected counterarguments")
    include_alternative_arguments: bool = Field(default=True, description="Include alternative legal theories")


class ArgumentOutline(BaseModel):
    """A single structured argument outline."""
    argument_id: str = Field(..., description="Unique argument identifier")
    issue: str = Field(..., description="Legal issue or question of law")
    material_facts: List[str] = Field(default_factory=list, description="Relevant material facts")
    supporting_evidence: List[str] = Field(default_factory=list, description="Supporting evidence with document references")
    legal_provisions: List[str] = Field(default_factory=list, description="Applicable constitutional provisions, statutes, principles")
    supporting_authorities: List[dict] = Field(default_factory=list, description="Supporting authorities with passages")
    legal_reasoning: str = Field(..., description="Application of law to facts")
    proposed_argument: str = Field(..., description="Proposed submission/argument text")
    expected_counterargument: str = Field(default="", description="Expected opposition counterargument")
    rebuttal: str = Field(default="", description="Rebuttal to expected counterargument")
    weaknesses: List[str] = Field(default_factory=list, description="Weaknesses, adverse authorities, missing prerequisites")
    additional_documents_needed: List[str] = Field(default_factory=list, description="Additional documents or facts needed")
    proposed_relief: str = Field(default="", description="Proposed relief or legal outcome")
    priority: int = Field(default=1, description="Priority order")
    argument_type: str = Field(default="primary", description="Type: primary, alternative, rebuttal, constitutional")
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)


class ArgumentBuilderResponse(BaseModel):
    """Response with generated argument outlines."""
    case_id: str = Field(..., description="Case workspace ID")
    arguments: List[ArgumentOutline] = Field(default_factory=list, description="Generated argument outlines")
    alternative_arguments: List[ArgumentOutline] = Field(default_factory=list, description="Alternative arguments")
    rebuttals: List[ArgumentOutline] = Field(default_factory=list, description="Rebuttals to expected counterarguments")
    constitutional_arguments: List[ArgumentOutline] = Field(default_factory=list, description="Constitutional arguments")
    argument_outline: str = Field(default="", description="Structured written-submission outline")
    oral_submission_outline: str = Field(default="", description="Draft oral submission outline")
    weaknesses_summary: List[str] = Field(default_factory=list, description="Overall weaknesses identified")
    additional_documents_needed: List[str] = Field(default_factory=list, description="Documents needed to strengthen arguments")
    research_gaps: List[str] = Field(default_factory=list, description="Research gaps identified")
    disclaimer: str = Field(default="These are AI-generated argument outlines for lawyer review. Not legal advice. Verify all authorities independently.")


class ScrutinyChecklistItem(BaseModel):
    """A single item in the scrutiny checklist."""
    item_id: str = Field(..., description="Unique item identifier")
    category: str = Field(..., description="Category (A-F)")
    sub_category: str = Field(..., description="Sub-category (e.g., A.1, B.2)")
    description: str = Field(..., description="Checklist item description")
    status: str = Field(..., description="Status: PASS, ISSUE_FOUND, NEEDS_REVIEW, NOT_APPLICABLE")
    explanation: str = Field(default="", description="Explanation of the finding")
    evidence_reference: Optional[str] = Field(default=None, description="Evidence reference (document, page, section)")
    severity: FindingSeverity = Field(default=FindingSeverity.MEDIUM, description="Severity if issue found")


class ScrutinyChecklistRequest(BaseModel):
    """Request to run the scrutiny checklist."""
    case_id: str = Field(..., description="Case workspace ID")
    draft_document_id: Optional[str] = Field(default=None, description="Draft document ID to check (optional)")
    categories: Optional[List[str]] = Field(default=None, description="Categories to check (A-F, default all)")


class ScrutinyChecklistResponse(BaseModel):
    """Response from scrutiny checklist."""
    case_id: str = Field(..., description="Case workspace ID")
    items: List[ScrutinyChecklistItem] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict, description="Summary statistics")
    overall_status: str = Field(default="", description="Overall status: PASS, ISSUES_FOUND, NEEDS_REVIEW")
    document_hash: str = Field(..., description="Hash of reviewed document for staleness detection")


class CitationVerificationCaseRequest(BaseModel):
    """Request for citation verification in a case context."""
    case_id: str = Field(..., description="Case workspace ID")
    document_ids: Optional[List[str]] = Field(default=None, description="Specific document IDs to verify")
    citation_ids: Optional[List[str]] = Field(default=None, description="Specific citation IDs to verify")
    jurisdiction: str = Field(default="India", description="Jurisdiction")
    verify_all: bool = Field(default=True, description="Verify all citations in the case")


class CitationVerificationCaseResponse(BaseModel):
    """Response from case-level citation verification."""
    case_id: str = Field(..., description="Case workspace ID")
    results: List[CitationVerificationResult] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict, description="Summary statistics by status")
    sources_configured: bool = Field(default=False, description="Whether authoritative sources are configured")
    disclaimer: str = Field(default="Citation verification based on available sources. Verify independently.")


class CaseAssistantRequest(BaseModel):
    """Request for case-specific conversational assistant."""
    case_id: str = Field(..., description="Case workspace ID")
    question: Optional[str] = Field(default=None, max_length=2000, description="Question about the case")
    command_text: Optional[str] = Field(default=None, max_length=2000, description="Command or question")
    conversation_history: Optional[List[dict]] = Field(default=None, description="Previous Q&A pairs for context")
    include_sources: bool = Field(default=True, description="Include source citations")
    draft_document_id: Optional[str] = Field(default=None, description="Optional draft document ID")

    @model_validator(mode="after")
    def validate_query(self) -> 'CaseAssistantRequest':
        if not self.question and not self.command_text:
            raise ValueError("Either question or command_text must be provided")
        if not self.question:
            self.question = self.command_text
        if not self.command_text:
            self.command_text = self.question
        return self


class CaseAssistantResponse(BaseModel):
    """Response from case assistant."""
    case_id: str = Field(..., description="Case workspace ID")
    question: str = Field(..., description="Original question")
    answer: str = Field(..., description="Generated answer")
    sources: List[RetrievalResult] = Field(default_factory=list, description="Supporting case material")
    legal_sources: List[CitationSource] = Field(default_factory=list, description="Supporting legal authorities")
    confidence: float = Field(default=0.8, ge=0.0, le=1.0, description="Confidence in answer")
    action_required: bool = Field(default=False, description="Whether user confirmation is needed")
    proposed_edits: Optional[List[RedlineOperation]] = Field(default=None, description="Proposed edits if applicable")
    explanation: str = Field(..., description="Explanation of answer")
    requires_confirmation: bool = Field(default=False, description="Whether confirmation needed for edits")
    follow_up_suggestions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


# Forward references resolution
CaseWorkspaceCreateRequest.model_rebuild()
CaseWorkspaceResponse.model_rebuild()
CaseDocumentUploadRequest.model_rebuild()
CaseDocumentUploadResponse.model_rebuild()
CaseBriefRequest.model_rebuild()
CaseBriefResponse.model_rebuild()
OppositionComparisonRequest.model_rebuild()
OppositionComparisonResponse.model_rebuild()
LegalResearchRequest.model_rebuild()
LegalResearchResponse.model_rebuild()
ArgumentBuilderRequest.model_rebuild()
ArgumentBuilderResponse.model_rebuild()
ScrutinyChecklistRequest.model_rebuild()
ScrutinyChecklistResponse.model_rebuild()
CitationVerificationCaseRequest.model_rebuild()
CitationVerificationCaseResponse.model_rebuild()
CaseAssistantRequest.model_rebuild()
CaseAssistantResponse.model_rebuild()