"""Pinpoint verification dimension: verifies referenced paragraphs or page numbers in judgments."""

import re
from typing import Tuple, Optional, List

from draftmate_ai.citation_verification.schemas import (
    ExtractedCitation,
    AuthorityRecord,
    PinpointAccuracyStatus,
)


class PinpointVerifier:
    """Verifies whether pinpoint paragraph or page numbers exist in the judgment and support the referenced proposition."""

    def verify_pinpoint(
        self,
        extracted: ExtractedCitation,
        authority: Optional[AuthorityRecord],
    ) -> Tuple[PinpointAccuracyStatus, str, Optional[str]]:
        """Verify the specific paragraph or page reference.

        Returns:
            (status, explanation, excerpt_text)
        """
        if not extracted.pinpoint:
            return PinpointAccuracyStatus.NOT_SPECIFIED, "No pinpoint paragraph or page was cited.", None

        if authority is None or not authority.paragraphs:
            return (
                PinpointAccuracyStatus.PAGE_NOT_FOUND,
                f"Cannot verify pinpoint '{extracted.pinpoint}': paragraph breakdown unavailable in authority record.",
                None,
            )

        # Extract numeric target: e.g. "para 45" -> "45"
        m = re.search(r"(\d+)", extracted.pinpoint)
        if not m:
            return PinpointAccuracyStatus.NOT_SPECIFIED, f"Could not parse numeric target from pinpoint '{extracted.pinpoint}'.", None

        target_num = m.group(1)

        # Look for target_num in authority paragraphs
        if target_num not in authority.paragraphs:
            # Check near keys
            return (
                PinpointAccuracyStatus.PAGE_NOT_FOUND,
                f"Referenced paragraph/page '{target_num}' does not exist in the official judgment text (available paragraphs: {', '.join(list(authority.paragraphs.keys())[:5])}...).",
                None,
            )

        para_text = authority.paragraphs[target_num]

        # Check if the text in target_num supports the associated proposition
        if extracted.associated_proposition:
            prop_words = set(re.findall(r"\w+", extracted.associated_proposition.lower()))
            stop = {"the", "a", "an", "is", "of", "and", "in", "to", "that", "this", "it", "held", "court"}
            prop_key = prop_words - stop

            para_words = set(re.findall(r"\w+", para_text.lower()))
            common = prop_key.intersection(para_words)

            if len(common) >= 2 or (len(prop_key) <= 3 and len(common) >= 1):
                return (
                    PinpointAccuracyStatus.VERIFIED,
                    f"Pinpoint paragraph '{target_num}' verified: text directly corroborates the referenced proposition.",
                    para_text,
                )
            else:
                return (
                    PinpointAccuracyStatus.PAGE_EXISTS_NO_SUPPORT,
                    f"Paragraph '{target_num}' exists in the judgment, but its text does not appear to support the proposition '{extracted.associated_proposition[:60]}...'.",
                    para_text,
                )

        # If no proposition specified, the paragraph exists
        return PinpointAccuracyStatus.VERIFIED, f"Paragraph '{target_num}' exists in the authentic judgment text.", para_text

