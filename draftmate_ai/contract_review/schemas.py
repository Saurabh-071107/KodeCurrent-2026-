"""Strongly-typed Pydantic schemas for contract review, issue detection, and redlining."""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    """Standardized severity classification levels."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class IssueCategory(str, Enum):
    """Categorization of detected contractual issues."""
    # Drafting and consistency
    AMBIGUOUS_WORDING = "Ambiguous Wording"
    INCONSISTENT_PARTIES = "Inconsistent Parties"
    CONFLICTING_TERMS = "Conflicting Terms"
    UNDEFINED_TERMS = "Undefined Terms"
    BROKEN_CROSS_REFERENCE = "Broken Cross-Reference"
    CONTRADICTORY_CLAUSES = "Contradictory Clauses"
    DUPLICATE_OBLIGATION = "Duplicate Obligation"
    MISSING_INFORMATION = "Missing Information"

    # Contractual risk
    TERMINATION_RENEWAL = "Termination and Renewal"
    PAYMENT_TERMS = "Payment Terms"
    LIABILITY_LIMITATIONS = "Liability Limitations"
    INDEMNIFICATION = "Indemnification"
    CONFIDENTIALITY = "Confidentiality"
    DATA_PROTECTION = "Data Protection"
    INTELLECTUAL_PROPERTY = "Intellectual Property"
    WARRANTIES_REPRESENTATIONS = "Warranties and Representations"
    DISPUTE_RESOLUTION = "Dispute Resolution"
    GOVERNING_LAW = "Governing Law"
    FORCE_MAJEURE = "Force Majeure"
    ASSIGNMENT = "Assignment"
    NOTICE_REQUIREMENTS = "Notice Requirements"

    # Structural issues
    MISSING_PROVISION = "Missing Provision"
    UNCLEAR_RESPONSIBILITY = "Unclear Responsibility"
    UNBALANCED_OBLIGATION = "Unbalanced Obligation"
    UNRESOLVED_DEPENDENCY = "Unresolved Dependency"


class ReviewPosture(str, Enum):
    """Review orientation/policy for risk assessment."""
    BUYER_FRIENDLY = "BUYER_FRIENDLY"
    SELLER_FRIENDLY = "SELLER_FRIENDLY"
    NEUTRAL = "NEUTRAL"
    STRICT_COMPLIANCE = "STRICT_COMPLIANCE"


class ClauseLocation(BaseModel):
    """Location reference of a clause inside the source contract."""
    page: Optional[int] = Field(default=None, description="Page number if available.")
    section: Optional[str] = Field(default=None, description="Section heading context.")
    clause_id: Optional[str] = Field(default=None, description="Identifier of the clause element.")
    paragraph_number: Optional[int] = Field(default=None, description="Paragraph index.")


class ExtractedParty(BaseModel):
    """Party identified in the contract preamble or signature block."""
    raw_name: str
    canonical_name: str
    role_or_alias: Optional[str] = None  # e.g., "Disclosing Party", "Buyer", "Contractor"
    entity_type: Optional[str] = None  # e.g., "Corporation", "LLC", "Individual"
    jurisdiction: Optional[str] = None
    location_text: Optional[str] = None


class ExtractedDefinedTerm(BaseModel):
    """A term defined within the contract."""
    term: str
    definition: str
    clause_number: Optional[str] = None
    page: Optional[int] = None
    is_used_in_body: bool = True


class ExtractedObligation(BaseModel):
    """An obligation or negative covenant identified in contract text."""
    obligation_id: str
    clause_number: Optional[str] = None
    obligor: str  # Who must perform
    action: str   # What must be done
    modality: str  # "shall", "must", "will", "shall not"
    is_conditional: bool = False
    condition_text: Optional[str] = None
    original_text: str


class ContractMetadataUnderstanding(BaseModel):
    """High-level semantic understanding extracted from the contract."""
    contract_title: Optional[str] = None
    contract_type: str = "General Contract"
    governing_law: Optional[str] = None
    effective_date: Optional[str] = None
    termination_date: Optional[str] = None
    parties: List[ExtractedParty] = Field(default_factory=list)
    defined_terms: Dict[str, ExtractedDefinedTerm] = Field(default_factory=dict)
    key_dates: List[str] = Field(default_factory=list)
    monetary_values: List[str] = Field(default_factory=list)
    notice_periods: List[str] = Field(default_factory=list)
    signature_blocks_found: bool = False


class Finding(BaseModel):
    """A structured, evidence-grounded issue finding."""
    finding_id: str = Field(description="Unique identifier for the finding.")
    category: IssueCategory = Field(description="Issue category.")
    severity: SeverityLevel = Field(description="Severity classification.")
    title: str = Field(description="Concise description of the finding.")
    explanation: str = Field(description="Detailed evidence-grounded analysis.")
    original_text: str = Field(description="Verbatim excerpt from the contract serving as evidence.")
    location: ClauseLocation = Field(default_factory=ClauseLocation, description="Location in contract.")
    related_clauses: List[str] = Field(default_factory=list, description="Related clause identifiers or numbers.")
    risk_if_unaddressed: str = Field(description="Potential legal or business consequence if unaddressed.")
    suggested_revision: Optional[str] = Field(default=None, description="Concrete alternative wording proposed.")
    rationale: Optional[str] = Field(default=None, description="Explanation for the proposed revision.")
    assumptions: List[str] = Field(default_factory=list, description="Assumptions made in identifying this finding.")
    limitations: List[str] = Field(default_factory=list, description="Jurisdictional caveats or needed user context.")


class ChangeType(str, Enum):
    """Type of text edit represented in a redline."""
    INSERTION = "INSERTION"
    DELETION = "DELETION"
    REPLACEMENT = "REPLACEMENT"
    EQUAL = "EQUAL"


class ReviewStatus(str, Enum):
    """Status of a proposed redline revision."""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class RedlineChange(BaseModel):
    """Discrete atomic change in the contract redline diff."""
    change_id: str
    finding_id: Optional[str] = None
    clause_number: Optional[str] = None
    change_type: ChangeType
    original_text: str
    proposed_text: str
    status: ReviewStatus = ReviewStatus.PENDING
    start_char_idx: Optional[int] = None
    end_char_idx: Optional[int] = None
    rationale: Optional[str] = None


class ContractReviewReport(BaseModel):
    """Complete report produced by the contract review pipeline."""
    document_id: str
    document_name: str
    review_posture: ReviewPosture
    contract_understanding: ContractMetadataUnderstanding
    findings: List[Finding] = Field(default_factory=list)
    redline_changes: List[RedlineChange] = Field(default_factory=list)
    severity_counts: Dict[str, int] = Field(default_factory=dict)
    category_counts: Dict[str, int] = Field(default_factory=dict)
    summary: str = ""

    @property
    def contract_type(self) -> str:
        """Convenience property for contract_type."""
        return self.contract_understanding.contract_type

