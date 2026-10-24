"""Evaluation suite and benchmarking metrics for citation verification."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from draftmate_ai.citation_verification.schemas import (
    VerificationStatus,
    PropositionSupportStatus,
    LegalCurrencyStatus,
    ExtractedCitation,
)
from draftmate_ai.citation_verification.verification import CitationVerificationEngine
from draftmate_ai.citation_verification.extraction import CitationExtractor


class CitationBenchmarkSample(BaseModel):
    """Ground truth benchmark item for citation verification evaluation."""
    sample_id: str
    text: str
    expected_case_name: Optional[str] = None
    expected_citation: Optional[str] = None
    expected_overall_status: VerificationStatus
    expected_currency: Optional[LegalCurrencyStatus] = None
    expected_proposition_status: Optional[PropositionSupportStatus] = None
    is_fabricated: bool = False


class CitationEvaluationReport(BaseModel):
    """Comprehensive evaluation report with metrics separated from limitations."""
    total_samples: int
    extraction_precision: float
    extraction_recall: float
    extraction_f1: float
    status_accuracy: float
    currency_accuracy: float
    anti_fabrication_rejection_rate: float
    evaluated_samples: List[Dict[str, Any]] = Field(default_factory=list)
    limitations_and_failure_modes: List[str] = Field(default_factory=list)


BENCHMARK_CITATION_DATASET: List[CitationBenchmarkSample] = [
    # 1. Authentic Good Law with Supported Proposition
    CitationBenchmarkSample(
        sample_id="bench_01_kesavananda_valid",
        text=(
            "The basic structure of the Constitution cannot be destroyed or abrogated by Parliament. "
            "See Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225, para 45."
        ),
        expected_case_name="Kesavananda Bharati v. State of Kerala",
        expected_citation="(1973) 4 SCC 225",
        expected_overall_status=VerificationStatus.VERIFIED,
        expected_currency=LegalCurrencyStatus.GOOD_LAW,
        expected_proposition_status=PropositionSupportStatus.SUPPORTED,
        is_fabricated=False,
    ),
    # 2. Overruled Precedent (Bad Law Warning)
    CitationBenchmarkSample(
        sample_id="bench_02_adm_jabalpur_overruled",
        text=(
            "During an emergency proclamation, citizens have no locus standi to seek habeas corpus relief. "
            "ADM Jabalpur v. Shivkant Shukla, (1976) 2 SCC 521."
        ),
        expected_case_name="ADM Jabalpur v. Shivkant Shukla",
        expected_citation="(1976) 2 SCC 521",
        expected_overall_status=VerificationStatus.CONFLICTING,
        expected_currency=LegalCurrencyStatus.OVERRULED,
        is_fabricated=False,
    ),
    # 3. Contradicted Proposition (Opposite of Judgment Holding)
    CitationBenchmarkSample(
        sample_id="bench_03_kesavananda_contradicted",
        text=(
            "In Kesavananda Bharati v. State of Kerala, AIR 1973 SC 1461, the Supreme Court held that Parliament "
            "possesses unlimited power to destroy the fundamental institutional pillars of the democratic republic."
        ),
        expected_case_name="Kesavananda Bharati v. State of Kerala",
        expected_citation="AIR 1973 SC 1461",
        expected_overall_status=VerificationStatus.CONFLICTING,
        expected_proposition_status=PropositionSupportStatus.CONTRADICTED,
        is_fabricated=False,
    ),
    # 4. Correct Metadata but Unsupported Proposition
    CitationBenchmarkSample(
        sample_id="bench_04_maneka_unsupported_prop",
        text=(
            "The Supreme Court ruled that software algorithms qualify for patent protection under Section 3(k). "
            "Maneka Gandhi v. Union of India, AIR 1978 SC 597."
        ),
        expected_case_name="Maneka Gandhi v. Union of India",
        expected_citation="AIR 1978 SC 597",
        expected_overall_status=VerificationStatus.UNVERIFIED,
        expected_proposition_status=PropositionSupportStatus.UNSUPPORTED,
        is_fabricated=False,
    ),
    # 5. Fabricated / Non-existent Case Law Citation
    CitationBenchmarkSample(
        sample_id="bench_05_fabricated_citation",
        text=(
            "The court held that commercial contracts expire automatically after five years. "
            "Nexus Horizon Corp. v. Quantum Systems Ltd., (2025) 99 SCC 9999."
        ),
        expected_case_name="Nexus Horizon Corp. v. Quantum Systems Ltd.",
        expected_citation="(2025) 99 SCC 9999",
        expected_overall_status=VerificationStatus.UNVERIFIED,
        is_fabricated=True,
    ),
    # 6. Valid Statutory Section
    CitationBenchmarkSample(
        sample_id="bench_06_arbitration_sec9",
        text=(
            "A party may apply to a court for interim measures before or during arbitral proceedings "
            "under Section 9 of the Arbitration and Conciliation Act, 1996."
        ),
        expected_case_name=None,
        expected_citation="Section 9 of the Arbitration and Conciliation Act, 1996",
        expected_overall_status=VerificationStatus.VERIFIED,
        is_fabricated=False,
    ),
]


def evaluate_citation_verification(
    engine: Optional[CitationVerificationEngine] = None,
    dataset: Optional[List[CitationBenchmarkSample]] = None,
) -> CitationEvaluationReport:
    """Evaluate extraction accuracy, verification status alignment, and anti-fabrication defense."""
    engine = engine or CitationVerificationEngine()
    dataset = dataset or BENCHMARK_CITATION_DATASET

    extractor = CitationExtractor()

    tp_extraction = 0
    fp_extraction = 0
    fn_extraction = 0

    correct_status_count = 0
    correct_currency_count = 0
    currency_eval_total = 0

    fabricated_total = 0
    fabricated_rejected = 0

    evaluated_details = []

    for sample in dataset:
        # 1. Extraction test
        extracted_list = extractor.extract_from_text(sample.text)

        if sample.expected_citation:
            if any(sample.expected_citation in c.raw_citation or c.raw_citation in sample.expected_citation for c in extracted_list):
                tp_extraction += 1
            else:
                fn_extraction += 1
        elif extracted_list:
            fp_extraction += len(extracted_list)

        # 2. Verification test
        sample_detail = {
            "sample_id": sample.sample_id,
            "extracted_count": len(extracted_list),
            "expected_status": sample.expected_overall_status.value,
        }

        if extracted_list:
            target_cit = extracted_list[0]
            res = engine.verify_citation(target_cit)
            sample_detail["predicted_status"] = res.overall_status.value
            sample_detail["existence"] = res.existence.value
            sample_detail["metadata_accuracy"] = res.metadata_accuracy.value
            sample_detail["proposition_support"] = res.proposition_support.value
            sample_detail["legal_currency"] = res.legal_currency.value

            if res.overall_status == sample.expected_overall_status:
                correct_status_count += 1

            if sample.expected_currency:
                currency_eval_total += 1
                if res.legal_currency == sample.expected_currency:
                    correct_currency_count += 1

            if sample.is_fabricated:
                fabricated_total += 1
                if res.overall_status in (VerificationStatus.UNVERIFIED, VerificationStatus.SOURCE_UNAVAILABLE):
                    fabricated_rejected += 1
        else:
            sample_detail["predicted_status"] = "EXTRACTION_FAILED"

        evaluated_details.append(sample_detail)

    # Compute precision, recall, F1
    precision = tp_extraction / max(tp_extraction + fp_extraction, 1)
    recall = tp_extraction / max(tp_extraction + fn_extraction, 1)
    f1 = 2 * precision * recall / max(precision + recall, 1e-6)

    status_acc = correct_status_count / max(len(dataset), 1)
    currency_acc = correct_currency_count / max(currency_eval_total, 1) if currency_eval_total > 0 else 1.0
    anti_fab_rate = fabricated_rejected / max(fabricated_total, 1) if fabricated_total > 0 else 1.0

    limitations = [
        "Unindexed local court or district level orders are not captured in the offline legal corpus.",
        "Neutral citation resolution for INSC is limited to post-2023 official digitizations unless archived in local corpus.",
        "External live endpoints (India Code, Supreme Court) operate in offline-safe mode under sandbox isolation.",
        "Proposition verification relies on textual evidence alignment; non-textual judicial subtext requires qualified advocate review.",
    ]

    return CitationEvaluationReport(
        total_samples=len(dataset),
        extraction_precision=round(precision, 4),
        extraction_recall=round(recall, 4),
        extraction_f1=round(f1, 4),
        status_accuracy=round(status_acc, 4),
        currency_accuracy=round(currency_acc, 4),
        anti_fabrication_rejection_rate=round(anti_fab_rate, 4),
        evaluated_samples=evaluated_details,
        limitations_and_failure_modes=limitations,
    )

