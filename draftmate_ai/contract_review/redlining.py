"""Genuine text-diff engine, change tracking, and document reconstruction."""

import difflib
import uuid
import io
import re
from typing import List, Dict, Optional, Tuple

import docx
from docx.shared import RGBColor

from draftmate_ai.contract_review.schemas import RedlineChange, ChangeType, ReviewStatus, Finding
from draftmate_ai.shared.document_models import ProcessedDocument
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def compute_text_diff_operations(original: str, proposed: str) -> List[Tuple[str, str, str]]:
    """Compute word/token-level diff operations between original and proposed text.

    Returns:
        List of (tag, original_segment, proposed_segment) where tag in ('equal', 'replace', 'delete', 'insert').
    """
    orig_words = original.split(" ")
    prop_words = proposed.split(" ")

    matcher = difflib.SequenceMatcher(None, orig_words, prop_words)
    ops: List[Tuple[str, str, str]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        orig_part = " ".join(orig_words[i1:i2])
        prop_part = " ".join(prop_words[j1:j2])
        ops.append((tag, orig_part, prop_part))

    return ops


class RedlineEngine:
    """Manages proposed text revisions, interactive accept/reject workflow, and document reconstruction."""

    def __init__(self, original_text: str, document_id: str = "doc_revised"):
        self.original_text = original_text
        self.document_id = document_id
        self.changes: List[RedlineChange] = []
        self._change_index: Dict[str, RedlineChange] = {}
        self.version: int = 1

    def create_change_from_finding(self, finding: Finding) -> Optional[RedlineChange]:
        """Convert a Finding with suggested_revision into an active RedlineChange."""
        if not finding.suggested_revision or finding.original_text == "[Entire Agreement - Provision Absent]":
            return None

        # Verify finding.original_text exists in original_text
        start_idx = self.original_text.find(finding.original_text)
        end_idx = start_idx + len(finding.original_text) if start_idx != -1 else None

        change_type = ChangeType.REPLACEMENT
        if not finding.suggested_revision.strip():
            change_type = ChangeType.DELETION
        elif not finding.original_text.strip():
            change_type = ChangeType.INSERTION

        c_id = f"chg_{uuid.uuid4().hex[:8]}"
        change = RedlineChange(
            change_id=c_id,
            finding_id=finding.finding_id,
            clause_number=finding.location.clause_id,
            change_type=change_type,
            original_text=finding.original_text,
            proposed_text=finding.suggested_revision,
            status=ReviewStatus.PENDING,
            start_char_idx=start_idx if start_idx != -1 else None,
            end_char_idx=end_idx,
            rationale=finding.rationale or finding.explanation,
        )

        self.changes.append(change)
        self._change_index[c_id] = change
        return change

    def accept_change(self, change_id: str) -> bool:
        """Mark a change as ACCEPTED."""
        if change_id in self._change_index:
            self._change_index[change_id].status = ReviewStatus.ACCEPTED
            self.version += 1
            return True
        return False

    def reject_change(self, change_id: str) -> bool:
        """Mark a change as REJECTED."""
        if change_id in self._change_index:
            self._change_index[change_id].status = ReviewStatus.REJECTED
            self.version += 1
            return True
        return False

    def accept_all(self) -> None:
        """Accept all pending changes."""
        for c in self.changes:
            c.status = ReviewStatus.ACCEPTED
        self.version += 1

    def reject_all(self) -> None:
        """Reject all pending changes."""
        for c in self.changes:
            c.status = ReviewStatus.REJECTED
        self.version += 1

    def reconstruct_document(self, mode: str = "revised") -> str:
        """Reconstruct document text according to revision statuses.

        Args:
            mode:
                - 'revised': Applies all ACCEPTED changes.
                - 'original': Verbatim original document.
                - 'markup': Formatted markup with deletions [-...-] and additions [+...+].

        Returns:
            Reconstructed document string.
        """
        if mode == "original":
            return self.original_text

        # Identify applicable changes
        applicable_changes = [c for c in self.changes if (c.status == ReviewStatus.ACCEPTED or mode == "markup")]

        # Sort changes by their appearance order in original text
        sorted_changes = [
            c for c in applicable_changes
            if c.start_char_idx is not None and c.start_char_idx != -1
        ]
        sorted_changes.sort(key=lambda x: x.start_char_idx)

        # Apply sequential non-overlapping replacements
        result_parts = []
        last_idx = 0

        for c in sorted_changes:
            if c.start_char_idx < last_idx:
                # Overlapping change; skip to avoid corruption
                logger.warning(f"Skipping overlapping change {c.change_id}")
                continue

            # Append unchanged text preceding this change
            result_parts.append(self.original_text[last_idx:c.start_char_idx])

            if mode == "revised":
                if c.status == ReviewStatus.ACCEPTED:
                    result_parts.append(c.proposed_text)
                else:
                    result_parts.append(c.original_text)
            elif mode == "markup":
                if c.change_type == ChangeType.DELETION:
                    result_parts.append(f"[-{c.original_text}-]")
                elif c.change_type == ChangeType.INSERTION:
                    result_parts.append(f"[+{c.proposed_text}+]")
                else:
                    result_parts.append(f"[-{c.original_text}-][+{c.proposed_text}+]")

            last_idx = c.end_char_idx

        # Append trailing text
        result_parts.append(self.original_text[last_idx:])
        return "".join(result_parts)

    def export_to_docx(self, mode: str = "markup") -> bytes:
        """Export redlined document to DOCX bytes with strikethrough and underline styling."""
        doc = docx.Document()
        text = self.reconstruct_document(mode=mode)

        paragraphs = text.split("\n\n")
        for p_text in paragraphs:
            if not p_text.strip():
                continue

            p = doc.add_paragraph()
            if mode == "markup":
                # Parse [-deleted-] and [+inserted+] tokens
                tokens = re.split(r"(\[\-.*?\-\]|\[\+.*?\+\])", p_text)
                for tok in tokens:
                    if tok.startswith("[-") and tok.endswith("-]"):
                        # Strikethrough deletion (Red)
                        del_text = tok[2:-2]
                        run = p.add_run(del_text)
                        run.font.strike = True
                        run.font.color.rgb = RGBColor(180, 0, 0)
                    elif tok.startswith("[+") and tok.endswith("+]"):
                        # Underline insertion (Blue)
                        ins_text = tok[2:-2]
                        run = p.add_run(ins_text)
                        run.font.underline = True
                        run.font.color.rgb = RGBColor(0, 50, 180)
                    else:
                        p.add_run(tok)
            else:
                p.add_run(p_text)

        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()
