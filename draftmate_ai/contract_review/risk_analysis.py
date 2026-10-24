"""Contractual risk analysis rules, severity rubric, and risk pattern engines."""

import re
from typing import List, Dict, Optional, Tuple

from draftmate_ai.contract_review.schemas import (
    Finding,
    IssueCategory,
    SeverityLevel,
    ClauseLocation,
    ReviewPosture,
)
from draftmate_ai.contract_review.clause_extraction import ContractClause, ClauseHierarchy
from draftmate_ai.contract_review.entity_extraction import ContractMetadataUnderstanding

# Ambiguous subjective phrases that create legal disputes
AMBIGUOUS_PHRASES = [
    ("best efforts", "Ambiguous standard of performance. 'Best efforts' imposes an onerous, undefined burden exceeding customary commercial diligence."),
    ("reasonable efforts", "Subjective standard without objective performance criteria."),
    ("promptly", "Undefined temporal expectation creating uncertainty around default deadlines."),
    ("from time to time", "Unscheduled and unpredictable obligation timing."),
    ("as soon as possible", "Vague timeline lacking enforceable deadline days."),
    ("in its sole discretion", "Unilateral discretionary power unconstrained by good faith standards."),
    ("material adverse effect", "Undefined materiality threshold."),
    ("substantially all", "Ambiguous scope metric."),
]

# Essential boilerplate clauses by contract type
MANDATORY_CLAUSES_BY_TYPE = {
    "Non-Disclosure Agreement": [
        ("CONFIDENTIALITY", "Core confidentiality obligations"),
        ("TERMINATION", "Term and survival of confidentiality"),
        ("GOVERNING_LAW", "Governing law clause"),
    ],
    "Master Services Agreement": [
        ("PAYMENT_TERMS", "Invoicing and payment terms"),
        ("LIMITATION_OF_LIABILITY", "Limitation of liability and aggregate cap"),
        ("INDEMNIFICATION", "Third-party indemnification obligations"),
        ("TERMINATION", "Term, termination for cause/convenience"),
        ("GOVERNING_LAW", "Governing law and jurisdiction"),
        ("INTELLECTUAL_PROPERTY", "IP ownership and deliverables allocation"),
    ],
    "Commercial Lease Agreement": [
        ("PAYMENT_TERMS", "Rent payment and late fee terms"),
        ("TERMINATION", "Lease expiration and default remedies"),
        ("INDEMNIFICATION", "Premises liability and indemnification"),
    ],
    "General Contract": [
        ("GOVERNING_LAW", "Governing law clause"),
        ("TERMINATION", "Termination clause"),
    ],
}


class RiskAnalyzer:
    """Evaluates substantive contractual risks according to review posture and legal standards."""

    def __init__(self, posture: ReviewPosture = ReviewPosture.NEUTRAL):
        self.posture = posture

    def evaluate_liability_risk(self, clauses: List[ContractClause]) -> List[Finding]:
        """Assess limitation of liability, aggregate caps, and consequential damages disclaimers."""
        findings = []
        liability_clauses = [c for c in clauses if c.taxonomy_category == "LIMITATION_OF_LIABILITY"]

        if not liability_clauses:
            findings.append(
                Finding(
                    finding_id="risk_missing_liability_cap",
                    category=IssueCategory.LIABILITY_LIMITATIONS,
                    severity=SeverityLevel.CRITICAL if self.posture in (ReviewPosture.SELLER_FRIENDLY, ReviewPosture.STRICT_COMPLIANCE) else SeverityLevel.HIGH,
                    title="Missing Limitation of Liability Clause",
                    explanation="The contract contains no explicit limitation of liability or aggregate monetary cap. Under common law, parties face unlimited direct exposure.",
                    original_text="[Entire Agreement - Provision Absent]",
                    location=ClauseLocation(),
                    risk_if_unaddressed="Exposes the client to unlimited direct and consequential damages in event of breach.",
                    suggested_revision=(
                        "IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS "
                        "AGREEMENT EXCEED THE TOTAL FEES PAID OR PAYABLE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM."
                    ),
                    rationale="Institutes a standard 12-month trailing fee liability cap.",
                )
            )
        else:
            for c in liability_clauses:
                text_lower = c.normalized_text.lower()
                # Check for unilateral liability
                if "neither party" not in text_lower and ("vendor shall not" in text_lower or "contractor shall not" in text_lower or "tenant shall not" in text_lower):
                    if "unilateral" not in text_lower:
                        findings.append(
                            Finding(
                                finding_id=f"risk_unilateral_liability_{c.clause_id}",
                                category=IssueCategory.LIABILITY_LIMITATIONS,
                                severity=SeverityLevel.HIGH,
                                title="One-Sided Limitation of Liability",
                                explanation="The liability cap only protects one party rather than applying mutually to both parties.",
                                original_text=c.raw_text,
                                location=c.location,
                                risk_if_unaddressed="Leaves one party fully exposed while shielding the counterparty.",
                                suggested_revision=c.raw_text.replace("Vendor's", "Either party's").replace("Contractor's", "Either party's"),
                                rationale="Converts unilateral liability limitation into mutual protection.",
                            )
                        )

        return findings

    def evaluate_indemnification_risk(self, clauses: List[ContractClause]) -> List[Finding]:
        """Assess indemnification scope, defense obligations, and gross negligence exclusions."""
        findings = []
        indem_clauses = [c for c in clauses if c.taxonomy_category == "INDEMNIFICATION"]

        for c in indem_clauses:
            text_lower = c.normalized_text.lower()

            # Check for lack of defense notice and control
            if "sole defense" not in text_lower and "control of the defense" not in text_lower:
                findings.append(
                    Finding(
                        finding_id=f"risk_indem_defense_control_{c.clause_id}",
                        category=IssueCategory.INDEMNIFICATION,
                        severity=SeverityLevel.MEDIUM,
                        title="Indemnity Lacks Defense Control and Prompt Notice Procedures",
                        explanation="The indemnification clause does not explicitly grant the indemnifying party prompt written notice and control over defense and settlement.",
                        original_text=c.raw_text,
                        location=c.location,
                        risk_if_unaddressed="Counterparty may settle third-party claims without consent and demand reimbursement.",
                        suggested_revision=(
                            f"{c.raw_text} Provided that the indemnified party gives prompt written notice of the claim "
                            "and grants the indemnifying party sole control of the defense and settlement."
                        ),
                        rationale="Conditions indemnification on prompt notice and defense control.",
                    )
                )

        return findings

    def evaluate_termination_risk(self, clauses: List[ContractClause]) -> List[Finding]:
        """Assess evergreen renewal traps, cure periods, and unilateral termination."""
        findings = []
        term_clauses = [c for c in clauses if c.taxonomy_category == "TERMINATION"]

        for c in term_clauses:
            text_lower = c.normalized_text.lower()

            # Check for automatic renewal without reasonable cancellation window
            if "automatically renew" in text_lower or "automatic renewal" in text_lower:
                if "prior written notice" not in text_lower:
                    findings.append(
                        Finding(
                            finding_id=f"risk_evergreen_renewal_{c.clause_id}",
                            category=IssueCategory.TERMINATION_RENEWAL,
                            severity=SeverityLevel.HIGH,
                            title="Automatic Renewal Without Defined Notice Window",
                            explanation="The agreement automatically renews without specifying a reasonable advance notice period for non-renewal.",
                            original_text=c.raw_text,
                            location=c.location,
                            risk_if_unaddressed="Client may be unintentionally locked into subsequent contract terms.",
                            suggested_revision=(
                                f"{c.raw_text} unless either party provides at least thirty (30) days' written notice of "
                                "non-renewal prior to the expiration of the then-current term."
                            ),
                            rationale="Provides a 30-day non-renewal opt-out window.",
                        )
                    )

            # Check for termination for breach without cure period
            if ("breach" in text_lower or "default" in text_lower) and "cure" not in text_lower:
                findings.append(
                    Finding(
                        finding_id=f"risk_no_cure_period_{c.clause_id}",
                        category=IssueCategory.TERMINATION_RENEWAL,
                        severity=SeverityLevel.MEDIUM,
                        title="Immediate Termination for Breach Without Cure Period",
                        explanation="Clause permits termination for breach without providing a standard notice and opportunity to cure.",
                        original_text=c.raw_text,
                        location=c.location,
                        risk_if_unaddressed="Risks immediate contract cancellation for curable or inadvertent technical defaults.",
                        suggested_revision=(
                            f"{c.raw_text} upon written notice, provided the breaching party fails to cure such breach "
                            "within thirty (30) days of receiving written notice."
                        ),
                        rationale="Establishes standard 30-day notice and cure window.",
                    )
                )

        return findings

    def check_missing_provisions(
        self,
        hierarchy: ClauseHierarchy,
        understanding: ContractMetadataUnderstanding,
    ) -> List[Finding]:
        """Detect potentially missing mandatory provisions based on contract type."""
        findings = []
        c_type = hierarchy.contract_type
        req_list = MANDATORY_CLAUSES_BY_TYPE.get(c_type, MANDATORY_CLAUSES_BY_TYPE["General Contract"])

        present_taxonomies = {c.taxonomy_category for c in hierarchy.clauses}

        for tax, desc in req_list:
            if tax not in present_taxonomies:
                findings.append(
                    Finding(
                        finding_id=f"struct_missing_{tax.lower()}",
                        category=IssueCategory.MISSING_PROVISION,
                        severity=SeverityLevel.HIGH if tax in ("GOVERNING_LAW", "LIMITATION_OF_LIABILITY") else SeverityLevel.MEDIUM,
                        title=f"Missing {desc}",
                        explanation=f"A standard {c_type} routinely includes a dedicated {desc}. None was detected in this document.",
                        original_text="[Entire Agreement - Provision Absent]",
                        location=ClauseLocation(),
                        risk_if_unaddressed=f"Lack of {desc} creates legal ambiguity in event of dispute or enforcement.",
                        suggested_revision=f"Insert standard {desc} clause appropriate for {c_type}.",
                        rationale="Ensures essential contractual protections are incorporated.",
                    )
                )

        return findings

