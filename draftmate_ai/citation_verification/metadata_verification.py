"""Metadata verification dimension: validates case titles, courts, years, and reporters against official records."""

import re
from typing import Tuple, List, Optional

from draftmate_ai.citation_verification.schemas import (
    ExtractedCitation,
    NormalizedCitation,
    AuthorityRecord,
    MetadataAccuracyStatus,
    CitationType,
)
from draftmate_ai.citation_verification.normalization import normalize_party_name


class MetadataVerifier:
    """Evaluates the structural and bibliographical accuracy of a legal citation against an authoritative record."""

    def verify_metadata(
        self,
        extracted: ExtractedCitation,
        normalized: NormalizedCitation,
        authority: Optional[AuthorityRecord],
    ) -> Tuple[MetadataAccuracyStatus, str, List[str]]:
        """Verify whether case title, year, court, and reporter details match the authority record.

        Returns:
            (status, explanation, discrepancies_list)
        """
        if authority is None:
            return MetadataAccuracyStatus.NOT_CHECKED, "No authority record available to verify metadata against.", []

        # 0. Statutory / Constitutional Citation Handling
        if authority.is_statute or extracted.citation_type in (CitationType.STATUTE, CitationType.CONSTITUTIONAL):
            stat_name = (extracted.statute_name or normalized.statute_canonical or "").lower()
            auth_name = authority.canonical_name.lower()
            sec_num = re.sub(r"\D", "", extracted.section_number or normalized.section_canonical or "")

            stat_matched = any(token in auth_name for token in stat_name.split() if len(token) > 3)
            sec_matched = (not sec_num) or (f"section {sec_num}" in auth_name or f"sec {sec_num}" in auth_name or sec_num in authority.authority_id)

            if stat_matched and sec_matched:
                return (
                    MetadataAccuracyStatus.MATCH,
                    f"Statutory authority matches: '{authority.canonical_name}'.",
                    [],
                )
            else:
                return (
                    MetadataAccuracyStatus.MISMATCH,
                    f"Statutory metadata mismatch: cited '{extracted.raw_citation}' does not match official enactment '{authority.canonical_name}'.",
                    ["Statute or section mismatch"],
                )

        discrepancies: List[str] = []
        matches: List[str] = []

        # 1. Year Verification
        if extracted.year:
            auth_year = None
            if authority.decision_date:
                m = re.search(r"(\d{4})", authority.decision_date)
                if m:
                    auth_year = int(m.group(1))

            if auth_year:
                if extracted.year == auth_year:
                    matches.append(f"Decision year {extracted.year} matches.")
                elif abs(extracted.year - auth_year) <= 1:
                    discrepancies.append(f"Citation year {extracted.year} differs slightly from decision year {auth_year} (likely reporter publication year).")
                else:
                    discrepancies.append(f"Year mismatch: citation year {extracted.year} contradicts official decision year {auth_year}.")

        # 2. Case Name / Party Verification
        if normalized.canonical_case_name:
            target_clean = normalize_party_name(normalized.canonical_case_name).lower()
            auth_clean = normalize_party_name(authority.canonical_name).lower()

            target_tokens = set(re.findall(r"\w+", target_clean))
            auth_tokens = set(re.findall(r"\w+", auth_clean))

            # Filter trivial stopwords
            stop = {"v", "vs", "versus", "of", "the", "and", "in", "state", "union", "india"}
            target_key = target_tokens - stop
            auth_key = auth_tokens - stop

            if target_key and auth_key:
                overlap = target_key.intersection(auth_key)
                overlap_ratio = len(overlap) / max(len(target_key), 1)

                if overlap_ratio >= 0.65:
                    matches.append(f"Case title matches ('{normalized.canonical_case_name}' ~ '{authority.canonical_name}').")
                elif overlap_ratio >= 0.35:
                    discrepancies.append(
                        f"Case title partial match: cited as '{normalized.canonical_case_name}' while official record is '{authority.canonical_name}'."
                    )
                else:
                    discrepancies.append(
                        f"Case title mismatch: cited as '{normalized.canonical_case_name}' but authority title is '{authority.canonical_name}'."
                    )

        # 3. Court Verification
        if extracted.court and normalized.normalized_court:
            auth_court_lower = authority.court.lower()
            norm_court_lower = normalized.normalized_court.lower()
            if norm_court_lower in auth_court_lower or auth_court_lower in norm_court_lower:
                matches.append(f"Court matches ({authority.court}).")
            else:
                discrepancies.append(f"Court mismatch: cited court '{normalized.normalized_court}' differs from official court '{authority.court}'.")

        # 4. Reporter / Citation Verification
        if normalized.canonical_citation:
            norm_cit_clean = re.sub(r"\s+", " ", normalized.canonical_citation.lower())
            known_cits_clean = [re.sub(r"\s+", " ", c.lower()) for c in authority.citations]

            found_cit = any(norm_cit_clean in kc or kc in norm_cit_clean for kc in known_cits_clean)
            if found_cit:
                matches.append(f"Canonical citation '{normalized.canonical_citation}' recognized in official reporter citations.")
            else:
                discrepancies.append(f"Canonical citation '{normalized.canonical_citation}' not listed in known primary reporter citations ({', '.join(authority.citations[:3])}).")

        # Compute status
        has_critical_mismatch = any("mismatch" in d.lower() or "contradicts" in d.lower() for d in discrepancies)
        if not discrepancies:
            status = MetadataAccuracyStatus.MATCH
            explanation = "Metadata completely matches authoritative source: " + "; ".join(matches)
        elif len(matches) >= 1 and not has_critical_mismatch:
            status = MetadataAccuracyStatus.PARTIAL_MATCH
            explanation = "Metadata partially matches with minor discrepancies: " + "; ".join(discrepancies)
        else:
            status = MetadataAccuracyStatus.MISMATCH
            explanation = "Significant metadata discrepancies detected: " + "; ".join(discrepancies)

        return status, explanation, discrepancies

        return status, explanation, discrepancies

