"""Canonical normalization of case titles, reporter designations, and legal citations."""

import re
from typing import Optional, Tuple
from draftmate_ai.citation_verification.schemas import NormalizedCitation, ExtractedCitation

# Standard reporter normalizations
REPORTER_MAP = {
    "scc": "SCC",
    "s.c.c.": "SCC",
    "supreme court cases": "SCC",
    "air": "AIR",
    "a.i.r.": "AIR",
    "all india reporter": "AIR",
    "scr": "SCR",
    "s.c.r.": "SCR",
    "supreme court reports": "SCR",
    "dlt": "DLT",
    "d.l.t.": "DLT",
    "delhi law times": "DLT",
    "insc": "INSC",
    "scc online": "SCC OnLine",
    "cri lj": "Cri LJ",
    "cr lj": "Cri LJ",
    "bom lr": "Bom LR",
}

# Court code normalizations
COURT_MAP = {
    "sc": "Supreme Court of India",
    "s.c.": "Supreme Court of India",
    "supreme court": "Supreme Court of India",
    "del": "Delhi High Court",
    "delhi": "Delhi High Court",
    "bom": "Bombay High Court",
    "bombay": "Bombay High Court",
    "cal": "Calcutta High Court",
    "calcutta": "Calcutta High Court",
    "mad": "Madras High Court",
    "madras": "Madras High Court",
    "all": "Allahabad High Court",
    "allahabad": "Allahabad High Court",
}

# Party abbreviation normalizations
PARTY_ABBREVIATIONS = {
    r"\buoi\b": "Union of India",
    r"\bu\.o\.i\.\b": "Union of India",
    r"\bgovt\b": "Government",
    r"\bgovt\.\b": "Government",
    r"\bsec\b": "Secretary",
    r"\bsec\.\b": "Secretary",
    r"\banr\b": "& Anr.",
    r"\banr\.\b": "& Anr.",
    r"\bors\b": "& Ors.",
    r"\bors\.\b": "& Ors.",
}


def normalize_party_name(party: str) -> str:
    """Normalize a single party name, expanding standard legal abbreviations."""
    if not party:
        return ""
    text = party.strip()
    # Strip leading quotes/punctuation
    text = re.sub(r"^[\"\'\s\,\.]+", "", text)

    # Standardize UOI, Govt, etc.
    text = re.sub(r"\bu\.?o\.?i\.(?=\s|$)", "Union of India", text, flags=re.IGNORECASE)
    text = re.sub(r"\buoi\b", "Union of India", text, flags=re.IGNORECASE)
    text = re.sub(r"\bgovt(?:\.|\b)", "Government", text, flags=re.IGNORECASE)
    text = re.sub(r"\bsec(?:\.|\b)", "Secretary", text, flags=re.IGNORECASE)

    # Standardize & Ors. / & Anr.
    text = re.sub(r"(?:&|\band\b)?\s*\bors(?:\.|\b)", "& Ors.", text, flags=re.IGNORECASE)
    text = re.sub(r"(?:&|\band\b)?\s*\banr(?:\.|\b)", "& Anr.", text, flags=re.IGNORECASE)

    # Strip trailing quotes/punctuation unless ending in Ors. or Anr.
    if not (text.endswith("Ors.") or text.endswith("Anr.")):
        text = re.sub(r"[\"\'\s\,\.]+$", "", text)

    # Normalize inner spaces
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_case_title(case_name: str) -> Tuple[str, Optional[str], Optional[str]]:
    """Normalize full case name and extract cleaned (Petitioner, Respondent).

    Returns:
        (canonical_case_name, petitioner, respondent)
    """
    if not case_name:
        return "", None, None

    # Standardize versus token to 'v.'
    v_match = re.search(r"\s+(?:v\.|vs\.|vs|v\/s|v|versus)\s+", case_name, re.IGNORECASE)
    if v_match:
        pet_raw = case_name[:v_match.start()]
        resp_raw = case_name[v_match.end():]
        pet = normalize_party_name(pet_raw)
        resp = normalize_party_name(resp_raw)
        canonical = f"{pet} v. {resp}"
        return canonical, pet, resp

    cleaned = normalize_party_name(case_name)
    return cleaned, cleaned, None


def normalize_court_name(court_token: Optional[str]) -> str:
    """Normalize court identifier to official long name."""
    if not court_token:
        return "Supreme Court of India"
    token = court_token.lower().strip().replace(".", "")
    return COURT_MAP.get(token, COURT_MAP.get(court_token.lower().strip(), court_token.strip()))


def normalize_reporter(reporter_token: Optional[str]) -> str:
    """Standardize reporter acronym."""
    if not reporter_token:
        return ""
    token = reporter_token.lower().strip().replace(".", "")
    return REPORTER_MAP.get(token, REPORTER_MAP.get(reporter_token.lower().strip(), reporter_token.strip().upper()))


def build_canonical_citation_string(
    reporter: Optional[str],
    year: Optional[int],
    volume: Optional[str] = None,
    page: Optional[str] = None,
    court_code: Optional[str] = None,
    raw_citation: str = "",
) -> str:
    """Construct deterministic canonical citation string from components."""
    rep = normalize_reporter(reporter)
    if rep == "SCC" and year and page:
        vol = volume if volume else "1"
        return f"({year}) {vol} SCC {page}"
    elif rep == "AIR" and year and page:
        crt = court_code.upper() if court_code else "SC"
        return f"AIR {year} {crt} {page}"
    elif rep == "INSC" and year and page:
        return f"{year} INSC {page}"
    elif rep == "SCR" and year and page:
        vol = f"{volume} " if volume else ""
        return f"[{year}] {vol}SCR {page}"
    elif rep == "DLT" and year and page:
        vol = volume if volume else "1"
        return f"({year}) {vol} DLT {page}"

    # Fallback to normalized raw text
    return re.sub(r"\s+", " ", raw_citation.strip())


def normalize_citation(extracted: ExtractedCitation) -> NormalizedCitation:
    """Convert an ExtractedCitation into its canonical NormalizedCitation model."""
    canonical_title, pet, resp = normalize_case_title(extracted.case_name or "")

    canonical_cit_str = build_canonical_citation_string(
        reporter=extracted.reporter,
        year=extracted.year,
        volume=extracted.volume,
        page=extracted.page,
        court_code=extracted.court,
        raw_citation=extracted.raw_citation,
    )

    pinpoint_norm = None
    if extracted.pinpoint:
        p_clean = extracted.pinpoint.strip()
        # Normalize "para 45" or "[45]"
        para_m = re.search(r"(\d+)", p_clean)
        if para_m:
            pinpoint_norm = f"para {para_m.group(1)}"
        else:
            pinpoint_norm = p_clean

    return NormalizedCitation(
        canonical_citation=canonical_cit_str,
        canonical_case_name=canonical_title if canonical_title else None,
        petitioner_normalized=pet,
        respondent_normalized=resp,
        normalized_court=normalize_court_name(extracted.court),
        standard_reporter=normalize_reporter(extracted.reporter),
        year=extracted.year,
        volume=extracted.volume,
        page=extracted.page,
        pinpoint_normalized=pinpoint_norm,
        statute_canonical=extracted.statute_name.strip() if extracted.statute_name else None,
        section_canonical=extracted.section_number.strip() if extracted.section_number else None,
    )

