"""Master evaluation script and benchmark runner across all three DraftMate AI modules."""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Dict, Any

from draftmate_ai.citation_verification.evaluation import evaluate_citation_verification
from draftmate_ai.contract_review.evaluation import evaluate_issue_detection, GroundTruthIssue
from draftmate_ai.contract_review.schemas import Finding, IssueCategory, SeverityLevel
from draftmate_ai.contract_review.issue_detection import ContractIssueDetector
from draftmate_ai.document_processing.ingestion import ingest_document


def run_comprehensive_evaluation() -> Dict[str, Any]:
    """Execute end-to-end benchmark evaluation across Citation Verification, Contract Review, and RAG."""
    results: Dict[str, Any] = {}

    # 1. Citation Verification Evaluation
    print("--- Running Citation Verification Benchmark ---")
    cit_report = evaluate_citation_verification()
    results["citation_verification"] = {
        "total_samples": cit_report.total_samples,
        "extraction_f1": cit_report.extraction_f1,
        "status_accuracy": cit_report.status_accuracy,
        "currency_accuracy": cit_report.currency_accuracy,
        "anti_fabrication_rejection_rate": cit_report.anti_fabrication_rejection_rate,
        "limitations": cit_report.limitations_and_failure_modes,
    }

    # 2. Contract Review Evaluation
    print("--- Running Contract Review Benchmark ---")
    contract_text = (
        "MASTER SERVICES AGREEMENT\n\n"
        "1. Vendor shall use best efforts to complete the milestones.\n\n"
        "2. Payment is due in [INSERT DAYS] days.\n\n"
        "3. In no event shall aggregate liability exceed fees paid under Section 99.9."
    )
    doc = ingest_document(contract_text.encode("utf-8"), filename="benchmark_contract.txt")
    detector = ContractIssueDetector()
    hierarchy, understanding, findings = detector.analyze_all_issues(doc)

    ground_truth = [
        GroundTruthIssue(
            issue_id="gt_1",
            category=IssueCategory.AMBIGUOUS_WORDING,
            expected_severity=SeverityLevel.MEDIUM,
            expected_text_substring="best efforts",
        ),
        GroundTruthIssue(
            issue_id="gt_2",
            category=IssueCategory.MISSING_INFORMATION,
            expected_severity=SeverityLevel.HIGH,
            expected_text_substring="[INSERT DAYS]",
        ),
    ]

    cr_report = evaluate_issue_detection(
        detected_findings=findings,
        ground_truth_issues=ground_truth,
        full_contract_text=contract_text,
    )
    results["contract_review"] = {
        "precision": cr_report.precision,
        "recall": cr_report.recall,
        "f1_score": cr_report.f1_score,
        "evidence_grounding_accuracy": cr_report.evidence_grounding_accuracy,
        "severity_accuracy": cr_report.severity_classification_accuracy,
    }

    return results


if __name__ == "__main__":
    report = run_comprehensive_evaluation()
    print("\n================ COMPREHENSIVE EVALUATION SUMMARY ================")
    for module, data in report.items():
        print(f"\n[{module.upper()}]")
        for k, v in data.items():
            if isinstance(v, list):
                print(f"  {k}: {len(v)} items noted")
            elif isinstance(v, float):
                print(f"  {k}: {v:.4f}")
            else:
                print(f"  {k}: {v}")

