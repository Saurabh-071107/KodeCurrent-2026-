"""Citation verification coordinator: multi-dimensional validation and status classification."""

from typing import List, Optional, Dict, Any

from draftmate_ai.citation_verification.schemas import (
    ExtractedCitation,
    NormalizedCitation,
    AuthorityRecord,
    VerificationResult,
    VerificationStatus,
    ExistenceStatus,
    MetadataAccuracyStatus,
    PropositionSupportStatus,
    PinpointAccuracyStatus,
    LegalCurrencyStatus,
    DocumentCitationReport,
)
from draftmate_ai.citation_verification.normalization import normalize_citation
from draftmate_ai.citation_verification.source_adapters import (
    BaseLegalSourceAdapter,
    CompositeLegalSourceAdapter,
)
from draftmate_ai.citation_verification.metadata_verification import MetadataVerifier
from draftmate_ai.citation_verification.proposition_support import PropositionSupportVerifier
from draftmate_ai.citation_verification.pinpoint_verification import PinpointVerifier
from draftmate_ai.citation_verification.currency_checks import CurrencyChecker
from draftmate_ai.citation_verification.extraction import CitationExtractor
from draftmate_ai.shared.document_models import ProcessedDocument
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class CitationVerificationEngine:
    """Coordinates multi-dimensional legal citation verification across 5 independent axes."""

    def __init__(self, source_adapter: Optional[BaseLegalSourceAdapter] = None):
        self.source_adapter = source_adapter or CompositeLegalSourceAdapter()
        self.metadata_verifier = MetadataVerifier()
        self.proposition_verifier = PropositionSupportVerifier()
        self.pinpoint_verifier = PinpointVerifier()
        self.currency_checker = CurrencyChecker()
        self.extractor = CitationExtractor()

    def verify_citation(self, extracted: ExtractedCitation) -> VerificationResult:
        """Verify an individual extracted citation across all five dimensions.

        1. Existence
        2. Metadata Accuracy
        3. Proposition Support
        4. Pinpoint Accuracy
        5. Legal Currency
        """
        limitations: List[str] = self.source_adapter.report_limitations()
        normalized: NormalizedCitation = normalize_citation(extracted)

        # Dimension 1: Existence Retrieval
        authority: Optional[AuthorityRecord] = None
        existence = ExistenceStatus.NOT_FOUND

        # 1a. Try lookup by canonical citation
        authority = self.source_adapter.get_authority_by_citation(normalized)
        # 1b. Try lookup by case name if not found by citation
        if authority is None and normalized.canonical_case_name:
            authority = self.source_adapter.get_authority_by_name(normalized.canonical_case_name)

        if authority is not None:
            existence = ExistenceStatus.FOUND
        else:
            existence = ExistenceStatus.NOT_FOUND

        # Dimension 2: Metadata Accuracy
        meta_status, meta_exp, discrepancies = self.metadata_verifier.verify_metadata(
            extracted=extracted,
            normalized=normalized,
            authority=authority,
        )

        # Dimension 3: Proposition Support
        prop_status, prop_excerpts, prop_exp = self.proposition_verifier.verify_proposition(
            proposition=extracted.associated_proposition,
            authority=authority,
        )

        # Dimension 4: Pinpoint Accuracy
        pin_status, pin_exp, pin_excerpt = self.pinpoint_verifier.verify_pinpoint(
            extracted=extracted,
            authority=authority,
        )
        if pin_excerpt and pin_excerpt not in prop_excerpts:
            prop_excerpts.append(f"[{extracted.pinpoint}] {pin_excerpt}")

        # Dimension 5: Legal Currency
        curr_status, curr_exp, curr_limits = self.currency_checker.check_currency(
            normalized=normalized,
            authority=authority,
        )
        limitations.extend(curr_limits)

        # Synthesize Overall Status according to deterministic rules
        overall_status = self._classify_overall_status(
            existence=existence,
            metadata=meta_status,
            proposition=prop_status,
            pinpoint=pin_status,
            currency=curr_status,
        )

        # Build comprehensive narrative explanation
        narrative_parts = []
        narrative_parts.append(f"Overall Status: {overall_status.value}.")
        if existence == ExistenceStatus.FOUND and authority:
            narrative_parts.append(f"Identified Authority: '{authority.canonical_name}' ({authority.source_identifier}).")
        else:
            narrative_parts.append("Authority existence could not be confirmed in accessible sources (missing search result is not proof of fabrication).")

        narrative_parts.append(f"Metadata: {meta_exp}")
        narrative_parts.append(f"Proposition: {prop_exp}")
        if extracted.pinpoint:
            narrative_parts.append(f"Pinpoint: {pin_exp}")
        narrative_parts.append(f"Currency: {curr_exp}")

        provenance = {
            "source_identifier": authority.source_identifier if authority else None,
            "raw_citation": extracted.raw_citation,
            "document_id": extracted.document_id,
            "page_number": extracted.page_number,
            "element_id": extracted.clause_or_element_id,
        }

        return VerificationResult(
            citation_id=extracted.citation_id,
            raw_citation=extracted.raw_citation,
            normalized_citation=normalized.canonical_citation,
            overall_status=overall_status,
            existence=existence,
            metadata_accuracy=meta_status,
            proposition_support=prop_status,
            pinpoint_accuracy=pin_status,
            legal_currency=curr_status,
            matched_authority_id=authority.authority_id if authority else None,
            matched_authority_title=authority.canonical_name if authority else None,
            supporting_excerpts=prop_excerpts,
            explanation=" ".join(narrative_parts),
            currency_notes=curr_exp,
            limitations_disclosed=list(dict.fromkeys(limitations)),
            provenance_record=provenance,
        )

    def _classify_overall_status(
        self,
        existence: ExistenceStatus,
        metadata: MetadataAccuracyStatus,
        proposition: PropositionSupportStatus,
        pinpoint: PinpointAccuracyStatus,
        currency: LegalCurrencyStatus,
    ) -> VerificationStatus:
        """Apply deterministic, rule-based classification across dimensions."""
        # 1. Conflicting: Contradicted proposition or Overruled precedent
        if proposition == PropositionSupportStatus.CONTRADICTED or currency == LegalCurrencyStatus.OVERRULED:
            return VerificationStatus.CONFLICTING

        # 2. Unverified: Authority not found, metadata mismatch, or unsupported proposition
        if existence != ExistenceStatus.FOUND:
            return VerificationStatus.UNVERIFIED

        if metadata == MetadataAccuracyStatus.MISMATCH:
            return VerificationStatus.UNVERIFIED

        if proposition == PropositionSupportStatus.UNSUPPORTED:
            return VerificationStatus.UNVERIFIED

        # 3. Verified: All 5 dimensions positive
        if (
            existence == ExistenceStatus.FOUND
            and metadata == MetadataAccuracyStatus.MATCH
            and proposition == PropositionSupportStatus.SUPPORTED
            and pinpoint in (PinpointAccuracyStatus.VERIFIED, PinpointAccuracyStatus.NOT_SPECIFIED)
            and currency == LegalCurrencyStatus.GOOD_LAW
        ):
            return VerificationStatus.VERIFIED

        # 4. Partially Verified: Minor divergence in metadata, pinpoint, or partial support
        return VerificationStatus.PARTIALLY_VERIFIED

    def verify_document_citations(self, document: ProcessedDocument) -> DocumentCitationReport:
        """Extract and verify all citations from a ProcessedDocument."""
        extracted_list = self.extractor.extract_from_document(document)
        results: List[VerificationResult] = []

        v_count = 0
        pv_count = 0
        uv_count = 0
        cf_count = 0
        su_count = 0

        for cit in extracted_list:
            res = self.verify_citation(cit)
            results.append(res)
            if res.overall_status == VerificationStatus.VERIFIED:
                v_count += 1
            elif res.overall_status == VerificationStatus.PARTIALLY_VERIFIED:
                pv_count += 1
            elif res.overall_status == VerificationStatus.UNVERIFIED:
                uv_count += 1
            elif res.overall_status == VerificationStatus.CONFLICTING:
                cf_count += 1
            elif res.overall_status == VerificationStatus.SOURCE_UNAVAILABLE:
                su_count += 1

        return DocumentCitationReport(
            document_id=document.document_id,
            total_citations=len(results),
            verified_count=v_count,
            partially_verified_count=pv_count,
            unverified_count=uv_count,
            conflicting_count=cf_count,
            source_unavailable_count=su_count,
            results=results,
        )

