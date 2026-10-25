"""Tests for health endpoints."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.model_router import _router
from tests.fixtures import mock_llm_fact_extraction_response, mock_llm_drafting_response
from tests.conftest import mock_adapter, mock_router


class TestHealthEndpoints:
    """Test health check endpoints."""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test basic health check endpoint."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_llm_health_check_no_router(self):
        """Test LLM health check when no router is configured."""
        # Temporarily clear router
        import app.core.model_router as mr
        original = mr._router
        mr._router = None
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/health/llm")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["status"] == "not_configured"
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_llm_health_check_with_mock(self, mock_router, mock_adapter):
        """Test LLM health check with mocked router."""
        mock_adapter.health_check.return_value = {
            "provider": "gemini",
            "model": "gemini-1.5-flash",
            "status": "connected",
            "latency_ms": 150,
            "error": None,
        }
        mock_router.health_check_all.return_value = [mock_adapter.health_check.return_value]
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/health/llm")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["provider"] == "gemini"
            assert data[0]["status"] == "connected"
            assert data[0]["latency_ms"] == 150
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_root_endpoint(self):
        """Test root endpoint."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "DraftMate AI"
        assert data["version"] == "1.0.0"
        assert "endpoints" in data