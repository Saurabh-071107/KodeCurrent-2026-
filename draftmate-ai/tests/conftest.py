"""Test fixtures and configuration."""
import json
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import Settings, LLMSettings, ServerSettings
from app.core.model_router import LLMAdapter, LLMResponse, ModelRouter
from app.main import app
from app.schemas import (
    DocumentType,
    Jurisdiction,
    PartyInfo,
    PartyRole,
    DateInfo,
    FactExtractionRequest,
    FactExtractionResponse,
    ExtractedFact,
    PartyRoleInfo,
    DraftRequest,
    DraftResponse,
    DraftSection,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_settings():
    """Mock settings with test configuration."""
    return Settings(
        llm=LLMSettings(
            provider="gemini",
            api_key="test-api-key",
            model="gemini-1.5-flash",
            base_url="https://generativelanguage.googleapis.com/v1beta",
            timeout=30,
            max_retries=3,
        ),
        server=ServerSettings(host="0.0.0.0", port=8000, log_level="INFO"),
    )


@pytest.fixture
def mock_adapter():
    """Create a mock LLM adapter."""
    adapter = AsyncMock(spec=LLMAdapter)
    adapter.provider_name = "gemini"
    adapter.model = "gemini-1.5-flash"
    adapter.chat = AsyncMock()
    adapter.health_check = AsyncMock()
    return adapter


@pytest.fixture
def mock_router(mock_adapter):
    """Create a mock model router."""
    router = MagicMock(spec=ModelRouter)
    router.primary = mock_adapter
    router.secondary = None
    router.initialize = AsyncMock()
    router.health_check_all = AsyncMock(return_value=[{
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "status": "connected",
        "latency_ms": 100,
        "error": None,
    }])
    router.close = AsyncMock()
    return router