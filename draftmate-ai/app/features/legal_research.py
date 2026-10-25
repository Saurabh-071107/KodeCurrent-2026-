"""Legal research feature module for constitutional and statutory research."""
import json
import uuid
import structlog
import re
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.retriever_instance import get_retriever
from app.schemas import (
    LegalResearchRequest,
    LegalResearchResponse,
    LegalResearchResult,
    CitationSource,
    CitationSource as CitationSourceSchema,
)

logger = structlog.get_logger(__name__)


class LegalResearchError(Exception):
    """Legal research specific errors."""
    pass


LEGAL_RESEARCH_SYSTEM_PROMPT = """You are an expert legal researcher specializing in Indian law. Conduct thorough legal research on the specified issues.

CRITICAL RULES:
1. NEVER invent case law, statutes, citations, or legal principles
2. Base research ONLY on verifiable legal sources
3. Distinguish between: binding authority, persuasive authority, and general commentary
4. For each authority, provide: case name, court, date, citation, relevant passage
5. Distinguish between: existence of authority, support for proposition, current validity
6. If current legal status cannot be verified, explicitly state that limitation
7. Use official sources where possible (Indian Kanoon, Indian Kanoon API, Supreme Court website, Indian Kanoon, Manupatra, SCC Online, Indian Law Reports)

SOURCE PRIORITIES:
1. Constitution of India provisions
2. Supreme Court of India judgments (binding)
3. High Court judgments (binding within jurisdiction, persuasive elsewhere)
4. Central Acts and State legislation
5. Rules and regulations
6. Law Commission reports
6. Academic commentary (clearly labeled as such)

VERIFICATION STATUSES:
- VERIFIED: Authority exists, supports proposition, current status confirmed
- PARTIALLY_VERIFIED: Authority exists but only partially supports proposition OR status not fully confirmed
- UNVERIFIED: Authority exists but does not support proposition OR cannot be located
- NOT_CHECKED: No source integration configured or unable to check

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "results": [
    {
      "issue": "string",
      "constitutional_provisions": [{"article": "string", "text": "string", "relevance": "string"}],
      "statutes": [{"name": "string", "section": "string", "text": "string", "relevance": "string"}],
      "rules_regulations": [{"name": "string", "rule": "string", "text": "string", "relevance": "string"}],
      "precedents": [{"case_name": "string", "court": "string", "year": "string", "citation": "string", "ratio": "string", "relevance": "string"}],
      "binding_authorities": [{"case_name": "string", "court": "string", "year": "string", "citation": "string", "ratio": "string"}],
      "persuasive_authorities": [{"case_name": "string", "court": "string", "year": "string", "citation": "string", "ratio": "string"}],
      "ratio_decidendi": ["string"],
      "factual_distinctions": ["string"],
      "subsequent_treatment": ["string"],
      "legal_position_summary": "string",
      "research_gaps": ["string"],
      "sources": [{"title": "string", "url": "string", "excerpt": "string", "jurisdiction": "string"}],
      "confidence": 0.0-1.0
    }
  ]
}"""

LEGAL_RESEARCH_USER_PROMPT = """Research the following legal issues for Indian law:

ISSUES TO RESEARCH:
{issues}

JURISDICTION: {jurisdiction}

RESEARCH REQUIREMENTS:
- Include constitutional provisions: {include_constitutional}
- Include statutes and rules: {include_statutes}
- Include case law precedents: {include_precedents}
- Maximum results per issue: {max_results_per_issue}

For each issue, provide:
1. Relevant constitutional provisions with article numbers
2. Applicable statutes with specific sections
3. Relevant rules and regulations
4. Key Supreme Court and High Court precedents with citations
5. Binding vs persuasive authorities
6. Ratio decidendi of key cases
6. Factual distinctions from current case
7. Subsequent treatment (overruled, affirmed, distinguished)
8. Summary of legal position
9. Research gaps identified
10. Sources with URLs where available

Return ONLY the JSON structure specified in the system prompt."""


async def conduct_legal_research(request: 'LegalResearchRequest') -> 'LegalResearchResponse':
    """
    Conduct legal research on specified issues for Indian law.
    
    Args:
        request: LegalResearchRequest with issues and parameters
        
    Returns:
        LegalResearchResponse with research results
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Build the research prompt
    issues_text = "\n".join([f"{i+1}. {issue}" for i, issue in enumerate(request.issues)])
    
    user_prompt = LEGAL_RESEARCH_USER_PROMPT.format(
        issues=issues_text,
        jurisdiction=request.jurisdiction,
        include_constitutional=str(request.include_constitutional).lower(),
        include_statutes=str(request.include_statutes).lower(),
        include_precedents=str(request.include_precedents).lower(),
        max_results_per_issue=request.max_results_per_issue,
    )
    
    system_prompt = LEGAL_RESEARCH_SYSTEM_PROMPT
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("legal_research_started", issues_count=len(request.issues), jurisdiction=request.jurisdiction)
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=8192)
        
        parsed = _parse_legal_research_response(response.content)
        
        results = []
        for r in parsed.get("results", []):
            # Convert sources to CitationSource objects
            sources = []
            for s in r.get("sources", []):
                sources.append(CitationSource(
                    title=s.get("title", ""),
                    url=s.get("url"),
                    retrieved_at=datetime.utcnow(),
                    excerpt=s.get("excerpt", ""),
                    jurisdiction=s.get("jurisdiction"),
                ))
            
            result = LegalResearchResult(
                issue=r.get("issue", ""),
                constitutional_provisions=r.get("constitutional_provisions", []),
                statutes=r.get("statutes", []),
                rules_regulations=r.get("rules_regulations", []),
                precedents=r.get("precedents", []),
                binding_authorities=r.get("binding_authorities", []),
                persuasive_authorities=r.get("persuasive_authorities", []),
                ratio_decidendi=r.get("ratio_decidendi", []),
                factual_distinctions=r.get("factual_distinctions", []),
                subsequent_treatment=r.get("subsequent_treatment", []),
                legal_position_summary=r.get("legal_position_summary", ""),
                research_gaps=r.get("research_gaps", []),
                sources=sources,
                confidence=r.get("confidence", 0.7),
            )
            results.append(result)
        
        # Calculate overall confidence
        overall_confidence = sum(r.confidence for r in results) / len(results) if results else 0.7
        
        logger.info("legal_research_completed", issues_count=len(request.issues))
        
        return LegalResearchResponse(
            results=results,
            total_issues=len(request.issues),
            overall_confidence=overall_confidence,
            sources_configured=False,  # Would be True if real legal APIs configured
            disclaimer="This is legal research assistance, not legal advice. Verify all authorities independently.",
        )
        
    except json.JSONDecodeError as e:
        logger.error("legal_research_json_error", error=str(e))
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("legal_research_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Legal research failed: {str(e)}")


def _parse_legal_research_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for legal research."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


# Indian legal source connectors (to be implemented based on available APIs)
class IndianKanoonConnector:
    """Connector for Indian Kanoon API (if available)."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://api.indiankanoon.org"
    
    async def search_cases(self, query: str, max_results: int = 10) -> List[dict]:
        """Search Indian Kanoon for case law."""
        # Implementation would use actual API
        # This is a placeholder
        return []


class LegislativeGovInConnector:
    """Connector for Legislative Department website (legislative.gov.in)."""
    
    def __init__(self):
        self.base_url = "https://www.legislative.gov.in"
    
    async def search_statutes(self, query: str, max_results: int = 10) -> List[dict]:
        """Search for statutes on legislative.gov.in."""
        # Implementation would scrape or use API if available
        return []


class IndiaCodeConnector:
    """Connector for India Code (indiacode.nic.in)."""
    
    def __init__(self):
        self.base_url = "https://www.indiacode.nic.in"
    
    async def search_statutes(self, query: str, max_results: int = 10) -> List[dict]:
        """Search India Code for statutes."""
        # Implementation would use available API
        return []


class SupremeCourtConnector:
    """Connector for Supreme Court of India website."""
    
    def __init__(self):
        self.base_url = "https://scr.sci.gov.in"
    
    async def search_judgments(self, query: str, max_results: int = 10) -> List[dict]:
        """Search Supreme Court judgments."""
        # Implementation would use SCR search
        return []


# Legal research integration points (to be configured based on available APIs)
class LegalResearchIntegrator:
    """Integrates multiple legal research sources."""
    
    def __init__(self):
        self.indian_kanoon = IndianKanoonConnector()
        self.legislative = LegislativeGovInConnector()
        self.india_code = IndiaCodeConnector()
        self.supreme_court = SupremeCourtConnector()
    
    async def search_all_sources(self, query: str, max_results: int = 20) -> List[dict]:
        """Search all configured legal sources."""
        results = []
        
        # Try Indian Kanoon
        try:
            kanoon_results = await self.indian_kanoon.search_cases(query, max_results//4)
            results.extend(kanoon_results)
        except Exception:
            pass
        
        # Try legislative.gov.in
        try:
            leg_results = await self.legislative.search_statutes(query, max_results//4)
            results.extend(leg_results)
        except Exception:
            pass
        
        # Try India Code
        try:
            ic_results = await self.india_code.search_statutes(query, max_results//4)
            results.extend(ic_results)
        except Exception:
            pass
        
        # Try Supreme Court
        try:
            sc_results = await self.supreme_court.search_judgments(query, max_results//4)
            results.extend(sc_results)
        except Exception:
            pass
        
        return results[:max_results]


# Global integrator instance
_legal_integrator: Optional[LegalResearchIntegrator] = None


def get_legal_integrator() -> LegalResearchIntegrator:
    """Get global legal research integrator."""
    global _legal_integrator
    if _legal_integrator is None:
        _legal_integrator = LegalResearchIntegrator()
    return _legal_integrator


import json