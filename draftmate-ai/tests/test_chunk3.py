"""Tests for Chunk 3: Review, Citation Verification, and Redlining features."""
import json
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.schemas import (
    DraftResponse, FactExtractionResponse, DocumentType, Jurisdiction,
    DraftSection, PartyRoleInfo, PartyRole, DateInfo, ExtractedFact,
    ReviewFinding, FindingCategory, FindingSeverity,
    CitationVerificationResult, CitationStatus,
    RedlineOperation, RedlineOperationType, RedlineDecision,
)
from tests.conftest import mock_adapter, mock_router


class TestReviewEndpoint:
    """Test POST /review endpoint."""

    @pytest.mark.asyncio
    async def test_review_success(self, mock_router, mock_adapter):
        """Test successful document review."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "findings": [
                {
                    "finding_id": "review_abc123",
                    "category": "unresolved_placeholder",
                    "severity": "high",
                    "location": "Section 'Header', Paragraph 1",
                    "description": "Unresolved placeholder [DATE] in header",
                    "suggested_correction": "Replace with actual date",
                    "evidence_ids": [],
                    "related_finding_ids": [],
                    "uncertainty": None,
                    "confidence": 0.95
                },
                {
                    "finding_id": "review_def456",
                    "category": "inconsistent_party",
                    "severity": "medium",
                    "location": "Section 'Parties'",
                    "description": "Party name 'John Doe' differs from facts 'Jane Doe'",
                    "suggested_correction": "Use consistent party name",
                    "evidence_ids": [],
                    "related_finding_ids": [],
                    "uncertainty": "May be intentional if referring to different person",
                    "confidence": 0.8
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = _build_review_request()
                response = await client.post("/review", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "findings" in data
            assert len(data["findings"]) == 2
            assert data["findings"][0]["category"] == "unresolved_placeholder"
            assert data["findings"][1]["category"] == "inconsistent_party"
            assert "summary" in data
            assert "document_hash" in data
            assert data["summary"]["total_findings"] == 2
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_review_invalid_input(self):
        """Test review with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/review", json={})
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_review_llm_error(self, mock_router, mock_adapter):
        """Test review when LLM returns error."""
        mock_adapter.chat.side_effect = Exception("LLM API error")
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = _build_review_request()
                response = await client.post("/review", json=request_data)
            
            assert response.status_code == 400
            data = response.json()
            # HTTPException is caught and returns http_error format
            assert data["error"] == "http_error"
            assert "Review failed" in data["message"]
        finally:
            mr._router = original


class TestCitationVerificationEndpoint:
    """Test POST /citations/verify endpoint."""

    @pytest.mark.asyncio
    async def test_citation_verification_no_sources(self, mock_router, mock_adapter):
        """Test citation verification when no sources configured."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = {
                    "draft": _build_minimal_draft(),
                    "jurisdiction": "us_ca"
                }
                response = await client.post("/citations/verify", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert "summary" in data
            assert "sources_configured" in data
            assert data["sources_configured"] is False
            # Should return NOT_CHECKED for all citations
            for result in data["results"]:
                assert result["status"] == "not_checked"
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_citation_verification_invalid_input(self):
        """Test citation verification with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/citations/verify", json={})
        
        assert response.status_code == 422


class TestRedliningEndpoint:
    """Test redlining endpoints."""

    @pytest.mark.asyncio
    async def test_redline_generation_success(self, mock_router, mock_adapter):
        """Test successful redline generation."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "operations": [
                {
                    "operation_id": "redline_abc123",
                    "operation_type": "replace",
                    "target_location": "Section 'Header', Paragraph 1",
                    "original_text": "[DATE]",
                    "proposed_text": "January 15, 2024",
                    "explanation": "Resolve placeholder with actual date from facts",
                    "risk_level": "low",
                    "related_finding_ids": ["review_abc123"],
                    "evidence_ids": [],
                    "depends_on": []
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = _build_redline_request()
                response = await client.post("/redline", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "operations" in data
            assert len(data["operations"]) == 1
            assert data["operations"][0]["operation_type"] == "replace"
            assert "document_hash" in data
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_redline_decisions_accept(self, mock_router, mock_adapter):
        """Test accepting redline operations."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        # First generate redlines to store state
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "operations": [
                {
                    "operation_id": "redline_test1",
                    "operation_type": "replace",
                    "target_location": "Section 'Header'",
                    "original_text": "[DATE]",
                    "proposed_text": "January 15, 2024",
                    "explanation": "Resolve placeholder",
                    "risk_level": "low",
                    "related_finding_ids": [],
                    "evidence_ids": [],
                    "depends_on": []
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # Generate redlines first
                redline_request = _build_redline_request()
                redline_response = await client.post("/redline", json=redline_request)
                assert redline_response.status_code == 200
                redline_data = redline_response.json()
                doc_hash = redline_data["document_hash"]
                
                # Now apply decisions
                decisions_request = {
                    "document_hash": doc_hash,
                    "decisions": [
                        {"operation_id": "redline_test1", "accepted": True}
                    ]
                }
                response = await client.post(f"/redline/{doc_hash}/decisions", json=decisions_request)
            
            assert response.status_code == 200
            data = response.json()
            assert "applied_operations" in data
            assert "rejected_operations" in data
            assert "redline_test1" in data["applied_operations"]
            assert "updated_draft" in data
            assert "new_document_hash" in data
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_redline_decisions_reject(self, mock_router, mock_adapter):
        """Test rejecting redline operations."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "operations": [
                {
                    "operation_id": "redline_test2",
                    "operation_type": "replace",
                    "target_location": "Section 'Header'",
                    "original_text": "[DATE]",
                    "proposed_text": "January 15, 2024",
                    "explanation": "Resolve placeholder",
                    "risk_level": "low",
                    "related_finding_ids": [],
                    "evidence_ids": [],
                    "depends_on": []
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                redline_request = _build_redline_request()
                redline_response = await client.post("/redline", json=redline_request)
                redline_data = redline_response.json()
                doc_hash = redline_data["document_hash"]
                
                decisions_request = {
                    "document_hash": doc_hash,
                    "decisions": [
                        {"operation_id": "redline_test2", "accepted": False}
                    ]
                }
                response = await client.post(f"/redline/{doc_hash}/decisions", json=decisions_request)
            
            assert response.status_code == 200
            data = response.json()
            assert "redline_test2" in data["rejected_operations"]
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_redline_decisions_hash_mismatch(self):
        """Test redline decisions with hash mismatch."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            decisions_request = {
                "document_hash": "wrong_hash",
                "decisions": [{"operation_id": "redline_1", "accepted": True}]
            }
            response = await client.post("/redline/other_hash/decisions", json=decisions_request)
        
        assert response.status_code == 400
        data = response.json()
        # ErrorResponse uses "message" not "detail"
        assert "hash mismatch" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_redline_preview(self, mock_router, mock_adapter):
        """Test redline preview."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "operations": [
                {
                    "operation_id": "redline_preview1",
                    "operation_type": "replace",
                    "target_location": "Section 'Header'",
                    "original_text": "[DATE]",
                    "proposed_text": "January 15, 2024",
                    "explanation": "Resolve placeholder",
                    "risk_level": "low",
                    "related_finding_ids": [],
                    "evidence_ids": [],
                    "depends_on": []
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                redline_request = _build_redline_request()
                redline_response = await client.post("/redline", json=redline_request)
                redline_data = redline_response.json()
                doc_hash = redline_data["document_hash"]
                
                # Apply decision
                decisions_request = {
                    "document_hash": doc_hash,
                    "decisions": [{"operation_id": "redline_preview1", "accepted": True}]
                }
                await client.post(f"/redline/{doc_hash}/decisions", json=decisions_request)
                
                # Now preview
                preview_request = {"document_hash": doc_hash}
                response = await client.post(f"/redline/{doc_hash}/preview", json=preview_request)
            
            assert response.status_code == 200
            data = response.json()
            assert "original_draft" in data
            assert "preview_draft" in data
            assert "changes_summary" in data
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_redline_invalid_input(self):
        """Test redline with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/redline", json={})
        
        assert response.status_code == 422


# Helper functions for test data
def _build_minimal_draft() -> dict:
    """Build a minimal valid draft for testing."""
    return {
        "document_type": "demand_letter",
        "title": "Test Demand Letter",
        "sections": [
            {"title": "Header", "content": "John Doe\n[DATE]\n\nABC Corp\n\nRe: Demand", "order": 0, "is_placeholder": True},
            {"title": "Body", "content": "Dear ABC Corp,\n\nI demand payment per California Civil Code § 1950.5.", "order": 1, "is_placeholder": False}
        ],
        "assumptions": [],
        "warnings": [],
        "placeholders": ["[DATE]"],
        "review_status": "draft_needs_review",
        "disclaimer": "Test disclaimer"
    }


def _build_review_request() -> dict:
    """Build a valid review request."""
    draft = _build_minimal_draft()
    facts = {
        "user_provided_facts": [
            {"fact": "Security deposit is $2,000", "source_text": "deposit of $2,000", "confidence": 1.0, "is_assumption": False}
        ],
        "inferred_facts": [],
        "parties_and_roles": [
            {"name": "John Doe", "role": "sender", "confidence": 1.0, "reasoning": "User is sender"}
        ],
        "important_dates": [
            {"date": "2024-01-15", "description": "Move-out date", "is_approximate": False}
        ],
        "desired_outcome": "Recover deposit",
        "missing_information": ["Exact date"],
        "contradictions": [],
        "follow_up_questions": [],
        "assumptions": ["California law applies"],
        "uncertainties": ["Whether landlord deducted"]
    }
    return {
        "draft": draft,
        "facts": facts,
        "jurisdiction": "us_ca",
        "document_ids": None,
        "custom_checks": None
    }


def _build_redline_request() -> dict:
    """Build a valid redline request."""
    draft = _build_minimal_draft()
    facts = {
        "user_provided_facts": [
            {"fact": "Security deposit is $2,000", "source_text": "deposit of $2,000", "confidence": 1.0, "is_assumption": False},
            {"fact": "Move-out date was January 15, 2024", "source_text": "moved out on January 15, 2024", "confidence": 1.0, "is_assumption": False}
        ],
        "inferred_facts": [],
        "parties_and_roles": [
            {"name": "John Doe", "role": "sender", "confidence": 1.0, "reasoning": "User is sender"},
            {"name": "ABC Corp", "role": "recipient", "confidence": 1.0, "reasoning": "Recipient"}
        ],
        "important_dates": [
            {"date": "2024-01-15", "description": "Move-out date", "is_approximate": False}
        ],
        "desired_outcome": "Recover deposit",
        "missing_information": [],
        "contradictions": [],
        "follow_up_questions": [],
        "assumptions": ["California law applies"],
        "uncertainties": []
    }
    
    review_response = {
        "findings": [
            {
                "finding_id": "review_placeholder",
                "category": "unresolved_placeholder",
                "severity": "high",
                "location": "Section 'Header', Paragraph 1",
                "description": "Unresolved placeholder [DATE] in header",
                "suggested_correction": "Replace with actual date",
                "evidence_ids": [],
                "related_finding_ids": [],
                "uncertainty": None,
                "confidence": 0.95
            }
        ],
        "summary": {"total_findings": 1, "by_category": {"unresolved_placeholder": 1}, "by_severity": {"high": 1}},
        "document_hash": "test_hash"
    }
    
    return {
        "draft": draft,
        "review_response": review_response,
        "facts": facts,
        "jurisdiction": "us_ca",
        "max_operations": 20
    }