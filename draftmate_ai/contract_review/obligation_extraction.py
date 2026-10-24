"""Obligation, covenant, condition, and exception extraction."""

import re
import uuid
from typing import List, Tuple, Optional
from pydantic import BaseModel, Field

from draftmate_ai.shared.document_models import ProcessedDocument, StructuralElement
from draftmate_ai.contract_review.schemas import ExtractedObligation
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Modality regex: "shall", "must", "will", "shall not", "agrees to"
MODALITY_RE = re.compile(
    r"\b([A-Z][A-Za-z0-9\s\,\'\"]+?)\s+(shall\s+not|must\s+not|may\s+not|shall|must|agrees\s+to|covenants\s+to|will)\s+([^.;]+)",
    re.IGNORECASE,
)

# Conditional markers
CONDITION_RE = re.compile(
    r"\b(provided\s+that|subject\s+to|in\s+the\s+event\s+(?:that)?|only\s+if|unless|conditioned\s+upon)\s+([^,.;]+)",
    re.IGNORECASE,
)

# Exception markers
EXCEPTION_RE = re.compile(
    r"\b(except\s+that|provided\s+however|notwithstanding\s+anything\s+to\s+the\s+contrary|excluding|with\s+the\s+exception\s+of)\s+([^,.;]+)",
    re.IGNORECASE,
)


class ObligationExtractor:
    """Extracts explicit positive obligations, negative covenants, and attached conditions."""

    def extract_obligations(self, document: ProcessedDocument) -> List[ExtractedObligation]:
        """Parse all elements in document to extract structured contractual obligations."""
        obligations: List[ExtractedObligation] = []

        for el in document.elements:
            text = el.normalized_text
            if not text:
                continue

            for match in MODALITY_RE.finditer(text):
                raw_obligor = match.group(1).strip()
                modality = match.group(2).lower().strip()
                action = match.group(3).strip()

                # Filter out preamble noise or overly long obligor text
                if len(raw_obligor.split()) > 7 or len(action.split()) < 2:
                    continue

                # Check if sentence has conditional clauses
                cond_match = CONDITION_RE.search(text)
                is_conditional = cond_match is not None
                condition_text = cond_match.group(0).strip() if cond_match else None

                ob_id = f"ob_{uuid.uuid4().hex[:8]}"

                obligations.append(
                    ExtractedObligation(
                        obligation_id=ob_id,
                        clause_number=el.clause_number,
                        obligor=raw_obligor,
                        action=action,
                        modality=modality,
                        is_conditional=is_conditional,
                        condition_text=condition_text,
                        original_text=el.original_text,
                    )
                )

        return obligations

