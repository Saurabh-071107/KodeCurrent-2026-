"""Proposition support verification: compares legal assertions against source judgment text."""

import re
from typing import Tuple, List, Optional

from draftmate_ai.citation_verification.schemas import (
    AuthorityRecord,
    PropositionSupportStatus,
)


def split_into_candidate_passages(authority: AuthorityRecord) -> List[Tuple[str, str]]:
    """Extract candidate passages with locations from authority record.

    Returns:
        List of (location_label, passage_text)
    """
    passages: List[Tuple[str, str]] = []

    # 1. Add paragraphs if available
    for p_id, p_text in authority.paragraphs.items():
        passages.append((f"Paragraph {p_id}", p_text))

    # 2. Add headnotes
    for idx, hn in enumerate(authority.headnotes, 1):
        passages.append((f"Headnote {idx}", hn))

    # 3. Add full text sentences if paragraphs were sparse
    if authority.full_text and len(passages) < 3:
        sentences = re.split(r"(?<=[.!?])\s+", authority.full_text)
        for idx, s in enumerate(sentences, 1):
            if len(s.strip()) > 20:
                passages.append((f"Judgment Text (Excerpt {idx})", s.strip()))

    return passages


class PropositionSupportVerifier:
    """Verifies whether an authority genuinely supports a proposition attributed to it in a document."""

    def verify_proposition(
        self,
        proposition: Optional[str],
        authority: Optional[AuthorityRecord],
    ) -> Tuple[PropositionSupportStatus, List[str], str]:
        """Evaluate proposition support against source authority text.

        Returns:
            (status, supporting_excerpts, explanation)
        """
        if authority is None or (not authority.full_text and not authority.paragraphs and not authority.headnotes):
            return (
                PropositionSupportStatus.INSUFFICIENT_EVIDENCE,
                [],
                "Source judgment text is inaccessible or empty; cannot verify proposition.",
            )

        if not proposition or len(proposition.strip()) < 5:
            return (
                PropositionSupportStatus.INSUFFICIENT_EVIDENCE,
                [],
                "No substantive legal proposition was attributed to this citation.",
            )

        clean_prop = proposition.strip()
        prop_tokens = set(re.findall(r"\w+", clean_prop.lower()))
        stop = {
            "the", "a", "an", "is", "was", "are", "were", "of", "in", "to", "and", "or",
            "that", "this", "it", "held", "court", "supreme", "by", "under", "for", "with",
        }
        key_tokens = prop_tokens - stop
        if not key_tokens:
            key_tokens = prop_tokens

        passages = split_into_candidate_passages(authority)
        if not passages:
            return (
                PropositionSupportStatus.INSUFFICIENT_EVIDENCE,
                [],
                "No textual passages available in authority record for comparison.",
            )

        # Score passages by token overlap & length normalization
        scored_passages: List[Tuple[float, str, str]] = []
        for loc, p_text in passages:
            p_tokens = set(re.findall(r"\w+", p_text.lower()))
            overlap = key_tokens.intersection(p_tokens)
            score = len(overlap) / max(len(key_tokens), 1)
            scored_passages.append((score, loc, p_text))

        scored_passages.sort(key=lambda x: x[0], reverse=True)
        top_passages = scored_passages[:3]

        best_score, best_loc, best_text = top_passages[0]

        # Check for direct contradictions (e.g., negative statements, polar opposite assertions)
        contradiction_patterns = [
            (r"\b(?:not\s+a\s+power|no\s+power|cannot|does\s+not\s+have\s+power|prohibited)\b", r"\b(?:unlimited\s+power|has\s+power|can|permitted)\b"),
            (r"\b(?:unconstitutional|void|invalid)\b", r"\b(?:constitutional|valid|upheld)\b"),
            (r"\b(?:not\s+protected)\b", r"\b(?:protected|fundamental\s+right)\b"),
            (r"\b(?:cannot)\b", r"\b(?:can)\b"),
            (r"\b(?:inviolable)\b", r"\b(?:amendable|destroyable)\b"),
            (r"\b(?:not\s+to\s+be\s+given|not\s+recoverable|no\s+compensation)\b", r"\b(?:recoverable|entitled\s+to|shall\s+receive)\b"),
        ]
        is_contradicted = False
        prop_lower = clean_prop.lower()
        best_lower = best_text.lower()

        for pat1, pat2 in contradiction_patterns:
            m1_prop = bool(re.search(pat1, prop_lower))
            m2_best = bool(re.search(pat2, best_lower))
            m2_prop = bool(re.search(pat2, prop_lower))
            m1_best = bool(re.search(pat1, best_lower))

            if (m1_prop and m2_best and not m1_best) or (m2_prop and m1_best and not m2_best):
                if best_score >= 0.35:
                    is_contradicted = True
                    break

        if is_contradicted:
            return (
                PropositionSupportStatus.CONTRADICTED,
                [f"[{best_loc}] {best_text}"],
                (
                    f"Direct contradiction detected: the proposition asserts '{clean_prop}', "
                    f"whereas the cited authority states in {best_loc}: '{best_text}'."
                ),
            )

        # Classification thresholds
        if best_score >= 0.45:
            # Substantial overlap
            status = PropositionSupportStatus.SUPPORTED
            explanation = (
                f"Proposition is supported by authoritative source text in {best_loc} "
                f"(concept overlap: {best_score * 100:.0f}%)."
            )
            excerpts = [f"[{loc}] {txt}" for sc, loc, txt in top_passages if sc >= 0.25]
        elif best_score >= 0.25:
            # Partial overlap
            status = PropositionSupportStatus.PARTIALLY_SUPPORTED
            explanation = (
                f"Proposition is partially supported by {best_loc}. The authority discusses related principles, "
                f"but the exact proposition phrasing or scope diverges."
            )
            excerpts = [f"[{best_loc}] {best_text}"]
        else:
            # Little or no overlap
            status = PropositionSupportStatus.UNSUPPORTED
            explanation = (
                f"Proposition '{clean_prop[:70]}...' is not supported by the cited authority text "
                f"(highest concept overlap was only {best_score * 100:.0f}% in {best_loc})."
            )
            excerpts = []

        return status, excerpts, explanation

