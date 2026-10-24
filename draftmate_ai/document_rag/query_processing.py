"""Legal query processing, clause reference extraction, and query expansion engine."""

import re
from typing import List, Optional, Set
from pydantic import BaseModel, Field

from draftmate_ai.document_rag.schemas import RetrievalFilter

LEGAL_ACRONYMS = {
    "nda": ["non-disclosure", "confidentiality", "proprietary"],
    "msa": ["master services agreement", "services agreement", "contract"],
    "ip": ["intellectual property", "patent", "copyright", "trademark"],
    "sla": ["service level agreement", "uptime", "performance standard"],
    "dpa": ["data processing agreement", "gdpr", "personal data"],
    "liability": ["indemnification", "damages", "limitation of liability", "hold harmless"],
    "termination": ["term", "expiration", "cancellation", "default"],
    "payment": ["invoicing", "fees", "compensation", "due date"],
}

CLAUSE_QUERY_RE = re.compile(
    r"\b(?:Section|Article|Clause)\s+([0-9A-ZIVXLCDM]+(?:\.[0-9A-Za-z]+)*)\b",
    re.IGNORECASE,
)

STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by", "of",
    "is", "are", "was", "were", "what", "which", "who", "when", "where", "how", "does",
    "do", "can", "could", "should", "would", "tell", "me", "about", "show", "give",
}


class ProcessedQuery(BaseModel):
    """Normalized query representation with extracted entities and search tokens."""
    raw_query: str
    clean_query: str
    expanded_query: str
    extracted_clauses: List[str] = Field(default_factory=list)
    lexical_tokens: List[str] = Field(default_factory=list)
    query_type: str = "factual"  # "clause_lookup", "definition", "factual", "comparison"
    inferred_filter: Optional[RetrievalFilter] = None


class LegalQueryProcessor:
    """Processes incoming legal questions to optimize dense and lexical retrieval."""

    def __init__(self, expand_acronyms: bool = True):
        self.expand_acronyms = expand_acronyms

    def process(self, query: str) -> ProcessedQuery:
        """Analyze, expand, and structure a raw query."""
        clean = query.strip()
        lower = clean.lower()

        # 1. Extract explicit clause references
        clauses = []
        for match in CLAUSE_QUERY_RE.finditer(clean):
            clause_token = f"{match.group(0).split()[0].title()} {match.group(1)}"
            clauses.append(clause_token)

        # 2. Identify query intent/type
        q_type = "factual"
        if clauses:
            q_type = "clause_lookup"
        elif any(w in lower for w in ["mean", "define", "definition", "what is"]):
            q_type = "definition"
        elif any(w in lower for w in ["compare", "difference", "versus", "vs"]):
            q_type = "comparison"

        # 3. Expand acronyms and legal terms
        words = re.findall(r"\b[A-Za-z0-9\-\.]+\b", lower)
        expanded_terms = []
        if self.expand_acronyms:
            for w in words:
                if w in LEGAL_ACRONYMS:
                    expanded_terms.extend(LEGAL_ACRONYMS[w])

        expanded_query_str = clean
        if expanded_terms:
            expanded_query_str = f"{clean} {' '.join(expanded_terms)}"

        # 4. Tokenize for lexical BM25 matching
        tokens = [w for w in words if w not in STOPWORDS and len(w) > 1]
        tokens.extend([t.lower() for t in expanded_terms])

        # 5. Build inferred filter if clause is explicitly requested
        inferred_filter = None
        if clauses:
            inferred_filter = RetrievalFilter(clause_numbers=clauses)

        return ProcessedQuery(
            raw_query=query,
            clean_query=clean,
            expanded_query=expanded_query_str,
            extracted_clauses=clauses,
            lexical_tokens=list(dict.fromkeys(tokens)),  # preserve order & deduplicate
            query_type=q_type,
            inferred_filter=inferred_filter,
        )

