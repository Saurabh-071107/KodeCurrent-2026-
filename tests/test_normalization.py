"""Tests for legal citation and party name normalization."""

import pytest
from draftmate_ai.citation_verification.normalization import (
    normalize_party_name,
    normalize_case_title,
    normalize_reporter,
    normalize_court_name,
    build_canonical_citation_string,
    normalize_citation,
)
from draftmate_ai.citation_verification.schemas import ExtractedCitation, CitationType


def test_normalize_party_abbreviations():
    assert normalize_party_name("UOI") == "Union of India"
    assert normalize_party_name("U.O.I.") == "Union of India"
    assert normalize_party_name("Govt. of NCT of Delhi") == "Government of NCT of Delhi"
    assert normalize_party_name("State of Kerala & Ors.") == "State of Kerala & Ors."


def test_normalize_case_title_versus_token():
    title1, pet1, resp1 = normalize_case_title("Kesavananda Bharati vs. State of Kerala")
    assert title1 == "Kesavananda Bharati v. State of Kerala"
    assert pet1 == "Kesavananda Bharati"
    assert resp1 == "State of Kerala"

    title2, pet2, resp2 = normalize_case_title("Maneka Gandhi versus UOI")
    assert title2 == "Maneka Gandhi v. Union of India"
    assert pet2 == "Maneka Gandhi"
    assert resp2 == "Union of India"


def test_normalize_reporter_and_court():
    assert normalize_reporter("s.c.c.") == "SCC"
    assert normalize_reporter("Supreme Court Cases") == "SCC"
    assert normalize_reporter("A.I.R.") == "AIR"
    assert normalize_reporter("All India Reporter") == "AIR"
    assert normalize_reporter("dlt") == "DLT"

    assert normalize_court_name("sc") == "Supreme Court of India"
    assert normalize_court_name("del") == "Delhi High Court"
    assert normalize_court_name("bom") == "Bombay High Court"


def test_build_canonical_citation_string():
    assert build_canonical_citation_string("scc", 1973, "4", "225") == "(1973) 4 SCC 225"
    assert build_canonical_citation_string("air", 1978, page="597", court_code="sc") == "AIR 1978 SC 597"
    assert build_canonical_citation_string("insc", 2023, page="582") == "2023 INSC 582"


def test_normalize_extracted_citation_model():
    extracted = ExtractedCitation(
        citation_id="cit_100",
        raw_citation="Kesavananda Bharati vs State of Kerala (1973) 4 SCC 225, [45]",
        citation_type=CitationType.CASE_LAW,
        case_name="Kesavananda Bharati vs State of Kerala",
        reporter="s.c.c.",
        volume="4",
        page="225",
        year=1973,
        pinpoint="[45]",
    )

    norm = normalize_citation(extracted)
    assert norm.canonical_citation == "(1973) 4 SCC 225"
    assert norm.canonical_case_name == "Kesavananda Bharati v. State of Kerala"
    assert norm.standard_reporter == "SCC"
    assert norm.pinpoint_normalized == "para 45"

