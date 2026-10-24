"""Comprehensive regular expressions and patterns for Indian and international legal citations."""

import re

# ==============================================================================
# 1. Indian Case Law Citation Regexes
# ==============================================================================

# Supreme Court Cases: e.g. (1973) 4 SCC 225, (2017) 10 SCC 1, 2017 (10) SCC 1
SCC_PATTERN = re.compile(
    r"(?:\((\d{4})\)\s*(\d+)?\s*SCC\s*(\d+)|\b(\d{4})\s*\((\d+)\)\s*SCC\s*(\d+))",
    re.IGNORECASE,
)

# All India Reporter: e.g. AIR 1973 SC 1461, AIR 1978 SC 597, AIR 2000 Del 120
AIR_PATTERN = re.compile(
    r"\bAIR\s+(\d{4})\s+([A-Za-z]+)\s+(\d+)\b",
    re.IGNORECASE,
)

# Official Supreme Court Neutral Citation: e.g. 2023 INSC 582, 2024 INSC 12
INSC_PATTERN = re.compile(
    r"\b(\d{4})\s+INSC\s+(\d+)\b",
    re.IGNORECASE,
)

# SCC OnLine: e.g. 2023 SCC OnLine SC 945, 2021 SCC OnLine Del 4501
SCC_ONLINE_PATTERN = re.compile(
    r"\b(\d{4})\s+SCC\s+OnLine\s+([A-Za-z]+)\s+(\d+)\b",
    re.IGNORECASE,
)

# Supreme Court Reports: e.g. [1973] 3 SCR 1, (1978) 2 SCR 621, 1973 (3) SCR 1
SCR_PATTERN = re.compile(
    r"(?:\[|\()(\d{4})(?:\]|\))\s*(\d+)?\s*SCR\s*(\d+)|\b(\d{4})\s*\((\d+)\)\s*SCR\s*(\d+)",
    re.IGNORECASE,
)

# Delhi Law Times: e.g. (2020) 2 DLT 450, 150 (2008) DLT 200
DLT_PATTERN = re.compile(
    r"(?:\((\d{4})\)\s*(\d+)\s*DLT\s*(\d+)|\b(\d+)\s*\((\d{4})\)\s*DLT\s*(\d+))",
    re.IGNORECASE,
)

# Criminal Law Journal: e.g. 1994 Cri LJ 1234, (2005) Cri LJ 500
CRI_LJ_PATTERN = re.compile(
    r"(?:\((\d{4})\)\s*)?(?:Cri\s*LJ|Cr\s*LJ)\s*(\d+)",
    re.IGNORECASE,
)

# Bombay Law Reporter: e.g. (1998) 100 Bom LR 120
BOM_LR_PATTERN = re.compile(
    r"(?:\((\d{4})\)\s*)?(\d+)?\s*Bom\s*LR\s*(\d+)",
    re.IGNORECASE,
)

# Combined Indian Case Law regex
INDIAN_CASE_CITATION_RE = re.compile(
    r"(?:"
    r"\(\d{4}\)\s*\d*\s*SCC\s*\d+"
    r"|\d{4}\s*\(\d+\)\s*SCC\s*\d+"
    r"|\bAIR\s+\d{4}\s+[A-Za-z]+\s+\d+\b"
    r"|\b\d{4}\s+INSC\s+\d+\b"
    r"|\b\d{4}\s+SCC\s+OnLine\s+[A-Za-z]+\s+\d+\b"
    r"|(?:\[|\()\d{4}(?:\]|\))\s*\d*\s*SCR\s*\d+"
    r"|\(\d{4}\)\s*\d+\s*DLT\s*\d+"
    r")",
    re.IGNORECASE,
)

# Case title extraction pattern: Petitioner v. Respondent
# Matches: "Kesavananda Bharati v. State of Kerala", "Maneka Gandhi vs. Union of India"
CASE_NAME_PATTERN = re.compile(
    r"([A-Z][A-Za-z0-9\s\.\,\'\(\)\&\-]{2,60})\s+(?:v\.|vs\.|v\/s|versus|Versus)\s+([A-Z][A-Za-z0-9\s\.\,\'\(\)\&\-]{2,60})",
    re.UNICODE,
)

# ==============================================================================
# 2. Statutory and Constitutional Citation Regexes
# ==============================================================================

# Statutory Section: "Section 9 of the Arbitration and Conciliation Act, 1996"
# "Section 138 of Negotiable Instruments Act"
STATUTORY_SECTION_PATTERN = re.compile(
    r"\b(?:Section|Sec\.)\s+([0-9A-Za-z]+(?:\s*\([0-9a-zA-Z]+\))*)\s+(?:of\s+(?:the\s+)?)?([A-Z][A-Za-z\s\,\-]+?(?:Act|Code)(?:\s*,\s*\d{4})?)",
    re.UNICODE,
)

# Constitutional Article: "Article 21 of the Constitution of India", "Article 14, 19"
CONSTITUTIONAL_ARTICLE_PATTERN = re.compile(
    r"\b(?:Article|Art\.)\s+([0-9A-Za-z]+(?:\s*\([0-9a-zA-Z]+\))*)\s+(?:of\s+(?:the\s+)?)?(?:Constitution\s+of\s+India|Constitution)",
    re.IGNORECASE,
)

# ==============================================================================
# 3. Pinpoint Citation Patterns
# ==============================================================================

# Pinpoint paragraph: e.g. "para 45", "para. 12", "paras 30-35", "[45]"
PINPOINT_PARA_PATTERN = re.compile(
    r"(?:(?:at\s+)?para(?:graph)?s?\.?\s*(\d+(?:\s*[-–]\s*\d+)?)|\[\s*(\d+)\s*\])",
    re.IGNORECASE,
)

# Pinpoint page: e.g. "at page 240", "p. 55", "pp. 12-14"
PINPOINT_PAGE_PATTERN = re.compile(
    r"(?:at\s+)?(?:page|p\.|pp\.)\s*(\d+(?:\s*[-–]\s*\d+)?)",
    re.IGNORECASE,
)

# ==============================================================================
# 4. International / Common Law Patterns
# ==============================================================================

# UK Supreme Court / House of Lords: [2020] UKSC 15, [2004] UKHL 30
UK_CITATION_PATTERN = re.compile(
    r"\[(\d{4})\]\s+UK(?:SC|HL|PC|CA\s+Civ)\s+(\d+)",
    re.IGNORECASE,
)

# US Supreme Court: 347 U.S. 483 (1954)
US_REPORTER_PATTERN = re.compile(
    r"(\d+)\s+U\.?S\.?\s+(\d+)(?:\s*\((\d{4})\))?",
    re.IGNORECASE,
)

