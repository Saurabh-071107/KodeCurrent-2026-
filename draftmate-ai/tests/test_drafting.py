"""Tests for document drafting endpoint."""
import json
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock

from app.main import app
from app.core.model_router import _router
from tests.fixtures import (
    sample_draft_request,
    sample_draft_response,
    mock_llm_drafting_response,
)
from tests.conftest import mock_adapter, mock_router


class TestDraftingEndpoint:
    """Test POST /draft endpoint."""

    @pytest.mark.asyncio
    async def test_generate_draft_success(self, mock_router, mock_adapter):
        """Test successful draft generation."""
        # Setup mock response
        mock_response = AsyncMock()
        mock_response.content = json.dumps(mock_llm_drafting_response())
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_draft_request().model_dump(mode="json")
                response = await client.post("/draft", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "document_type" in data
            assert "title" in data
            assert "sections" in data
            assert "assumptions" in data
            assert "warnings" in data
            assert "placeholders" in data
            assert "review_status" in data
            assert "disclaimer" in data
            assert "legal advice" in data["disclaimer"].lower()
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_generate_draft_invalid_input(self):
        """Test draft generation with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Missing required fields
            response = await client.post("/draft", json={})
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"] == "validation_error"

    @pytest.mark.asyncio
    async def test_generate_draft_missing_facts(self):
        """Test draft generation with missing facts."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/draft", json={
                "document_type": "demand_letter",
                "facts": {},
            })
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_draft_llm_error(self, mock_router, mock_adapter):
        """Test draft generation when LLM returns error."""
        mock_adapter.chat.side_effect = Exception("LLM API error")
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_draft_request().model_dump(mode="json")
                response = await client.post("/draft", json=request_data)
            
            assert response.status_code == 500
            data = response.json()
            assert data["error"] == "drafting_failed"
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_generate_draft_invalid_json_response(self, mock_router, mock_adapter):
        """Test draft generation when LLM returns invalid JSON."""
        mock_response = AsyncMock()
        mock_response.content = "This is not valid JSON"
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_draft_request().model_dump(mode="json")
                response = await client.post("/draft", json=request_data)
            
            assert response.status_code == 500
            data = response.json()
            assert data["error"] == "drafting_failed"
            assert "invalid json" in data["message"].lower()
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_generate_draft_all_document_types(self, mock_router, mock_adapter):
        """Test draft generation with different document types."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps(mock_llm_drafting_response())
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                for doc_type in ["legal_notice", "formal_letter", "agreement", "demand_letter", "cease_desist"]:
                    request_data = sample_draft_request().model_dump(mode="json")
                    request_data["document_type"] = doc_type
                    response = await client.post("/draft", json=request_data)
                    assert response.status_code == 200, f"Failed for {doc_type}"
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_generate_draft_with_custom_instructions(self, mock_router, mock_adapter):
        """Test draft generation with custom instructions."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps(mock_llm_drafting_response())
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = sample_draft_request().model_dump(mode="json")
                request_data["custom_instructions"] = "Use very formal tone. Add specific jurisdiction clauses."
                response = await client.post("/draft", json=request_data)
            
            assert response.status_code == 200
            # Verify custom instructions were passed to LLM
            call_args = mock_adapter.chat.call_args
            assert call_args is not None
            messages = call_args[1]["messages"] if "messages" in call_args[1] else call_args[0][0]
            user_message = messages[-1].content if hasattr(messages[-1], 'content') else messages[-1]["content"]
            assert "formal tone" in user_message.lower() or "jurisdiction" in user_message.lower()
        finally:
            mr._router = original