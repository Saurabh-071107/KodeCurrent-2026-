"""Legal currency dimension: evaluates subsequent treatment, overrulings, and good-law status."""

from typing import Tuple, List, Optional
import re

from draftmate_ai.citation_verification.schemas import (
    AuthorityRecord,
    NormalizedCitation,
    LegalCurrencyStatus,
)
from draftmate_ai.citation_verification.normalization import normalize_party_name


# Well-known catalog of overruled precedents in Indian constitutional and civil jurisprudence
OVERRULED_PRECEDENTS_INDEX = {
    "adm jabalpur": {
        "status": LegalCurrencyStatus.OVERRULED,
        "overruled_by": "Justice K.S. Puttaswamy (Retd.) v. Union of India, (2017) 10 SCC 1",
        "notes": "Expressly overruled by a 9-judge Constitution Bench. The right to life and liberty under Article 21 cannot be suspended during an Emergency.",
    },
    "suresh kumar koushal": {
        "status": LegalCurrencyStatus.OVERRULED,
        "overruled_by": "Navtej Singh Johar v. Union of India, (2018) 10 SCC 1",
        "notes": "Overruled by Constitution Bench. Section 377 IPC declared unconstitutional regarding consensual adult relationships.",
    },
    "m.p. sharma": {
        "status": LegalCurrencyStatus.OVERRULED,
        "overruled_by": "Justice K.S. Puttaswamy (Retd.) v. Union of India, (2017) 10 SCC 1",
        "notes": "Overruled regarding the proposition that the Constitution does not protect privacy.",
    },
    "a.k. gopalan": {
        "status": LegalCurrencyStatus.DOUBTED,
        "overruled_by": "Maneka Gandhi v. Union of India, AIR 1978 SC 597",
        "notes": "Formalistic separation of Article 19 and 21 rejected by Maneka Gandhi (golden triangle doctrine).",
    },
}


class CurrencyChecker:
    """Verifies whether an authority remains good law or has been subsequently overruled, doubted, or distinguished."""

    def check_currency(
        self,
        normalized: NormalizedCitation,
        authority: Optional[AuthorityRecord],
    ) -> Tuple[LegalCurrencyStatus, str, List[str]]:
        """Determine legal currency and subsequent treatment.

        Returns:
            (status, explanation, limitations_disclosed)
        """
        limitations = [
            "Currency validation is grounded in authoritative appellate treatment records and Constitution Bench overrulings.",
            "Subsequent unreported decisions or pending reference petitions may not be captured in offline mode.",
        ]

        # 1. Check against known overruling database
        case_name_target = ""
        if normalized.canonical_case_name:
            case_name_target = normalize_party_name(normalized.canonical_case_name).lower()
        elif authority:
            case_name_target = normalize_party_name(authority.canonical_name).lower()

        for key, over_info in OVERRULED_PRECEDENTS_INDEX.items():
            if key in case_name_target:
                status = over_info["status"]
                explanation = (
                    f"CRITICAL LEGAL CURRENCY WARNING: Authority is {status.value}. "
                    f"Overruled/modified by: {over_info['overruled_by']}. "
                    f"Details: {over_info['notes']}"
                )
                return status, explanation, limitations

        # 2. Check authority record metadata
        if authority is not None:
            if authority.currency_status == LegalCurrencyStatus.OVERRULED:
                treatment_summary = "; ".join(authority.subsequent_treatment) if authority.subsequent_treatment else "Marked as overruled."
                return (
                    LegalCurrencyStatus.OVERRULED,
                    f"Authority is OVERRULED according to authoritative source records: {treatment_summary}",
                    limitations,
                )
            elif authority.currency_status == LegalCurrencyStatus.DOUBTED:
                return (
                    LegalCurrencyStatus.DOUBTED,
                    f"Authority is DOUBTED or referred to larger bench: {'; '.join(authority.subsequent_treatment)}",
                    limitations,
                )
            elif authority.currency_status == LegalCurrencyStatus.GOOD_LAW:
                treatments = "; ".join(authority.subsequent_treatment) if authority.subsequent_treatment else "Affirmed in subsequent jurisprudence."
                return (
                    LegalCurrencyStatus.GOOD_LAW,
                    f"Authority confirmed as GOOD LAW. Subsequent treatment: {treatments}",
                    limitations,
                )

        # 3. If authority is unknown/missing
        return (
            LegalCurrencyStatus.UNKNOWN,
            "Legal currency could not be independently verified because authoritative treatment history was not located.",
            limitations,
        )

