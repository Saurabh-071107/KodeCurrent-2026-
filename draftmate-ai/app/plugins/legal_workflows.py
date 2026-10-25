"""
Claude-for-Legal inspired modular task plugins and Awesome-Legal-Skills reasoning tools.
Tailored for Indian law practitioners, advocates, and law students.
References:
- https://github.com/anthropics/claude-for-legal
- https://github.com/lawve-ai/awesome-legal-skills
"""
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


# -------------------------------------------------------------------------
# 1. Awesome Legal Skills: Statutory Migration & IRAC Breakdown
# -------------------------------------------------------------------------

IPC_TO_BNS_MAP = {
    "302": {"bns": "103", "title": "Punishment for Murder"},
    "304A": {"bns": "106", "title": "Causing death by negligence"},
    "307": {"bns": "109", "title": "Attempt to Murder"},
    "376": {"bns": "64", "title": "Rape"},
    "420": {"bns": "318", "title": "Cheating and dishonestly inducing delivery of property"},
    "406": {"bns": "316", "title": "Criminal breach of trust"},
    "498A": {"bns": "85", "title": "Husband or relative of husband subjecting woman to cruelty"},
    "506": {"bns": "351", "title": "Criminal Intimidation"},
    "120B": {"bns": "61", "title": "Criminal Conspiracy"}
}

CRPC_TO_BNSS_MAP = {
    "437": {"bnss": "480", "title": "Bail in case of non-bailable offence by Magistrate"},
    "438": {"bnss": "482", "title": "Direction for grant of bail to person apprehending arrest (Anticipatory Bail)"},
    "439": {"bnss": "483", "title": "Special powers of High Court or Court of Session regarding bail"},
    "154": {"bnss": "173", "title": "Information in cognizable cases (FIR)"},
    "161": {"bnss": "180", "title": "Examination of witnesses by police"},
    "164": {"bnss": "183", "title": "Recording of confessions and statements"},
    "173": {"bnss": "193", "title": "Report of police officer on completion of investigation"}
}


def map_legacy_statute(statute_type: str, section_number: str) -> Optional[Dict[str, str]]:
    """Maps legacy IPC / CrPC sections to new Bharatiya Nyaya Sanhita (BNS / BNSS)."""
    clean_sec = re.sub(r"[^\w]", "", section_number).upper()
    if statute_type.lower() in ["ipc", "indian penal code"]:
        match = IPC_TO_BNS_MAP.get(clean_sec)
        if match:
            return {
                "legacy_statute": f"Section {section_number} IPC",
                "modern_statute": f"Section {match['bns']} Bharatiya Nyaya Sanhita, 2023 (BNS)",
                "description": match["title"]
            }
    elif statute_type.lower() in ["crpc", "code of criminal procedure"]:
        match = CRPC_TO_BNSS_MAP.get(clean_sec)
        if match:
            return {
                "legacy_statute": f"Section {section_number} CrPC",
                "modern_statute": f"Section {match['bnss']} Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
                "description": match["title"]
            }
    return None


def execute_irac_analysis(facts: str, target_issue: str, governing_rule: str) -> Dict[str, str]:
    """Applies the canonical IRAC (Issue, Rule, Application, Conclusion) legal reasoning structure."""
    return {
        "issue": target_issue.strip(),
        "rule": governing_rule.strip(),
        "application": f"Applying the governing statutory rule to the evidentiary facts: {facts.strip()[:400]}...",
        "conclusion": "Based upon established principles and statutory interpretation, the claim/prayer is prima facie sustainable."
    }


# -------------------------------------------------------------------------
# 2. Claude for Legal: Modular Workflow Plugins
# -------------------------------------------------------------------------

class BailPetitionPlugin:
    """Modular workflow for drafting Anticipatory / Regular Bail under BNSS 2023."""

    @staticmethod
    def generate_bail_grounds(facts: Dict[str, Any]) -> List[str]:
        grounds = [
            "1. That the Applicant is a law-abiding citizen with deep roots in society and has no prior criminal antecedents.",
            "2. That the allegations in the FIR are false, frivolous, vexatious, and motivated by personal vendetta.",
            "3. That the custodial interrogation of the Applicant is wholly unwarranted as all material records are documentary and already seized.",
            "4. That the Applicant undertakes to join investigation as and when directed by the Investigating Officer.",
            "5. That the Applicant is ready and willing to furnish solvent surety to the satisfaction of this Hon'ble Court.",
            "6. That the principle 'Bail is the rule, Jail is an exception' established in State of Rajasthan v. Balchand applies with full force."
        ]
        if facts.get("medical_grounds"):
            grounds.insert(2, f"2A. That the Applicant suffers from documented medical ailments: {facts['medical_grounds']}.")
        if facts.get("parity_with_co_accused"):
            grounds.insert(3, "3A. That on the principle of parity, co-accused similarly situated has already been enlarged on bail.")
        return grounds


class ChequeBounceNoticePlugin:
    """Modular workflow for Section 138 Negotiable Instruments Act, 1881 Demand Notices."""

    @staticmethod
    def validate_and_draft_notice(data: Dict[str, Any]) -> Dict[str, Any]:
        cheque_no = data.get("cheque_number", "XXXXXX")
        amount = data.get("amount", "0")
        memo_date = data.get("memo_date", "recent date")
        recipient = data.get("recipient", "The Drawer")

        clauses = [
            f"1. That you, the Noticee, issued Cheque No. {cheque_no} in the sum of Rs. {amount}/- in discharge of legal debt/liability.",
            f"2. That upon presentation, the said cheque was returned dishonoured by bank return memo dated {memo_date} with remarks 'FUNDS INSUFFICIENT'.",
            f"3. That you have intentionally neglected and failed to clear the said outstanding liability despite repeated verbal demands.",
            f"4. TAKE NOTICE that you are hereby called upon to pay the sum of Rs. {amount}/- within 15 (fifteen) days from receipt of this notice, failing which criminal proceedings under Section 138 of the Negotiable Instruments Act, 1881 shall be initiated against you at your sole risk and costs."
        ]

        return {
            "title": "STATUTORY NOTICE UNDER SECTION 138 NEGOTIABLE INSTRUMENTS ACT",
            "statute": "Section 138 of Negotiable Instruments Act, 1881",
            "clauses": clauses,
            "statutory_period_days": 15,
            "recipient": recipient
        }


class ContractRiskPlugin:
    """Modular contract due diligence and indemnity risk reviewer."""

    @staticmethod
    def inspect_clauses(text: str) -> List[Dict[str, str]]:
        risks = []
        if "indemnify and hold harmless" in text.lower() and "uncapped" in text.lower():
            risks.append({
                "clause_type": "Indemnity",
                "risk_level": "HIGH",
                "finding": "Uncapped indemnity obligation detected.",
                "recommendation": "Negotiate a monetary liability ceiling capped at 100% of aggregate fees received under the contract."
            })
        if "exclusive jurisdiction" in text.lower():
            risks.append({
                "clause_type": "Jurisdiction",
                "risk_level": "MEDIUM",
                "finding": "Exclusive jurisdiction forum selection clause present.",
                "recommendation": "Confirm whether the designated seat of arbitration/court is commercially feasible."
            })
        if "lock-in" in text.lower():
            risks.append({
                "clause_type": "Lock-in Period",
                "risk_level": "HIGH",
                "finding": "Lock-in clause without termination for cause provisions.",
                "recommendation": "Ensure bilateral termination rights in events of material breach or insolvency."
            })
        return risks
