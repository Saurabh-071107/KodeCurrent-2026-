"""DraftMate AI — Citation Verification Module."""

from draftmate_ai.citation_verification.schemas import (
    VerificationStatus,
    ExistenceStatus,
    MetadataAccuracyStatus,
    PropositionSupportStatus,
    PinpointAccuracyStatus,
    LegalCurrencyStatus,
    CitationType,
    ExtractedCitation,
    NormalizedCitation,
    AuthorityRecord,
    VerificationResult,
    DocumentCitationReport,
)
from draftmate_ai.citation_verification.extraction import CitationExtractor
from draftmate_ai.citation_verification.normalization import (
    normalize_citation,
    normalize_case_title,
    normalize_reporter,
    normalize_court_name,
)
from draftmate_ai.citation_verification.source_adapters import (
    BaseLegalSourceAdapter,
    LocalCorpusSourceAdapter,
    IndiaCodeAdapter,
    SupremeCourtOfIndiaAdapter,
    CompositeLegalSourceAdapter,
)
from draftmate_ai.citation_verification.metadata_verification import MetadataVerifier
from draftmate_ai.citation_verification.pinpoint_verification import PinpointVerifier
from draftmate_ai.citation_verification.currency_checks import CurrencyChecker
from draftmate_ai.citation_verification.proposition_support import PropositionSupportVerifier
from draftmate_ai.citation_verification.verification import CitationVerificationEngine
from draftmate_ai.citation_verification.evaluation import (
    evaluate_citation_verification,
    CitationBenchmarkSample,
    CitationEvaluationReport,
    BENCHMARK_CITATION_DATASET,
)

__all__ = [
    "VerificationStatus",
    "ExistenceStatus",
    "MetadataAccuracyStatus",
    "PropositionSupportStatus",
    "PinpointAccuracyStatus",
    "LegalCurrencyStatus",
    "CitationType",
    "ExtractedCitation",
    "NormalizedCitation",
    "AuthorityRecord",
    "VerificationResult",
    "DocumentCitationReport",
    "CitationExtractor",
    "normalize_citation",
    "normalize_case_title",
    "normalize_reporter",
    "normalize_court_name",
    "BaseLegalSourceAdapter",
    "LocalCorpusSourceAdapter",
    "IndiaCodeAdapter",
    "SupremeCourtOfIndiaAdapter",
    "CompositeLegalSourceAdapter",
    "MetadataVerifier",
    "PinpointVerifier",
    "CurrencyChecker",
    "PropositionSupportVerifier",
    "CitationVerificationEngine",
    "evaluate_citation_verification",
    "CitationBenchmarkSample",
    "CitationEvaluationReport",
    "BENCHMARK_CITATION_DATASET",
]

