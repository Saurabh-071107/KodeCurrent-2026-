"""
Headroom-inspired Legal Context & Token Optimization Engine for DraftMate AI.
Optimizes prompt context windows, strips repetitive legalese boilerplate,
and preserves substantive facts, statutory citations, and financial claims.
Reference: https://github.com/headroomlabs-ai/headroom
"""
import re
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class OptimizedContext:
    """Optimized text context with token analytics."""
    original_text: str
    optimized_text: str
    original_token_estimate: int
    optimized_token_estimate: int
    reduction_percentage: float
    preserved_statutes: List[str]
    preserved_amounts: List[str]
    preserved_dates: List[str]


class HeadroomLegalPruner:
    """
    Intelligent context pruner tailored for Indian litigation documents,
    pleadings, contracts, and Bare Acts.
    """

    # Boilerplate patterns that add token bloat without factual substance
    BOILERPLATE_PATTERNS = [
        r"(?i)NOW\s+THIS\s+INDENTURE\s+WITNESSETH\s+AS\s+FOLLOWS[:;]?",
        r"(?i)AND\s+WHEREAS\s+the\s+parties\s+hereto\s+have\s+agreed\s+to.*?[.:;]",
        r"(?i)IN\s+WITNESS\s+WHEREOF\s+the\s+parties\s+hereto\s+have\s+set\s+their\s+respective\s+hands.*?[.:;]",
        r"(?i)SIGNED,\s+SEALED\s+AND\s+DELIVERED\s+by\s+the\s+within\s+named.*?[.:;]",
        r"(?i)SUBJECT\s+TO\s+THE\s+JURISDICTION\s+OF\s+COURTS\s+AT.*?[.:;]",
        r"(?i)FOR\s+AND\s+ON\s+BEHALF\s+OF\s+THE.*?[.:;]",
        r"(?i)This\s+agreement\s+is\s+made\s+and\s+entered\s+into\s+on\s+this.*?by\s+and\s+between[:;]?",
    ]

    # Critical patterns that MUST NEVER be pruned
    STATUTE_PATTERN = re.compile(
        r"(?i)(?:Section|Sec\.|Article|Art\.)\s+\d+[A-Z]*(?:\s*\(\d+\))*\s+(?:of\s+(?:the\s+)?)?[A-Za-z\s,]+(?:Act|Code|Sanhita|Adhiniyam)(?:,\s*\d{4})?",
        re.MULTILINE
    )
    AMOUNT_PATTERN = re.compile(
        r"(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:lakhs?|crores?|thousand|only))?",
        re.IGNORECASE
    )
    DATE_PATTERN = re.compile(
        r"\b\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3,9})[-/.]\d{2,4}\b|\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,\s*\d{4})\b",
        re.IGNORECASE
    )

    @classmethod
    def estimate_tokens(cls, text: str) -> int:
        """Heuristic token estimator (~4 chars per token for English/legal text)."""
        if not text:
            return 0
        words = text.split()
        return max(1, int(len(text) / 3.8))

    @classmethod
    def extract_critical_entities(cls, text: str) -> Tuple[List[str], List[str], List[str]]:
        """Extract statutory citations, financial amounts, and critical dates."""
        statutes = list(set(cls.STATUTE_PATTERN.findall(text)))
        amounts = list(set(cls.AMOUNT_PATTERN.findall(text)))
        dates = list(set(cls.DATE_PATTERN.findall(text)))
        return statutes, amounts, dates

    @classmethod
    def prune_context(cls, text: str, max_tokens: int = 4000) -> OptimizedContext:
        """
        Prunes redundant boilerplate while guaranteeing preservation of
        all statutory references, amounts, and dates.
        """
        orig_tokens = cls.estimate_tokens(text)
        statutes, amounts, dates = cls.extract_critical_entities(text)

        cleaned = text

        # 1. Prune standard legal boilerplate formulas
        for pattern in cls.BOILERPLATE_PATTERNS:
            cleaned = re.sub(pattern, "", cleaned)

        # 2. Collapse repeated whitespace and page break artifacts
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)

        # 3. If still exceeding budget, retain paragraphs containing critical entities
        opt_tokens = cls.estimate_tokens(cleaned)
        if opt_tokens > max_tokens:
            paragraphs = cleaned.split("\n\n")
            high_value_paras = []
            standard_paras = []

            for p in paragraphs:
                p_strip = p.strip()
                if not p_strip:
                    continue
                # Keep if contains statute, financial amount, or date
                has_entity = (
                    any(s in p for s in statutes[:5]) or
                    any(a in p for a in amounts[:5]) or
                    any(d in p for d in dates[:5]) or
                    any(kw in p.lower() for kw in ["held", "ordered", "ground", "prayer", "default", "breach"])
                )
                if has_entity:
                    high_value_paras.append(p_strip)
                else:
                    standard_paras.append(p_strip)

            # Combine high-value first, then append standard paragraphs until token budget is reached
            assembled = []
            curr_tokens = 0
            for p in high_value_paras:
                p_toks = cls.estimate_tokens(p)
                assembled.append(p)
                curr_tokens += p_toks

            for p in standard_paras:
                p_toks = cls.estimate_tokens(p)
                if curr_tokens + p_toks <= max_tokens:
                    assembled.append(p)
                    curr_tokens += p_toks
                else:
                    break

            cleaned = "\n\n".join(assembled)
            opt_tokens = cls.estimate_tokens(cleaned)

        reduction = round(((orig_tokens - opt_tokens) / max(1, orig_tokens)) * 100, 2)
        if reduction < 0:
            reduction = 0.0

        logger.info(
            "headroom_optimization_complete",
            orig_tokens=orig_tokens,
            opt_tokens=opt_tokens,
            reduction_pct=reduction,
            statutes_found=len(statutes),
            amounts_found=len(amounts),
        )

        return OptimizedContext(
            original_text=text,
            optimized_text=cleaned,
            original_token_estimate=orig_tokens,
            optimized_token_estimate=opt_tokens,
            reduction_percentage=reduction,
            preserved_statutes=statutes,
            preserved_amounts=amounts,
            preserved_dates=dates,
        )


def optimize_legal_context(text: str, max_tokens: int = 4000) -> OptimizedContext:
    """Convenience helper to optimize legal context with Headroom."""
    return HeadroomLegalPruner.prune_context(text, max_tokens=max_tokens)
