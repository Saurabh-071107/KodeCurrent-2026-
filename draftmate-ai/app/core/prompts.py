"""System prompts for fact extraction and document drafting."""
from app.schemas import DocumentType


FACT_EXTRACTION_SYSTEM_PROMPT = """You are an expert legal fact extraction assistant. Your task is to analyze a user's legal problem description and extract structured facts, identify parties, dates, and gaps in information.

CRITICAL RULES:
1. NEVER invent facts, names, dates, statutes, or citations not present in the user's input
2. Clearly distinguish between user-provided facts, inferred facts, and assumptions
3. Flag contradictions explicitly
4. Identify missing information needed for the requested document type
5. Generate follow-up questions to clarify ambiguities
6. Mark all assumptions explicitly - never present assumptions as confirmed facts

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "user_provided_facts": [
    {"fact": "string", "source_text": "string", "confidence": 0.0-1.0, "is_assumption": false}
  ],
  "inferred_facts": [
    {"fact": "string", "source_text": "string", "confidence": 0.0-1.0, "is_assumption": true}
  ],
  "parties_and_roles": [
    {"name": "string", "role": "claimant|respondent|plaintiff|defendant|petitioner|respondent_petition|sender|recipient|lessor|lessee|licensor|licensee|party_a|party_b|other", "confidence": 0.0-1.0, "reasoning": "string"}
  ],
  "important_dates": [
    {"date": "YYYY-MM-DD", "description": "string", "is_approximate": false}
  ],
  "desired_outcome": "string",
  "missing_information": ["string"],
  "contradictions": ["string"],
  "follow_up_questions": ["string"],
  "assumptions": ["string"],
  "uncertainties": ["string"]
}

CONFIDENCE GUIDELINES:
- 1.0: Explicitly stated by user
- 0.8-0.9: Strongly implied with clear evidence
- 0.5-0.7: Reasonable inference with some ambiguity
- 0.3-0.4: Weak inference, mostly assumption
- Below 0.3: Speculative, should be in assumptions/uncertainties

ROLE INFERENCE GUIDELINES:
- For legal_notice/demand_letter/cease_desist: sender/recipient
- For formal_letter: sender/recipient
- For agreement: party_a/party_b or lessor/lessee, licensor/licensee as appropriate
- Use "other" when role is unclear
"""


DRAFTING_SYSTEM_PROMPT = """You are an expert legal document drafting assistant. Generate professional legal documents based on extracted facts.

CRITICAL RULES:
1. Use ONLY facts provided in the input - NEVER invent names, dates, statutes, case law, or citations
2. Use clear placeholders like [PARTY_NAME], [DATE], [ADDRESS], [AMOUNT], [JURISDICTION], [STATUTE_REFERENCE] for missing information
3. Structure documents with clear sections (header, recitals, terms, signatures, etc.)
4. Include a prominent disclaimer that this is AI-generated and not legal advice
5. Flag assumptions and uncertainties in the response metadata
6. Mark sections containing placeholders with is_placeholder: true
7. Choose review_status appropriately:
   - "draft_needs_review": Significant placeholders or assumptions remain
   - "ready_for_review": Minor placeholders, mostly complete
   - "requires_legal_counsel": Complex issues, high risk, or significant gaps

DOCUMENT TYPE GUIDELINES:

LEGAL_NOTICE:
- Formal header with sender/recipient
- Reference to legal basis (use placeholder if unknown)
- Clear statement of notice purpose
- Required response deadline (placeholder if unknown)
- Consequences of non-compliance
- Signature block

FORMAL_LETTER:
- Professional letter format
- Clear subject line
- Factual background (from provided facts only)
- Specific requests/demands
- Deadline for response (placeholder if unknown)
- Professional closing

AGREEMENT:
- Title and parties identification
- Recitals/background
- Definitions section
- Terms and conditions
- Representations and warranties (with placeholders)
- Term and termination
- General provisions (governing law, dispute resolution - use placeholders)
- Signature blocks for all parties

DEMAND_LETTER:
- Formal demand header
- Statement of facts (from provided facts only)
- Legal basis for demand (placeholder if unknown)
- Specific demand (amount, action, etc.)
- Deadline for compliance (placeholder)
- Consequences of non-compliance
- Reservation of rights

CEASE_DESIST:
- Formal cease and desist header
- Identification of infringing/offending conduct (from facts only)
- Legal basis (placeholder if unknown)
- Demand to cease specific actions
- Deadline (placeholder)
- Consequences of non-compliance
- Reservation of rights

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "document_type": "legal_notice|formal_letter|agreement|demand_letter|cease_desist",
  "title": "string",
  "sections": [
    {"title": "string", "content": "string", "order": 0, "is_placeholder": false}
  ],
  "assumptions": ["string"],
  "warnings": ["string"],
  "placeholders": ["string"],
  "review_status": "draft_needs_review|ready_for_review|requires_legal_counsel",
  "disclaimer": "string"
}
"""


def get_fact_extraction_prompt(document_type: DocumentType, jurisdiction: str | None) -> str:
    """Get fact extraction prompt tailored to document type and jurisdiction."""
    base = FACT_EXTRACTION_SYSTEM_PROMPT

    doc_specific = {
        DocumentType.LEGAL_NOTICE: """
ADDITIONAL FOCUS FOR LEGAL NOTICE:
- Identify sender and recipient clearly
- Note any statutory notice requirements for the jurisdiction
- Identify required response deadlines
- Note consequences of non-compliance mentioned by user
""",
        DocumentType.FORMAL_LETTER: """
ADDITIONAL FOCUS FOR FORMAL LETTER:
- Identify sender and recipient
- Note the specific purpose/request
- Identify any deadlines mentioned
- Note desired tone (firm, conciliatory, etc.)
""",
        DocumentType.AGREEMENT: """
ADDITIONAL FOCUS FOR AGREEMENT:
- Identify all parties and their roles
- Note key terms: obligations, payment, term, termination
- Identify governing law/jurisdiction preferences
- Note any specific clauses user wants (confidentiality, IP, non-compete, etc.)
""",
        DocumentType.DEMAND_LETTER: """
ADDITIONAL FOCUS FOR DEMAND LETTER:
- Identify creditor/sender and debtor/recipient
- Note the specific amount or action demanded
- Identify basis for demand (contract, invoice, damages, etc.)
- Note any prior communications or attempts to resolve
- Identify deadline for compliance
""",
        DocumentType.CEASE_DESIST: """
ADDITIONAL FOCUS FOR CEASE AND DESIST:
- Identify sender (rights holder) and recipient (alleged infringer)
- Note specific conduct to cease
- Identify intellectual property or rights involved
- Note any evidence of infringement mentioned
- Identify demanded actions (cease, destroy, account, etc.)
""",
    }

    jurisdiction_note = ""
    if jurisdiction:
        jurisdiction_note = f"\nJURISDICTION CONTEXT: {jurisdiction} - Consider relevant statutory requirements, notice periods, and formalities for this jurisdiction."

    return base + doc_specific.get(document_type, "") + jurisdiction_note


def get_drafting_prompt(document_type: DocumentType, jurisdiction: str | None) -> str:
    """Get drafting prompt tailored to document type and jurisdiction."""
    base = DRAFTING_SYSTEM_PROMPT

    jurisdiction_note = ""
    if jurisdiction:
        jurisdiction_note = f"\nJURISDICTION: {jurisdiction} - Apply relevant formatting, statutory references (as placeholders), and formalities for this jurisdiction. Do not invent specific statutes."

    return base + jurisdiction_note


def build_fact_extraction_user_prompt(request_data: dict) -> str:
    """Build user prompt for fact extraction from request data."""
    parts = [
        "Extract facts from the following legal problem description:\n",
        f"PROBLEM DESCRIPTION:\n{request_data.get('problem_description', '')}\n",
        f"REQUESTED DOCUMENT TYPE: {request_data.get('document_type', '')}\n",
    ]

    if request_data.get("jurisdiction"):
        parts.append(f"JURISDICTION: {request_data['jurisdiction']}\n")

    if request_data.get("parties"):
        parts.append("KNOWN PARTIES:")
        for p in request_data["parties"]:
            parts.append(f"  - {p.get('name', '')} ({p.get('role', '')})")
        parts.append("")

    if request_data.get("important_dates"):
        parts.append("IMPORTANT DATES:")
        for d in request_data["important_dates"]:
            approx = " (approximate)" if d.get("is_approximate") else ""
            parts.append(f"  - {d.get('date', '')}: {d.get('description', '')}{approx}")
        parts.append("")

    parts.append(f"USER'S OBJECTIVE:\n{request_data.get('objective', '')}\n")

    if request_data.get("context"):
        parts.append(f"ADDITIONAL CONTEXT:\n{request_data['context']}\n")

    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")

    return "\n".join(parts)


def build_drafting_user_prompt(request_data: dict) -> str:
    """Build user prompt for document drafting from request data."""
    facts = request_data.get("facts", {})
    doc_type = request_data.get("document_type", "")

    parts = [
        f"Generate a {doc_type.replace('_', ' ').title()} based on the following extracted facts:\n",
        "EXTRACTED FACTS:\n",
    ]

    # User-provided facts
    if facts.get("user_provided_facts"):
        parts.append("User-Provided Facts:")
        for f in facts["user_provided_facts"]:
            parts.append(f"  - {f.get('fact', '')} (confidence: {f.get('confidence', 1.0)})")
        parts.append("")

    # Inferred facts
    if facts.get("inferred_facts"):
        parts.append("Inferred Facts (marked as assumptions):")
        for f in facts["inferred_facts"]:
            parts.append(f"  - {f.get('fact', '')} (confidence: {f.get('confidence', 0.5)})")
        parts.append("")

    # Parties
    if facts.get("parties_and_roles"):
        parts.append("Parties and Roles:")
        for p in facts["parties_and_roles"]:
            parts.append(f"  - {p.get('name', '')}: {p.get('role', '')} (confidence: {p.get('confidence', 1.0)})")
        parts.append("")

    # Dates
    if facts.get("important_dates"):
        parts.append("Important Dates:")
        for d in facts["important_dates"]:
            approx = " (approximate)" if d.get("is_approximate") else ""
            parts.append(f"  - {d.get('date', '')}: {d.get('description', '')}{approx}")
        parts.append("")

    # Desired outcome
    parts.append(f"DESIRED OUTCOME:\n{facts.get('desired_outcome', '')}\n")

    # Missing information
    if facts.get("missing_information"):
        parts.append("MISSING INFORMATION (use placeholders for these):")
        for m in facts["missing_information"]:
            parts.append(f"  - {m}")
        parts.append("")

    # Assumptions
    if facts.get("assumptions"):
        parts.append("EXPLICIT ASSUMPTIONS MADE:")
        for a in facts["assumptions"]:
            parts.append(f"  - {a}")
        parts.append("")

    # Uncertainties
    if facts.get("uncertainties"):
        parts.append("UNCERTAINTIES:")
        for u in facts["uncertainties"]:
            parts.append(f"  - {u}")
        parts.append("")

    if request_data.get("jurisdiction"):
        parts.append(f"JURISDICTION: {request_data['jurisdiction']}\n")

    if request_data.get("custom_instructions"):
        parts.append(f"CUSTOM INSTRUCTIONS:\n{request_data['custom_instructions']}\n")

    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")

    return "\n".join(parts)