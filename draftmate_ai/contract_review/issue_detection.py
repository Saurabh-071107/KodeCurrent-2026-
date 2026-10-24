"""Hybrid contract issue detection engine combining deterministic rules and legal NLP."""

import re
import uuid
from typing import List, Dict, Tuple, Set, Optional

from draftmate_ai.shared.document_models import ProcessedDocument
from draftmate_ai.contract_review.schemas import (
    Finding,
    IssueCategory,
    SeverityLevel,
    ClauseLocation,
    ReviewPosture,
    ContractReviewReport,
)
from draftmate_ai.contract_review.clause_extraction import ClauseExtractor, ClauseHierarchy, ContractClause
from draftmate_ai.contract_review.entity_extraction import EntityExtractor, ContractMetadataUnderstanding
from draftmate_ai.contract_review.obligation_extraction import ObligationExtractor
from draftmate_ai.contract_review.risk_analysis import RiskAnalyzer, AMBIGUOUS_PHRASES
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Blank placeholder patterns (e.g. [_______], [INSERT DATE], [●])
PLACEHOLDER_RE = re.compile(
    r"(\[\s*_{2,}\s*\]|\[\s*INSERT\s+[A-Za-z0-9\s]+\s*\]|\[\s*TBD\s*\]|\[\s*●\s*\])",
    re.IGNORECASE,
)


class ContractIssueDetector:
    """Detects drafting flaws, consistency errors, missing provisions, and contractual risks."""

    def __init__(self, posture: ReviewPosture = ReviewPosture.NEUTRAL):
        self.posture = posture
        self.clause_extractor = ClauseExtractor()
        self.entity_extractor = EntityExtractor()
        self.obligation_extractor = ObligationExtractor()
        self.risk_analyzer = RiskAnalyzer(posture=posture)

    def detect_drafting_issues(
        self,
        document: ProcessedDocument,
        hierarchy: ClauseHierarchy,
        understanding: ContractMetadataUnderstanding,
    ) -> List[Finding]:
        """Detect ambiguous phrasing, broken cross-references, undefined terms, and unfilled placeholders."""
        findings: List[Finding] = []

        # 1. Broken Cross References
        for source_num, target_ref in hierarchy.broken_cross_references:
            # Find the clause
            c_obj = hierarchy.clause_index_by_number.get(source_num.lower())
            orig_text = c_obj.raw_text if c_obj else f"Clause {source_num}"
            loc = c_obj.location if c_obj else ClauseLocation()

            findings.append(
                Finding(
                    finding_id=f"draft_broken_xref_{uuid.uuid4().hex[:6]}",
                    category=IssueCategory.BROKEN_CROSS_REFERENCE,
                    severity=SeverityLevel.HIGH,
                    title=f"Broken Cross-Reference: {target_ref}",
                    explanation=f"Clause references '{target_ref}', but no matching section or clause exists in the contract.",
                    original_text=orig_text,
                    location=loc,
                    risk_if_unaddressed="Creates legal ambiguity and renders conditional rights or remedies unenforceable.",
                    suggested_revision=orig_text.replace(target_ref, "[CORRECT SECTION REFERENCE]"),
                    rationale=f"Update reference to reflect the accurate clause number corresponding to {target_ref}.",
                )
            )

        # 2. Ambiguous Wording
        for c in hierarchy.clauses:
            text_lower = c.normalized_text.lower()
            for phrase, explanation in AMBIGUOUS_PHRASES:
                if phrase in text_lower:
                    findings.append(
                        Finding(
                            finding_id=f"draft_ambiguous_{uuid.uuid4().hex[:6]}",
                            category=IssueCategory.AMBIGUOUS_WORDING,
                            severity=SeverityLevel.MEDIUM,
                            title=f"Ambiguous Term: '{phrase}'",
                            explanation=explanation,
                            original_text=c.raw_text,
                            location=c.location,
                            risk_if_unaddressed="Increases litigation and interpretation risk due to lack of objective performance criteria.",
                            suggested_revision=c.raw_text.replace(phrase, "commercially reasonable efforts"),
                            rationale="Replaces ambiguous standard with objective, recognized commercial threshold.",
                        )
                    )

        # 3. Unfilled Placeholders / Missing Information
        for el in document.elements:
            m = PLACEHOLDER_RE.search(el.normalized_text)
            if m:
                findings.append(
                    Finding(
                        finding_id=f"draft_placeholder_{uuid.uuid4().hex[:6]}",
                        category=IssueCategory.MISSING_INFORMATION,
                        severity=SeverityLevel.HIGH,
                        title=f"Unfilled Placeholder: {m.group(0)}",
                        explanation="The contract contains an unpopulated bracketed placeholder or template marker.",
                        original_text=el.original_text,
                        location=ClauseLocation(
                            page=el.page_number,
                            section=el.section_heading,
                            clause_id=el.element_id,
                            paragraph_number=el.paragraph_number,
                        ),
                        risk_if_unaddressed="Contract may be deemed incomplete, vague, or lack mutual assent on material terms.",
                        suggested_revision="Fill in the substantive party name, date, or amount prior to execution.",
                        rationale="Ensures contract terms are fully finalized.",
                    )
                )

        # 4. Undefined Capitalized Terms
        undefined_terms = self.entity_extractor.find_undefined_capitalized_terms(
            document, understanding.defined_terms
        )
        for term, excerpt, page_num in undefined_terms[:5]:  # Top 5 most prominent
            findings.append(
                Finding(
                    finding_id=f"draft_undefined_{uuid.uuid4().hex[:6]}",
                    category=IssueCategory.UNDEFINED_TERMS,
                    severity=SeverityLevel.LOW,
                    title=f"Undefined Capitalized Term: '{term}'",
                    explanation=f"The capitalized term '{term}' appears in the text but is not defined in Section 1 or in-line.",
                    original_text=excerpt,
                    location=ClauseLocation(page=page_num),
                    risk_if_unaddressed="Ambiguity regarding whether the term has a specialized legal meaning or ordinary dictionary meaning.",
                    suggested_revision=f"Add an explicit definition for '{term}' to Article 1 (Definitions).",
                    rationale="Clarifies precise contractual scope of capitalized term.",
                )
            )

        return findings

    def detect_inconsistent_parties(
        self,
        document: ProcessedDocument,
        understanding: ContractMetadataUnderstanding,
    ) -> List[Finding]:
        """Detect inconsistent entity designations across the contract text."""
        findings = []
        if len(understanding.parties) < 2:
            return findings

        full_text = document.raw_text
        for p in understanding.parties:
            base_name = p.canonical_name.split()[0]  # First word, e.g. "Alpha"
            # Find occurrences of variation
            variations = set(re.findall(rf"\b{base_name}\s+[A-Za-z0-9\.\,]+", full_text))
            if len(variations) > 1:
                findings.append(
                    Finding(
                        finding_id=f"draft_inconsistent_party_{uuid.uuid4().hex[:6]}",
                        category=IssueCategory.INCONSISTENT_PARTIES,
                        severity=SeverityLevel.MEDIUM,
                        title=f"Inconsistent Party Name References: {p.canonical_name}",
                        explanation=f"Party is referred to inconsistently across sections as: {', '.join(variations)}.",
                        original_text=p.raw_name,
                        location=ClauseLocation(page=1),
                        risk_if_unaddressed="Creates corporate identity confusion and potential enforcement disputes against the corporate entity.",
                        suggested_revision=f"Standardize all references throughout agreement to '{p.canonical_name}'.",
                        rationale="Ensures unified entity naming across all clauses and signature blocks.",
                    )
                )

        return findings

    def analyze_all_issues(self, document: ProcessedDocument) -> Tuple[ClauseHierarchy, ContractMetadataUnderstanding, List[Finding]]:
        """Run complete analysis pipeline on a document and return hierarchy, understanding, and all findings."""
        hierarchy = self.clause_extractor.extract_clauses(document)
        understanding = self.entity_extractor.extract_metadata_understanding(document)

        all_findings: List[Finding] = []

        # 1. Drafting issues
        all_findings.extend(self.detect_drafting_issues(document, hierarchy, understanding))

        # 2. Inconsistent parties
        all_findings.extend(self.detect_inconsistent_parties(document, understanding))

        # 3. Substantive contractual risk
        all_findings.extend(self.risk_analyzer.evaluate_liability_risk(hierarchy.clauses))
        all_findings.extend(self.risk_analyzer.evaluate_indemnification_risk(hierarchy.clauses))
        all_findings.extend(self.risk_analyzer.evaluate_termination_risk(hierarchy.clauses))

        # 4. Missing mandatory provisions
        all_findings.extend(self.risk_analyzer.check_missing_provisions(hierarchy, understanding))

        return hierarchy, understanding, all_findings

    def review_contract(self, document: ProcessedDocument) -> ContractReviewReport:
        """Run complete contract review and return a typed ContractReviewReport."""
        hierarchy, understanding, findings = self.analyze_all_issues(document)

        sev_counts: Dict[str, int] = {}
        for f in findings:
            sev_counts[f.severity.value] = sev_counts.get(f.severity.value, 0) + 1

        cat_counts: Dict[str, int] = {}
        for f in findings:
            cat_counts[f.category.value] = cat_counts.get(f.category.value, 0) + 1

        doc_name = document.metadata.filename or "Contract"
        summary = (
            f"Reviewed {understanding.contract_type} ('{doc_name}'): "
            f"Identified {len(findings)} potential issues across {len(cat_counts)} categories."
        )

        return ContractReviewReport(
            document_id=document.document_id,
            document_name=doc_name,
            review_posture=self.posture,
            contract_understanding=understanding,
            findings=findings,
            severity_counts=sev_counts,
            category_counts=cat_counts,
            summary=summary,
        )

