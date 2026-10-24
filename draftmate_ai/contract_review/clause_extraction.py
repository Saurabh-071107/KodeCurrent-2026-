"""Contract clause extraction, taxonomy classification, and cross-reference mapping."""

import re
from typing import List, Dict, Optional, Tuple, Set
from pydantic import BaseModel, Field

from draftmate_ai.shared.document_models import ProcessedDocument, StructuralElement, ElementType
from draftmate_ai.contract_review.schemas import ClauseLocation
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Standard legal clause taxonomy keywords
CLAUSE_TAXONOMY_KEYWORDS = {
    "CONFIDENTIALITY": ["confidential", "proprietary information", "non-disclosure", "secrecy"],
    "INDEMNIFICATION": ["indemnify", "indemnification", "hold harmless", "defend"],
    "LIMITATION_OF_LIABILITY": ["limitation of liability", "consequential damages", "aggregate liability", "cap on liability"],
    "TERMINATION": ["termination", "term and termination", "expiration", "survival", "cancel"],
    "PAYMENT_TERMS": ["fees", "payment", "invoicing", "compensation", "interest", "billing", "taxes"],
    "INTELLECTUAL_PROPERTY": ["intellectual property", "ownership", "work made for hire", "license grant", "patents", "copyrights"],
    "GOVERNING_LAW": ["governing law", "governed by", "jurisdiction", "choice of law", "applicable law"],
    "DISPUTE_RESOLUTION": ["dispute resolution", "arbitration", "mediation", "venue", "jury trial waiver"],
    "WARRANTIES": ["warranties", "representations", "as is", "merchantability", "fitness for purpose"],
    "FORCE_MAJEURE": ["force majeure", "acts of god", "unforeseeable circumstances"],
    "ASSIGNMENT": ["assignment", "successors and assigns", "subcontracting"],
    "NOTICES": ["notices", "written notice", "certified mail", "addresses for notice"],
    "SEVERABILITY": ["severability", "invalidity", "unenforceability"],
    "ENTIRE_AGREEMENT": ["entire agreement", "integration", "amendments", "modification in writing"],
    "DEFINITIONS": ["definitions", "defined terms", "meanings"],
}

# Contract Type classification keywords
CONTRACT_TYPE_KEYWORDS = {
    "Non-Disclosure Agreement": ["non-disclosure", "confidentiality agreement", "mutual nda"],
    "Master Services Agreement": ["master services agreement", "services agreement", "statement of work", "msa"],
    "Commercial Lease Agreement": ["lease agreement", "demise of premises", "landlord", "tenant", "rent"],
    "Software License Agreement": ["software license", "end user license", "eula", "saas agreement"],
    "Employment Agreement": ["employment agreement", "employment contract", "employee", "employer"],
    "Vendor / Supply Agreement": ["supply agreement", "vendor agreement", "purchase order"],
}

# Cross reference pattern: e.g. "Section 4.1", "Article II", "Clause 2.02"
CROSS_REF_RE = re.compile(
    r"\b(?:Section|Article|Clause|Schedule|Exhibit)\s+([0-9A-ZIVXLCDM]+(?:\.[0-9A-Za-z]+)*)\b",
    re.IGNORECASE,
)


class ContractClause(BaseModel):
    """Enriched contract clause model with semantic category and cross-references."""
    clause_id: str
    clause_number: Optional[str] = None
    title: Optional[str] = None
    taxonomy_category: str = "GENERAL"
    raw_text: str
    normalized_text: str
    location: ClauseLocation
    cross_references_outbound: List[str] = Field(default_factory=list)


class ClauseHierarchy(BaseModel):
    """Structured hierarchical representation of extracted contract clauses."""
    contract_title: Optional[str] = None
    contract_type: str = "General Contract"
    clauses: List[ContractClause] = Field(default_factory=list)
    clause_index_by_number: Dict[str, ContractClause] = Field(default_factory=dict)
    all_clause_numbers: Set[str] = Field(default_factory=set)
    broken_cross_references: List[Tuple[str, str]] = Field(default_factory=list)


def classify_clause_taxonomy(text: str, heading: Optional[str] = None) -> str:
    """Classify a clause into standard legal taxonomy categories based on heading and text."""
    combined = f"{heading or ''} {text}".lower()
    for category, keywords in CLAUSE_TAXONOMY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return category
    return "GENERAL"


def detect_contract_title_and_type(document: ProcessedDocument) -> Tuple[Optional[str], str]:
    """Detect title and type of the contract from headers and leading elements."""
    title = document.metadata.title
    contract_type = "General Contract"

    # Inspect first few elements if metadata title is generic or missing
    candidates = []
    for el in document.elements[:5]:
        if el.element_type == ElementType.HEADING or (el.normalized_text and len(el.normalized_text) < 120 and el.normalized_text.isupper()):
            candidates.append(el.normalized_text)

    if candidates and not title:
        title = candidates[0]

    # Detect contract type
    sample_text = f"{title or ''} {document.raw_text[:2000]}".lower()
    for c_type, kws in CONTRACT_TYPE_KEYWORDS.items():
        if any(kw in sample_text for kw in kws):
            contract_type = c_type
            break

    return title, contract_type


class ClauseExtractor:
    """Extracts, categorizes, and maps cross-references across contract clauses."""

    def extract_clauses(self, document: ProcessedDocument) -> ClauseHierarchy:
        """Process a ProcessedDocument into a structured ClauseHierarchy."""
        title, c_type = detect_contract_title_and_type(document)

        extracted_clauses: List[ContractClause] = []
        clause_map: Dict[str, ContractClause] = {}
        all_numbers: Set[str] = set()

        for el in document.elements:
            # We index elements that are clauses, paragraphs with legal numbers, or substantive sections
            c_num = el.clause_number
            taxonomy = classify_clause_taxonomy(el.normalized_text, el.section_heading)

            # Extract outbound cross references
            x_refs = []
            for match in CROSS_REF_RE.finditer(el.normalized_text):
                full_match = f"{match.group(0).split()[0].title()} {match.group(1)}"
                x_refs.append(full_match)

            location = ClauseLocation(
                page=el.page_number,
                section=el.section_heading,
                clause_id=el.element_id,
                paragraph_number=el.paragraph_number,
            )

            clause_obj = ContractClause(
                clause_id=el.element_id,
                clause_number=c_num,
                title=el.clause_title or el.section_heading,
                taxonomy_category=taxonomy,
                raw_text=el.original_text,
                normalized_text=el.normalized_text,
                location=location,
                cross_references_outbound=list(dict.fromkeys(x_refs)),
            )

            extracted_clauses.append(clause_obj)
            if c_num:
                clause_map[c_num.lower()] = clause_obj
                all_numbers.add(c_num.lower())
                # Also index bare numbers, e.g. "1.1" if c_num is "Section 1.1"
                parts = c_num.split()
                if len(parts) > 1:
                    clause_map[parts[1].lower()] = clause_obj
                    all_numbers.add(parts[1].lower())

        # Check for broken cross references
        broken_refs: List[Tuple[str, str]] = []
        for c in extracted_clauses:
            for ref in c.cross_references_outbound:
                ref_lower = ref.lower()
                ref_bare = ref.split()[-1].lower() if len(ref.split()) > 1 else ref_lower
                # If neither the full ref nor the bare number exists in all_numbers
                if ref_lower not in all_numbers and ref_bare not in all_numbers:
                    # Filter out self-reference
                    if c.clause_number and (ref_lower in c.clause_number.lower() or ref_bare in c.clause_number.lower()):
                        continue
                    broken_refs.append((c.clause_number or c.clause_id, ref))

        return ClauseHierarchy(
            contract_title=title,
            contract_type=c_type,
            clauses=extracted_clauses,
            clause_index_by_number=clause_map,
            all_clause_numbers=all_numbers,
            broken_cross_references=broken_refs,
        )
