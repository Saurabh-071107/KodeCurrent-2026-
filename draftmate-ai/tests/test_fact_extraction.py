"""Tests for fact extraction endpoint."""
import json
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock

from app.main import app
from app.core.model_router import _router
from app.features.fact_extraction import FactExtractionError
from tests.fixtures import (
    sample_fact_extraction_request,
    sample_fact_extraction_response,
    mock_llm_fact_extraction_response,
)
from tests.conftest import mock_adapter, mock_router


class TestFactExtractionEndpoint:
    """Test POST /facts endpoint."""

    @pytest.mark.asyncio
    async def test_extract_facts_success(self, mock_router, mock_adapter):
        """Test successful fact extraction."""
        # Setup mock response
        mock_response = AsyncMock()
        mock_response.content = json.dumps(mock_llm_fact_extraction_response())
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_fact_extraction_request().model_dump(mode="json")
                response = await client.post("/facts", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "user_provided_facts" in data
            assert "parties_and_roles" in data
            assert "important_dates" in data
            assert "desired_outcome" in data
            assert "missing_information" in data
            assert "follow_up_questions" in data
            assert "assumptions" in data
            assert "uncertainties" in data
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_extract_facts_invalid_input(self):
        """Test fact extraction with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Missing required fields
            response = await client.post("/facts", json={})
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"] == "validation_error"

    @pytest.mark.asyncio
    async def test_extract_facts_short_description(self):
        """Test fact extraction with too short description."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/facts", json={
                "problem_description": "Too short",
                "document_type": "demand_letter",
                "objective": "Test",
            })
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_extract_facts_missing_objective(self):
        """Test fact extraction with missing objective."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/facts", json={
                "problem_description": "This is a valid problem description that is long enough.",
                "document_type": "demand_letter",
            })
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_extract_facts_llm_error(self, mock_router, mock_adapter):
        """Test fact extraction when LLM returns error."""
        mock_adapter.chat.side_effect = Exception("LLM API error")
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_fact_extraction_request().model_dump(mode="json")
                response = await client.post("/facts", json=request_data)
            
            assert response.status_code == 500
            data = response.json()
            assert data["error"] == "fact_extraction_failed"
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_extract_facts_invalid_json_response(self, mock_router, mock_adapter):
        """Test fact extraction when LLM returns invalid JSON."""
        mock_response = AsyncMock()
        mock_response.content = "This is not valid JSON"
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_fact_extraction_request().model_dump(mode="json")
                response = await client.post("/facts", json=request_data)
            
            assert response.status_code == 500
            data = response.json()
            assert data["error"] == "fact_extraction_failed"
            assert "invalid json" in data["message"].lower()
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_extract_facts_all_document_types(self, mock_router, mock_adapter):
        """Test fact extraction with different document types."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps(mock_llm_fact_extraction_response())
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                for doc_type in ["legal_notice", "formal_letter", "agreement", "demand_letter", "cease_desist"]:
                    request_data = sample_fact_extraction_request().model_dump(mode="json")
                    request_data["document_type"] = doc_type
                    response = await client.post("/facts", json=request_data)
                    assert response.status_code == 200, f"Failed for {doc_type}"
        finally:
            mr._router = original