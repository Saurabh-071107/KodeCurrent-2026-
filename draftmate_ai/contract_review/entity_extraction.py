"""Entity extraction engine: parties, defined terms, dates, monetary figures, and signature blocks."""

import re
from typing import List, Dict, Tuple, Set, Optional
from pydantic import BaseModel, Field

from draftmate_ai.shared.document_models import ProcessedDocument
from draftmate_ai.contract_review.schemas import (
    ExtractedParty,
    ExtractedDefinedTerm,
    ContractMetadataUnderstanding,
)
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Party extraction patterns in contract preambles
PREAMBLE_PARTY_RE = re.compile(
    r"(?:between|among|by and between)\s+([A-Z][A-Za-z0-9\s\,\.\&\-]+?)(?:\s*,?\s*(?:a|an)\s+([A-Za-z\s]+?)(?:organized under|corporation|llc|limited|company)?)?\s*(?:\([\"“]([A-Za-z\s]+)[\"”]\))?\s+and\s+([A-Z][A-Za-z0-9\s\,\.\&\-]+?)(?:\s*,?\s*(?:a|an)\s+([A-Za-z\s]+?)(?:organized under|corporation|llc|limited|company)?)?\s*(?:\([\"“]([A-Za-z\s]+)[\"”]\))?",
    re.IGNORECASE,
)

# Defined terms patterns:
# 1. "Confidential Information" means ...
# 2. "Effective Date" shall mean ...
# 3. (the "Agreement")
DEFINED_TERM_RE1 = re.compile(
    r"[\"“]([A-Z][A-Za-z0-9\s\-\/\']{2,40})[\"”]\s+(?:means|shall mean|has the meaning|refers to)\s+(.+?)(?:\.|$)",
    re.IGNORECASE,
)
DEFINED_TERM_RE2 = re.compile(
    r"\(([A-Z][A-Za-z0-9\s\-\/]{2,30})\)\s+means\s+(.+?)(?:\.|$)",
    re.IGNORECASE,
)
DEFINED_TERM_PAREN = re.compile(
    r"\(\s*(?:the\s+)?[\"“]([A-Z][A-Za-z0-9\s\-\/\']{2,40})[\"”]\s*\)"
)

# Monetary pattern
MONEY_RE = re.compile(
    r"(?:\$|€|£|¥)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|thousand|USD|EUR|GBP))?",
    re.IGNORECASE,
)

# Date patterns (e.g. October 25, 2026 or 2026-10-25 or 25th day of October, 2026)
DATE_RE = re.compile(
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\,?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\,?\s+\d{4}\b",
    re.IGNORECASE,
)

# Notice period patterns (e.g. "30 days prior written notice", "within five (5) business days")
NOTICE_PERIOD_RE = re.compile(
    r"\b(?:\d+|one|two|three|five|ten|fifteen|twenty|thirty|sixty|ninety|180)\s*(?:\(\d+\))?\s*(?:business\s+)?days(?:\'?\s+(?:prior\s+)?written\s+notice)?\b",
    re.IGNORECASE,
)

SIGNATURE_INDICATORS = [
    "in witness whereof",
    "duly executed",
    "by: ",
    "signature:",
    "authorized signature",
    "its: ",
]


class EntityExtractor:
    """Extracts contractual entities, parties, definitions, and temporal/monetary parameters."""

    def extract_parties(self, text: str) -> List[ExtractedParty]:
        """Extract contracting parties, their legal forms, and assigned aliases."""
        parties: List[ExtractedParty] = []
        match = PREAMBLE_PARTY_RE.search(text[:3000])

        if match:
            # First party
            p1_raw = match.group(1).strip()
            p1_alias = match.group(3).strip() if match.group(3) else None
            parties.append(
                ExtractedParty(
                    raw_name=p1_raw,
                    canonical_name=p1_raw,
                    role_or_alias=p1_alias,
                    entity_type=match.group(2).strip() if match.group(2) else None,
                )
            )

            # Second party
            p2_raw = match.group(4).strip()
            p2_alias = match.group(6).strip() if match.group(6) else None
            parties.append(
                ExtractedParty(
                    raw_name=p2_raw,
                    canonical_name=p2_raw,
                    role_or_alias=p2_alias,
                    entity_type=match.group(5).strip() if match.group(5) else None,
                )
            )

        # Fallback heuristic: look for "Party A and Party B" or signature lines
        if not parties:
            lines = text[:1500].splitlines()
            for line in lines:
                if "entered into by" in line.lower() or "agreement between" in line.lower():
                    # Extract uppercase names
                    names = re.findall(r"\b[A-Z][A-Za-z0-9\s\,\.]+(?:Corp|LLC|Inc|Limited|Ltd|Company|Pte)\b", line)
                    for n in names:
                        parties.append(ExtractedParty(raw_name=n.strip(), canonical_name=n.strip()))

        return parties

    def extract_defined_terms(self, document: ProcessedDocument) -> Dict[str, ExtractedDefinedTerm]:
        """Extract explicit definitions defined in the contract."""
        terms: Dict[str, ExtractedDefinedTerm] = {}

        for el in document.elements:
            text = el.normalized_text

            # Check pattern 1
            for m in DEFINED_TERM_RE1.finditer(text):
                t_name = m.group(1).strip()
                t_def = m.group(2).strip()
                if len(t_name.split()) <= 6:
                    terms[t_name.lower()] = ExtractedDefinedTerm(
                        term=t_name,
                        definition=t_def,
                        clause_number=el.clause_number,
                        page=el.page_number,
                    )

            # Check parenthetical definitions e.g. (the "Agreement")
            for m in DEFINED_TERM_PAREN.finditer(text):
                t_name = m.group(1).strip()
                if len(t_name.split()) <= 5 and t_name.lower() not in terms:
                    terms[t_name.lower()] = ExtractedDefinedTerm(
                        term=t_name,
                        definition=f"Defined in context of: {text[:100]}...",
                        clause_number=el.clause_number,
                        page=el.page_number,
                    )

        return terms

    def find_undefined_capitalized_terms(
        self,
        document: ProcessedDocument,
        defined_terms: Dict[str, ExtractedDefinedTerm],
    ) -> List[Tuple[str, str, int]]:
        """Identify capitalized terms used in contract body that lack explicit definitions.

        Returns:
            List of (term, excerpt, page_number) tuples.
        """
        known_defined = set(defined_terms.keys())
        # Common false positive words in English / legal contracts
        common_exempt = {
            "the", "this", "agreement", "section", "article", "party", "parties",
            "contract", "exhibit", "schedule", "united", "states", "america",
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
            "january", "february", "march", "april", "may", "june", "july", "august",
            "september", "october", "november", "december", "in", "witness", "whereof",
            "landlord", "tenant", "buyer", "seller", "contractor", "client", "discloser",
            "recipient", "day", "days", "act", "law", "court",
        }

        undefined_candidates: Dict[str, Tuple[str, int]] = {}

        for el in document.elements:
            # Skip headings and definitions sections
            if el.section_heading and "definition" in el.section_heading.lower():
                continue

            # Look for Title Case multi-word or single capitalized non-standard words
            matches = re.finditer(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b", el.normalized_text)
            for m in matches:
                cand = m.group(1).strip()
                cand_lower = cand.lower()

                # Filter out standard words, single letters, and known defined terms
                if (
                    len(cand) > 3
                    and cand_lower not in known_defined
                    and cand_lower not in common_exempt
                    and not any(w in common_exempt for w in cand_lower.split())
                ):
                    # Check if it looks like an intended legal defined term
                    if cand_lower not in undefined_candidates:
                        undefined_candidates[cand_lower] = (el.original_text, el.page_number or 1)

        return [(term.title(), exc, pg) for term, (exc, pg) in undefined_candidates.items()]

    def extract_metadata_understanding(self, document: ProcessedDocument) -> ContractMetadataUnderstanding:
        """Analyze full document and construct ContractMetadataUnderstanding."""
        full_text = document.raw_text

        parties = self.extract_parties(full_text)
        defined_terms = self.extract_defined_terms(document)

        # Monetary values
        money_matches = list(dict.fromkeys(MONEY_RE.findall(full_text)))

        # Dates
        date_matches = list(dict.fromkeys(DATE_RE.findall(full_text)))

        # Notice periods
        notice_matches = list(dict.fromkeys(NOTICE_PERIOD_RE.findall(full_text)))

        # Signature blocks detection
        has_signatures = any(sig in full_text.lower() for sig in SIGNATURE_INDICATORS)

        # Detect Governing Law
        gov_law = None
        gov_match = re.search(r"governed\s+by\s+(?:the\s+laws\s+of\s+)?(?:the\s+State\s+of\s+)?([A-Za-z\s]+?)(?:\.|\;|\,)", full_text, re.IGNORECASE)
        if gov_match:
            gov_law = gov_match.group(1).strip()

        return ContractMetadataUnderstanding(
            contract_title=document.metadata.title,
            governing_law=gov_law,
            effective_date=date_matches[0] if date_matches else None,
            parties=parties,
            defined_terms=defined_terms,
            key_dates=date_matches,
            monetary_values=money_matches,
            notice_periods=notice_matches,
            signature_blocks_found=has_signatures,
        )

