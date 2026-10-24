"""Tests for structure parser, legal clause patterns, and text normalization."""

import pytest
from draftmate_ai.document_processing.structure_parser import (
    StructureParser,
    detect_clause_info,
    is_heading_candidate,
    normalize_text,
)
from draftmate_ai.shared.document_models import ElementType


def test_detect_clause_info_articles_and_sections():
    """Test clause regex detection for Article and Section patterns."""
    c_num, title, body = detect_clause_info("ARTICLE III - INDEMNIFICATION AND WARRANTIES")
    assert c_num == "Article III"
    assert "INDEMNIFICATION" in (title or "")

    c_num, title, body = detect_clause_info("Section 4.01 Governing Law. This Agreement shall be governed by Delaware law.")
    assert "Section 4.01" in (c_num or "")
    assert "Governing Law" in (title or "")

    c_num, title, body = detect_clause_info("1.2.3 Technical Specifications")
    assert c_num == "1.2.3"
    assert "Technical Specifications" in (title or "")

    c_num, title, body = detect_clause_info("(a) The Lessee shall pay on the first day of each month.")
    assert c_num == "(a)"
    assert "Lessee shall pay" in (body or "")


def test_is_heading_candidate():
    """Test heading heuristics based on font size, uppercase, and markdown."""
    is_h, level = is_heading_candidate("TERMS AND CONDITIONS", font_size=18.0, avg_font_size=11.0)
    assert is_h is True
    assert level <= 2

    is_h, level = is_heading_candidate("# Heading Level 1")
    assert is_h is True
    assert level == 1

    is_h, level = is_heading_candidate("Just a regular narrative sentence that goes on without being a heading.")
    assert is_h is False


def test_normalize_text_preserves_semantics():
    """Test that normalize_text handles smart quotes, dashes, non-breaking spaces, and excess spaces."""
    raw = "Section\u00a01.1   “Proprietary—Information”  shall   be\r\nkept\tsecure."
    norm = normalize_text(raw)

    assert "Section 1.1" in norm
    assert '"Proprietary-Information"' in norm
    assert "   " not in norm
    assert "\r\n" not in norm


def test_structure_parser_elements_classification():
    """Test that StructureParser correctly classifies element types and maintains hierarchy."""
    parser = StructureParser()

    h_elem = parser.parse_raw_element(raw_text="ARTICLE 1. DEFINITIONS", font_size=18.0)
    assert h_elem.element_type == ElementType.HEADING
    assert h_elem.section_heading == "ARTICLE 1. DEFINITIONS"

    c_elem = parser.parse_raw_element(raw_text="Section 1.1 Confidential Information means proprietary data.")
    assert c_elem.element_type == ElementType.CLAUSE
    assert c_elem.clause_number is not None
    assert c_elem.section_heading == "ARTICLE 1. DEFINITIONS"

    p_elem = parser.parse_raw_element(raw_text="This is an ordinary explanatory paragraph within the clause.")
    assert p_elem.element_type == ElementType.PARAGRAPH
    assert p_elem.paragraph_number == 2
    assert p_elem.clause_number == c_elem.clause_number

