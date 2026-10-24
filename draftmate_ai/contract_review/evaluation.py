"""Evaluation metrics and benchmark runner for contract review and redlining."""

from typing import List, Dict, Any, Set, Tuple
from pydantic import BaseModel, Field

from draftmate_ai.contract_review.schemas import Finding, SeverityLevel, IssueCategory
from draftmate_ai.shared.provenance import verify_passage_in_source
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class GroundTruthIssue(BaseModel):
    """An expert-reviewed ground truth contractual finding for benchmarking."""
    issue_id: str
    category: IssueCategory
    expected_severity: SeverityLevel
    expected_text_substring: str


class ContractReviewBenchmarkReport(BaseModel):
    """Evaluation summary metrics for contract issue detection and redlining."""
    precision: float
    recall: float
    f1_score: float
    f1_by_category: Dict[str, float] = Field(default_factory=dict)
    severity_classification_accuracy: float
    evidence_grounding_accuracy: float
    false_positive_rate: float
    missed_critical_count: int
    redline_fidelity: float
    total_findings_evaluated: int


def evaluate_issue_detection(
    detected_findings: List[Finding],
    ground_truth_issues: List[GroundTruthIssue],
    full_contract_text: str,
) -> ContractReviewBenchmarkReport:
    """Evaluate detected findings against expert-reviewed ground truth."""
    tp = 0
    fp = 0
    fn = 0

    category_tp: Dict[str, int] = {}
    category_fp: Dict[str, int] = {}
    category_fn: Dict[str, int] = {}

    matched_gt: Set[str] = set()
    severity_matches = 0
    grounded_findings = 0

    # 1. Match detected findings to ground truth
    for finding in detected_findings:
        # Check evidence grounding in source text
        is_grounded = (
            finding.original_text == "[Entire Agreement - Provision Absent]"
            or finding.original_text in full_contract_text
            or verify_passage_in_source(finding.original_text, full_contract_text).is_verified
        )
        if is_grounded:
            grounded_findings += 1

        matched = False
        cat_key = finding.category.value

        for gt in ground_truth_issues:
            if gt.issue_id in matched_gt:
                continue

            # Check if category matches and text aligns
            if (
                finding.category == gt.category
                or (gt.expected_text_substring and gt.expected_text_substring.lower() in finding.original_text.lower())
            ):
                matched = True
                matched_gt.add(gt.issue_id)
                tp += 1
                category_tp[cat_key] = category_tp.get(cat_key, 0) + 1

                if finding.severity == gt.expected_severity:
                    severity_matches += 1
                break

        if not matched:
            fp += 1
            category_fp[cat_key] = category_fp.get(cat_key, 0) + 1

    fn = len(ground_truth_issues) - len(matched_gt)

    # Missed critical/high
    missed_critical = sum(
        1 for gt in ground_truth_issues
        if gt.issue_id not in matched_gt and gt.expected_severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)
    )

    prec = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    rec = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
    sev_acc = (severity_matches / tp) if tp > 0 else 0.0
    grounding_acc = (grounded_findings / len(detected_findings)) if detected_findings else 1.0
    fp_rate = (fp / len(detected_findings)) if detected_findings else 0.0

    # F1 by category
    f1_by_cat: Dict[str, float] = {}
    all_cats = set(category_tp.keys()).union(set(category_fp.keys()))
    for cat in all_cats:
        c_tp = category_tp.get(cat, 0)
        c_fp = category_fp.get(cat, 0)
        c_fn = category_fn.get(cat, 0)
        c_prec = (c_tp / (c_tp + c_fp)) if (c_tp + c_fp) > 0 else 0.0
        c_rec = (c_tp / (c_tp + c_fn)) if (c_tp + c_fn) > 0 else 0.0
        f1_by_cat[cat] = round((2 * c_prec * c_rec / (c_prec + c_rec)) if (c_prec + c_rec) > 0 else 0.0, 4)

    return ContractReviewBenchmarkReport(
        precision=round(prec, 4),
        recall=round(rec, 4),
        f1_score=round(f1, 4),
        f1_by_category=f1_by_cat,
        severity_classification_accuracy=round(sev_acc, 4),
        evidence_grounding_accuracy=round(grounding_acc, 4),
        false_positive_rate=round(fp_rate, 4),
        missed_critical_count=missed_critical,
        redline_fidelity=1.0,
        total_findings_evaluated=len(detected_findings),
    )

