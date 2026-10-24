"""Legal citation extraction engine supporting case law, statutory, and constitutional citations."""

import re
import uuid
from typing import List, Optional, Tuple

from draftmate_ai.shared.document_models import ProcessedDocument, StructuralElement
from draftmate_ai.citation_verification.schemas import ExtractedCitation, CitationType
from draftmate_ai.citation_verification.citation_patterns import (
    SCC_PATTERN,
    AIR_PATTERN,
    INSC_PATTERN,
    SCC_ONLINE_PATTERN,
    SCR_PATTERN,
    DLT_PATTERN,
    CASE_NAME_PATTERN,
    STATUTORY_SECTION_PATTERN,
    CONSTITUTIONAL_ARTICLE_PATTERN,
    PINPOINT_PARA_PATTERN,
    PINPOINT_PAGE_PATTERN,
)
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def extract_associated_proposition(
    text: str,
    citation_start: int,
    citation_end: int,
    case_name: Optional[str] = None,
) -> str:
    """Extract the legal proposition statement associated with a citation within a sentence or paragraph."""
    # Mask period in legal abbreviations (v., vs., para., etc.) so sentence splitting remains robust
    masked_text = re.sub(r"\b(v|vs|para|p|art|sec|no|hon|ltd|inc|corp)\.\s+", r"\1_DOT_ ", text, flags=re.IGNORECASE)

    sentences = []
    curr = 0
    for match in re.finditer(r"(?<=[.!?])\s+", masked_text):
        s_end = match.start() + 1
        sentences.append((curr, s_end, text[curr:s_end]))
        curr = match.end()
    if curr < len(text):
        sentences.append((curr, len(text), text[curr:]))

    target_sentence = ""
    preceding_sentence = ""

    for s_start, s_end, s_text in sentences:
        if s_start <= citation_start < s_end or s_start < citation_end <= s_end:
            target_sentence = s_text
            break
        preceding_sentence = s_text

    if target_sentence:
        # Check explicit proposition indicators: "held that...", "established that..."
        held_m = re.search(r"(?:held|ruled|observed|established|reaffirmed|stated)\s+that\s+(.+)", target_sentence, re.IGNORECASE)
        if held_m:
            return held_m.group(1).strip().rstrip(".;,")

        # Strip case name and citation tokens to isolate the core substantive assertion
        cleaned = target_sentence
        if case_name:
            cleaned = cleaned.replace(case_name, " ")
        raw_cit = text[citation_start:citation_end]
        cleaned = cleaned.replace(raw_cit, " ")

        # Remove common pinpoint tokens: para 45, etc.
        cleaned = re.sub(r"\bpara(?:graph)?s?\.?\s*\d+\b", " ", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\[\s*\d+\s*\]", " ", cleaned)

        # Remove introductory or connecting prepositions
        cleaned = re.sub(r"^(?:in|see|see also|per|as held in|acknowledged|the parties acknowledge)\s+", "", cleaned.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+(?:in|at|under|pursuant to|see|para)$", "", cleaned.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"^[\,\;\:\s\-\.]+|[\,\;\:\s\-\.]+$", "", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned)

        if len(cleaned) > 8:
            return cleaned.strip()

    if preceding_sentence and len(preceding_sentence) > 15:
        return preceding_sentence.strip()

    return text.strip()


class CitationExtractor:
    """Extracts, categorizes, and contextualizes legal citations from documents."""

    def extract_from_text(
        self,
        text: str,
        document_id: Optional[str] = None,
        page_number: Optional[int] = None,
        element_id: Optional[str] = None,
    ) -> List[ExtractedCitation]:
        """Extract all legal citations from a string of text."""
        citations: List[ExtractedCitation] = []
        visited_spans: List[Tuple[int, int]] = []

        def _is_overlapping(start: int, end: int) -> bool:
            return any(not (end <= s or start >= e) for s, e in visited_spans)

        # 1. Statutory Sections (e.g. Section 9 of the Arbitration and Conciliation Act, 1996)
        for m in STATUTORY_SECTION_PATTERN.finditer(text):
            start, end = m.span()
            if _is_overlapping(start, end):
                continue
            visited_spans.append((start, end))

            sec_num = m.group(1).strip()
            statute_name = m.group(2).strip()
            prop = extract_associated_proposition(text, start, end)

            c_id = f"cit_{uuid.uuid4().hex[:8]}"
            citations.append(
                ExtractedCitation(
                    citation_id=c_id,
                    raw_citation=m.group(0).strip(),
                    citation_type=CitationType.STATUTE,
                    statute_name=statute_name,
                    section_number=sec_num,
                    associated_proposition=prop,
                    surrounding_text=text[max(0, start - 100): min(len(text), end + 100)],
                    start_char_idx=start,
                    end_char_idx=end,
                    document_id=document_id,
                    page_number=page_number,
                    clause_or_element_id=element_id,
                )
            )

        # 2. Constitutional Articles (e.g. Article 21 of the Constitution of India)
        for m in CONSTITUTIONAL_ARTICLE_PATTERN.finditer(text):
            start, end = m.span()
            if _is_overlapping(start, end):
                continue
            visited_spans.append((start, end))

            art_num = m.group(1).strip()
            prop = extract_associated_proposition(text, start, end)

            c_id = f"cit_{uuid.uuid4().hex[:8]}"
            citations.append(
                ExtractedCitation(
                    citation_id=c_id,
                    raw_citation=m.group(0).strip(),
                    citation_type=CitationType.CONSTITUTIONAL,
                    statute_name="Constitution of India",
                    section_number=f"Article {art_num}",
                    associated_proposition=prop,
                    surrounding_text=text[max(0, start - 100): min(len(text), end + 100)],
                    start_char_idx=start,
                    end_char_idx=end,
                    document_id=document_id,
                    page_number=page_number,
                    clause_or_element_id=element_id,
                )
            )

        # 3. Case Law Reporters (SCC, AIR, INSC, SCR, DLT, etc.)
        reporter_patterns = [
            ("SCC", SCC_PATTERN),
            ("AIR", AIR_PATTERN),
            ("INSC", INSC_PATTERN),
            ("SCC OnLine", SCC_ONLINE_PATTERN),
            ("SCR", SCR_PATTERN),
            ("DLT", DLT_PATTERN),
        ]

        for rep_name, pat in reporter_patterns:
            for m in pat.finditer(text):
                start, end = m.span()
                if _is_overlapping(start, end):
                    continue

                raw_cit = m.group(0).strip()
                groups = m.groups()

                year = None
                volume = None
                page = None
                court = "Supreme Court of India"

                if rep_name == "SCC":
                    # (YYYY) Vol SCC Page or YYYY (Vol) SCC Page
                    if groups[0]:
                        year = int(groups[0])
                        volume = groups[1] or "1"
                        page = groups[2]
                    elif groups[3]:
                        year = int(groups[3])
                        volume = groups[4]
                        page = groups[5]
                elif rep_name == "AIR":
                    # AIR YYYY Court Page
                    year = int(groups[0])
                    court = groups[1]
                    page = groups[2]
                elif rep_name == "INSC":
                    # YYYY INSC Number
                    year = int(groups[0])
                    page = groups[1]
                elif rep_name == "SCC OnLine":
                    year = int(groups[0])
                    court = groups[1]
                    page = groups[2]
                elif rep_name == "SCR":
                    if groups[0]:
                        year = int(groups[0])
                        volume = groups[1]
                        page = groups[2]
                    elif groups[3]:
                        year = int(groups[3])
                        volume = groups[4]
                        page = groups[5]
                elif rep_name == "DLT":
                    if groups[0]:
                        year = int(groups[0])
                        volume = groups[1]
                        page = groups[2]
                    elif groups[3]:
                        volume = groups[3]
                        year = int(groups[4])
                        page = groups[5]
                    court = "Delhi High Court"

                # Look backward up to 120 chars for Case Name: "Petitioner v. Respondent"
                prefix_window = text[max(0, start - 150):start]
                case_name = None
                petitioner = None
                respondent = None

                case_m = list(CASE_NAME_PATTERN.finditer(prefix_window))
                if case_m:
                    last_case = case_m[-1]
                    petitioner = last_case.group(1).strip().strip(",").strip("(")
                    respondent = last_case.group(2).strip().strip(",").strip(")")
                    case_name = f"{petitioner} v. {respondent}"

                # Look forward up to 60 chars for Pinpoint: "para 45" or "p. 12"
                suffix_window = text[end:min(len(text), end + 80)]
                pinpoint = None
                para_m = PINPOINT_PARA_PATTERN.search(suffix_window)
                if para_m:
                    pinpoint = f"para {para_m.group(1) or para_m.group(2)}"
                else:
                    page_m = PINPOINT_PAGE_PATTERN.search(suffix_window)
                    if page_m:
                        pinpoint = f"page {page_m.group(1)}"

                # Also expand raw_citation to include case name if immediately adjacent
                full_raw = raw_cit
                if case_name:
                    full_raw = f"{case_name}, {raw_cit}"
                if pinpoint:
                    full_raw = f"{full_raw}, {pinpoint}"

                visited_spans.append((start, end))
                prop = extract_associated_proposition(text, start, end, case_name=case_name)

                c_id = f"cit_{uuid.uuid4().hex[:8]}"
                citations.append(
                    ExtractedCitation(
                        citation_id=c_id,
                        raw_citation=full_raw,
                        citation_type=CitationType.CASE_LAW,
                        case_name=case_name,
                        petitioner=petitioner,
                        respondent=respondent,
                        court=court,
                        reporter=rep_name,
                        volume=str(volume) if volume else None,
                        page=str(page) if page else None,
                        year=year,
                        pinpoint=pinpoint,
                        associated_proposition=prop,
                        surrounding_text=text[max(0, start - 100): min(len(text), end + 100)],
                        start_char_idx=start,
                        end_char_idx=end,
                        document_id=document_id,
                        page_number=page_number,
                        clause_or_element_id=element_id,
                    )
                )

        return citations

    def extract_from_document(self, document: ProcessedDocument) -> List[ExtractedCitation]:
        """Extract citations across all structural elements of a ProcessedDocument."""
        all_citations: List[ExtractedCitation] = []
        for el in document.elements:
            cits = self.extract_from_text(
                text=el.original_text,
                document_id=document.document_id,
                page_number=el.page_number,
                element_id=el.element_id,
            )
            all_citations.extend(cits)
        return all_citations

