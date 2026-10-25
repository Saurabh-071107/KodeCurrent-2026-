"""Test fixtures with sample data."""
from datetime import date

from app.schemas import (
    DocumentType,
    Jurisdiction,
    PartyInfo,
    PartyRole,
    DateInfo,
    FactExtractionRequest,
    FactExtractionResponse,
    ExtractedFact,
    PartyRoleInfo,
    DraftRequest,
    DraftResponse,
    DraftSection,
)


def sample_fact_extraction_request():
    """Sample fact extraction request."""
    return FactExtractionRequest(
        problem_description=(
            "My landlord has not returned my security deposit of $2,000 after I moved out "
            "on January 15, 2024. The lease was for 12 months at $1,500/month. I provided "
            "my forwarding address and the apartment was in good condition. It's been 45 days "
            "and I have not received the deposit or an itemized deduction list. I want to send "
            "a formal demand letter."
        ),
        document_type=DocumentType.DEMAND_LETTER,
        jurisdiction=Jurisdiction.US_CA,
        parties=[
            PartyInfo(name="John Doe", role=PartyRole.SENDER, address="123 Main St, San Francisco, CA"),
            PartyInfo(name="ABC Property Management", role=PartyRole.RECIPIENT, address="456 Market St, San Francisco, CA"),
        ],
        important_dates=[
            DateInfo(date=date(2024, 1, 15), description="Move-out date", is_approximate=False),
            DateInfo(date=date(2024, 3, 1), description="45 days after move-out", is_approximate=True),
        ],
        objective="Recover security deposit of $2,000 plus any statutory penalties",
        context="California law requires return within 21 days with itemized deductions",
    )


def sample_fact_extraction_response():
    """Sample fact extraction response."""
    return FactExtractionResponse(
        user_provided_facts=[
            ExtractedFact(
                fact="Security deposit amount is $2,000",
                source_text="security deposit of $2,000",
                confidence=1.0,
                is_assumption=False,
            ),
            ExtractedFact(
                fact="Move-out date was January 15, 2024",
                source_text="moved out on January 15, 2024",
                confidence=1.0,
                is_assumption=False,
            ),
            ExtractedFact(
                fact="Monthly rent was $1,500",
                source_text="lease was for 12 months at $1,500/month",
                confidence=1.0,
                is_assumption=False,
            ),
            ExtractedFact(
                fact="Forwarding address was provided",
                source_text="I provided my forwarding address",
                confidence=0.9,
                is_assumption=False,
            ),
            ExtractedFact(
                fact="Apartment was in good condition",
                source_text="apartment was in good condition",
                confidence=0.8,
                is_assumption=False,
            ),
            ExtractedFact(
                fact="45 days have passed since move-out",
                source_text="It's been 45 days",
                confidence=0.9,
                is_assumption=False,
            ),
            ExtractedFact(
                fact="No deposit or itemized deduction list received",
                source_text="not received the deposit or an itemized deduction list",
                confidence=1.0,
                is_assumption=False,
            ),
        ],
        inferred_facts=[
            ExtractedFact(
                fact="California 21-day statutory deadline has passed",
                source_text="45 days have passed since move-out",
                confidence=0.9,
                is_assumption=True,
            ),
        ],
        parties_and_roles=[
            PartyRoleInfo(
                name="John Doe",
                role=PartyRole.SENDER,
                confidence=1.0,
                reasoning="User identifies as tenant sending demand",
            ),
            PartyRoleInfo(
                name="ABC Property Management",
                role=PartyRole.RECIPIENT,
                confidence=1.0,
                reasoning="Identified as landlord/property management",
            ),
        ],
        important_dates=[
            DateInfo(date=date(2024, 1, 15), description="Move-out date", is_approximate=False),
            DateInfo(date=date(2024, 3, 1), description="45 days after move-out (approximate)", is_approximate=True),
        ],
        desired_outcome="Recover security deposit of $2,000 plus any statutory penalties",
        missing_information=[
            "Exact lease start and end dates",
            "Whether a pre-move-out inspection was conducted",
            "Photos or documentation of apartment condition at move-out",
            "Any written communication with landlord about deposit",
            "Exact statutory penalty amount under California law",
        ],
        contradictions=[],
        follow_up_questions=[
            "Do you have photos or a move-out inspection report?",
            "What is the exact lease start date?",
            "Have you communicated in writing with the landlord about the deposit?",
            "Did you do a pre-move-out walkthrough with the landlord?",
        ],
        assumptions=[
            "California law applies (jurisdiction: US_CA)",
            "The 45 days mentioned is accurate",
            "The landlord is subject to California security deposit law",
            "No deductions were legitimately made",
        ],
        uncertainties=[
            "Whether landlord made any deductions",
            "Exact date the 45-day period started",
            "Whether any written notice was already sent",
        ],
    )


def sample_draft_request():
    """Sample draft request."""
    return DraftRequest(
        document_type=DocumentType.DEMAND_LETTER,
        facts=sample_fact_extraction_response(),
        jurisdiction=Jurisdiction.US_CA,
        custom_instructions="Tone should be firm but professional. Reference California Civil Code 1950.5 as placeholder.",
    )


def sample_draft_response():
    """Sample draft response."""
    return DraftResponse(
        document_type=DocumentType.DEMAND_LETTER,
        title="Demand Letter for Security Deposit Return",
        sections=[
            DraftSection(
                title="Header",
                content="John Doe\n123 Main St, San Francisco, CA\n\n[DATE]\n\nABC Property Management\n456 Market St, San Francisco, CA\n\nRe: Demand for Return of Security Deposit - [PROPERTY ADDRESS]",
                order=0,
                is_placeholder=True,
            ),
            DraftSection(
                title="Statement of Facts",
                content="On January 15, 2024, I vacated the premises located at [PROPERTY ADDRESS] (the \"Premises\") "
                "after fulfilling my obligations under the lease agreement dated [LEASE_START_DATE] through [LEASE_END_DATE]. "
                "I paid a security deposit of $2,000.00. I provided my forwarding address for the return of the deposit. "
                "The Premises were left in good condition, ordinary wear and tear excepted.",
                order=1,
                is_placeholder=True,
            ),
            DraftSection(
                title="Legal Basis",
                content="Under California Civil Code Section 1950.5, a landlord must return the security deposit "
                "within 21 days after the tenant vacates, along with an itemized statement of any deductions. "
                "As of [CURRENT_DATE], 45 days have passed since my move-out on January 15, 2024, and I have "
                "received neither the deposit nor an itemized deduction statement.",
                order=2,
                is_placeholder=True,
            ),
            DraftSection(
                title="Demand",
                content="I hereby demand the immediate return of my full security deposit of $2,000.00, "
                "plus any statutory penalties available under California Civil Code Section 1950.5(l) "
                "(up to twice the amount of the deposit for bad faith retention).",
                order=3,
                is_placeholder=False,
            ),
            DraftSection(
                title="Deadline",
                content="You have [DEADLINE_DAYS] days from receipt of this letter (until [DEADLINE_DATE]) "
                "to remit the full amount of $2,000.00 plus applicable penalties to the address above.",
                order=4,
                is_placeholder=True,
            ),
            DraftSection(
                title="Consequences",
                content="If I do not receive the requested amount by the deadline, I will pursue all available "
                "legal remedies, including filing a claim in small claims court for the deposit, statutory "
                "penalties, court costs, and attorney's fees.",
                order=5,
                is_placeholder=False,
            ),
            DraftSection(
                title="Signature",
                content="Sincerely,\n\nJohn Doe\n[PHONE NUMBER]\n[EMAIL ADDRESS]",
                order=6,
                is_placeholder=True,
            ),
        ],
        assumptions=[
            "California law applies",
            "Landlord is subject to CA Civil Code 1950.5",
            "No legitimate deductions were made",
            "45-day timeline is accurate",
        ],
        warnings=[
            "Property address placeholder needs to be filled",
            "Lease dates need to be verified",
            "Deadline date needs to be calculated",
            "Statutory penalty calculation should be verified by attorney",
        ],
        placeholders=[
            "[PROPERTY ADDRESS]",
            "[LEASE_START_DATE]",
            "[LEASE_END_DATE]",
            "[CURRENT_DATE]",
            "[DEADLINE_DAYS]",
            "[DEADLINE_DATE]",
            "[PHONE NUMBER]",
            "[EMAIL ADDRESS]",
        ],
        review_status="draft_needs_review",
        disclaimer="This document is generated by an AI assistant and does not constitute legal advice. Please consult with a qualified attorney before using this document for any legal purpose.",
    )


def mock_llm_fact_extraction_response():
    """Mock LLM response for fact extraction."""
    return {
        "user_provided_facts": [
            {"fact": "Security deposit amount is $2,000", "source_text": "security deposit of $2,000", "confidence": 1.0, "is_assumption": False},
            {"fact": "Move-out date was January 15, 2024", "source_text": "moved out on January 15, 2024", "confidence": 1.0, "is_assumption": False},
        ],
        "inferred_facts": [
            {"fact": "California 21-day statutory deadline has passed", "source_text": "45 days have passed since move-out", "confidence": 0.9, "is_assumption": True},
        ],
        "parties_and_roles": [
            {"name": "John Doe", "role": "sender", "confidence": 1.0, "reasoning": "User identifies as tenant sending demand"},
            {"name": "ABC Property Management", "role": "recipient", "confidence": 1.0, "reasoning": "Identified as landlord/property management"},
        ],
        "important_dates": [
            {"date": "2024-01-15", "description": "Move-out date", "is_approximate": False},
        ],
        "desired_outcome": "Recover security deposit of $2,000 plus any statutory penalties",
        "missing_information": ["Exact lease start and end dates"],
        "contradictions": [],
        "follow_up_questions": ["Do you have photos or a move-out inspection report?"],
        "assumptions": ["California law applies (jurisdiction: US_CA)"],
        "uncertainties": ["Whether landlord made any deductions"],
    }


def mock_llm_drafting_response():
    """Mock LLM response for drafting."""
    return {
        "document_type": "demand_letter",
        "title": "Demand Letter for Security Deposit Return",
        "sections": [
            {"title": "Header", "content": "John Doe\n123 Main St\n\n[DATE]\n\nABC Property Management\n456 Market St\n\nRe: Demand for Return of Security Deposit", "order": 0, "is_placeholder": True},
            {"title": "Body", "content": "Dear ABC Property Management,\n\nI demand return of my $2,000 security deposit...", "order": 1, "is_placeholder": True},
        ],
        "assumptions": ["California law applies"],
        "warnings": ["Property address placeholder needs to be filled"],
        "placeholders": ["[PROPERTY ADDRESS]", "[DATE]"],
        "review_status": "draft_needs_review",
        "disclaimer": "This document is generated by an AI assistant and does not constitute legal advice. Please consult with a qualified attorney before using this document for any legal purpose.",
    }