"""Contract review and redlining module."""

from draftmate_ai.contract_review.schemas import (
    SeverityLevel,
    IssueCategory,
    ReviewPosture,
    ClauseLocation,
    Finding,
    RedlineChange,
    ChangeType,
    ReviewStatus,
    ContractReviewReport,
    ExtractedParty,
    ExtractedDefinedTerm,
    ExtractedObligation,
    ContractMetadataUnderstanding,
)
from draftmate_ai.contract_review.clause_extraction import (
    ClauseExtractor,
    ClauseHierarchy,
    ContractClause,
    classify_clause_taxonomy,
    detect_contract_title_and_type,
)
from draftmate_ai.contract_review.entity_extraction import EntityExtractor
from draftmate_ai.contract_review.obligation_extraction import ObligationExtractor
from draftmate_ai.contract_review.risk_analysis import RiskAnalyzer, AMBIGUOUS_PHRASES
from draftmate_ai.contract_review.issue_detection import ContractIssueDetector
from draftmate_ai.contract_review.recommendations import RecommendationEngine, RevisionOption
from draftmate_ai.contract_review.redlining import RedlineEngine, compute_text_diff_operations
from draftmate_ai.contract_review.cross_clause_analysis import ConsistencyChecker
from draftmate_ai.contract_review.evaluation import (
    evaluate_issue_detection,
    GroundTruthIssue,
    ContractReviewBenchmarkReport,
)

__all__ = [
    "SeverityLevel",
    "IssueCategory",
    "ReviewPosture",
    "ClauseLocation",
    "Finding",
    "RedlineChange",
    "ChangeType",
    "ReviewStatus",
    "ContractReviewReport",
    "ExtractedParty",
    "ExtractedDefinedTerm",
    "ExtractedObligation",
    "ContractMetadataUnderstanding",
    "ClauseExtractor",
    "ClauseHierarchy",
    "ContractClause",
    "classify_clause_taxonomy",
    "detect_contract_title_and_type",
    "EntityExtractor",
    "ObligationExtractor",
    "RiskAnalyzer",
    "AMBIGUOUS_PHRASES",
    "ContractIssueDetector",
    "RecommendationEngine",
    "RevisionOption",
    "RedlineEngine",
    "compute_text_diff_operations",
    "ConsistencyChecker",
    "evaluate_issue_detection",
    "GroundTruthIssue",
    "ContractReviewBenchmarkReport",
]

