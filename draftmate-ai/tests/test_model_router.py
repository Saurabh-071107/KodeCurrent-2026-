"""Tests for model router and LLM adapters."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.model_router import (
    LLMAdapter,
    LLMMessage,
    LLMResponse,
    GeminiAdapter,
    OpenAIAdapter,
    AnthropicAdapter,
    ModelRouter,
    create_adapter,
    LLMAuthenticationError,
    LLMRateLimitError,
    LLMTimeoutError,
    LLMProviderError,
)
from app.config import LLMSettings


class TestLLMAdapters:
    """Test LLM provider adapters."""

    def test_create_adapter_gemini(self):
        """Test creating Gemini adapter."""
        config = {
            "provider": "gemini",
            "api_key": "test-key",
            "model": "gemini-1.5-flash",
        }
        adapter = create_adapter(config)
        assert isinstance(adapter, GeminiAdapter)
        assert adapter.provider_name == "gemini"

    def test_create_adapter_openai(self):
        """Test creating OpenAI adapter."""
        config = {
            "provider": "openai",
            "api_key": "test-key",
            "model": "gpt-4o",
        }
        adapter = create_adapter(config)
        assert isinstance(adapter, OpenAIAdapter)
        assert adapter.provider_name == "openai"

    def test_create_adapter_anthropic(self):
        """Test creating Anthropic adapter."""
        config = {
            "provider": "anthropic",
            "api_key": "test-key",
            "model": "claude-3-5-sonnet-20241022",
        }
        adapter = create_adapter(config)
        assert isinstance(adapter, AnthropicAdapter)
        assert adapter.provider_name == "anthropic"

    def test_create_adapter_openrouter(self):
        """Test creating OpenRouter adapter (uses OpenAI-compatible)."""
        config = {
            "provider": "openrouter",
            "api_key": "test-key",
            "model": "anthropic/claude-3.5-sonnet",
            "base_url": "https://openrouter.ai/api/v1",
        }
        adapter = create_adapter(config)
        assert isinstance(adapter, OpenAIAdapter)
        assert adapter.provider_name == "openai"

    def test_create_adapter_missing_api_key(self):
        """Test creating adapter with missing API key."""
        config = {
            "provider": "gemini",
            "model": "gemini-1.5-flash",
        }
        with pytest.raises(ValueError, match="API key required"):
            create_adapter(config)

    def test_create_adapter_missing_model(self):
        """Test creating adapter with missing model."""
        config = {
            "provider": "gemini",
            "api_key": "test-key",
        }
        with pytest.raises(ValueError, match="Model required"):
            create_adapter(config)

    def test_create_adapter_unsupported_provider(self):
        """Test creating adapter with unsupported provider."""
        config = {
            "provider": "unsupported",
            "api_key": "test-key",
            "model": "test-model",
        }
        with pytest.raises(ValueError, match="Unsupported provider"):
            create_adapter(config)


class TestGeminiAdapter:
    """Test Gemini adapter specifics."""

    @pytest.fixture
    def adapter(self):
        return GeminiAdapter(
            api_key="test-key",
            model="gemini-1.5-flash",
            base_url="https://generativelanguage.googleapis.com/v1beta",
        )

    def test_build_request(self, adapter):
        """Test building Gemini request."""
        messages = [
            LLMMessage(role="system", content="System prompt"),
            LLMMessage(role="user", content="User message"),
            LLMMessage(role="assistant", content="Assistant response"),
        ]
        request = adapter._build_request(messages, temperature=0.5, max_tokens=1000)
        
        assert "contents" in request
        assert "systemInstruction" in request
        assert "generationConfig" in request
        assert len(request["contents"]) == 2  # user + assistant (system separated)
        assert request["generationConfig"]["temperature"] == 0.5
        assert request["generationConfig"]["maxOutputTokens"] == 1000

    def test_parse_response(self, adapter):
        """Test parsing Gemini response."""
        response_data = {
            "candidates": [{
                "content": {
                    "parts": [{"text": "Hello, world!"}]
                }
            }],
            "usageMetadata": {
                "promptTokenCount": 10,
                "candidatesTokenCount": 5,
                "totalTokenCount": 15,
            }
        }
        parsed = adapter._parse_response(response_data)
        
        assert isinstance(parsed, LLMResponse)
        assert parsed.content == "Hello, world!"
        assert parsed.model == "gemini-1.5-flash"
        assert parsed.provider == "gemini"
        assert parsed.usage["prompt_tokens"] == 10
        assert parsed.usage["completion_tokens"] == 5

    def test_parse_response_empty(self, adapter):
        """Test parsing empty Gemini response."""
        response_data = {"candidates": []}
        with pytest.raises(LLMProviderError):
            adapter._parse_response(response_data)


class TestOpenAIAdapter:
    """Test OpenAI adapter specifics."""

    @pytest.fixture
    def adapter(self):
        return OpenAIAdapter(
            api_key="test-key",
            model="gpt-4o",
        )

    def test_build_request(self, adapter):
        """Test building OpenAI request."""
        messages = [
            LLMMessage(role="system", content="System prompt"),
            LLMMessage(role="user", content="User message"),
        ]
        request = adapter._build_request(messages, temperature=0.5, max_tokens=1000)
        
        assert request["model"] == "gpt-4o"
        assert len(request["messages"]) == 2
        assert request["messages"][0]["role"] == "system"
        assert request["messages"][1]["role"] == "user"
        assert request["temperature"] == 0.5
        assert request["max_tokens"] == 1000

    def test_parse_response(self, adapter):
        """Test parsing OpenAI response."""
        response_data = {
            "choices": [{
                "message": {
                    "content": "Hello, world!"
                }
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            }
        }
        parsed = adapter._parse_response(response_data)
        
        assert isinstance(parsed, LLMResponse)
        assert parsed.content == "Hello, world!"
        assert parsed.model == "gpt-4o"
        assert parsed.provider == "openai"
        assert parsed.usage["prompt_tokens"] == 10


class TestAnthropicAdapter:
    """Test Anthropic adapter specifics."""

    @pytest.fixture
    def adapter(self):
        return AnthropicAdapter(
            api_key="test-key",
            model="claude-3-5-sonnet-20241022",
        )

    def test_build_request(self, adapter):
        """Test building Anthropic request."""
        messages = [
            LLMMessage(role="system", content="System prompt"),
            LLMMessage(role="user", content="User message"),
        ]
        request = adapter._build_request(messages, temperature=0.5, max_tokens=1000)
        
        assert request["model"] == "claude-3-5-sonnet-20241022"
        assert request["system"] == "System prompt"
        assert len(request["messages"]) == 1
        assert request["messages"][0]["role"] == "user"
        assert request["max_tokens"] == 1000

    def test_parse_response(self, adapter):
        """Test parsing Anthropic response."""
        response_data = {
            "content": [{"type": "text", "text": "Hello, world!"}],
            "usage": {
                "input_tokens": 10,
                "output_tokens": 5,
            }
        }
        parsed = adapter._parse_response(response_data)
        
        assert isinstance(parsed, LLMResponse)
        assert parsed.content == "Hello, world!"
        assert parsed.provider == "anthropic"
        assert parsed.usage["prompt_tokens"] == 10
        assert parsed.usage["completion_tokens"] == 5


class TestModelRouter:
    """Test ModelRouter functionality."""

    @pytest.mark.asyncio
    async def test_initialize_primary_only(self):
        """Test router initialization with primary only."""
        with patch("app.core.model_router.get_settings") as mock_settings:
            mock_settings.return_value.llm.get_primary_config.return_value = {
                "provider": "gemini",
                "api_key": "test-key",
                "model": "gemini-1.5-flash",
            }
            mock_settings.return_value.llm.validate_required.return_value = []
            mock_settings.return_value.llm.get_secondary_config.return_value = None
            
            router = ModelRouter()
            await router.initialize()
            
            assert router.primary is not None
            assert router.secondary is None
            assert router._initialized is True

    @pytest.mark.asyncio
    async def test_initialize_with_secondary(self):
        """Test router initialization with secondary."""
        with patch("app.core.model_router.get_settings") as mock_settings:
            mock_settings.return_value.llm.get_primary_config.return_value = {
                "provider": "gemini",
                "api_key": "test-key",
                "model": "gemini-1.5-flash",
            }
            mock_settings.return_value.llm.validate_required.return_value = []
            mock_settings.return_value.llm.get_secondary_config.return_value = {
                "provider": "openai",
                "api_key": "test-key-2",
                "model": "gpt-4o",
            }
            
            router = ModelRouter()
            await router.initialize()
            
            assert router.primary is not None
            assert router.secondary is not None

    @pytest.mark.asyncio
    async def test_get_adapter(self):
        """Test getting adapter from router."""
        router = ModelRouter()
        router._primary_adapter = MagicMock()
        router._secondary_adapter = MagicMock()
        
        assert router.get_adapter() == router._primary_adapter
        assert router.get_adapter(use_secondary=True) == router._secondary_adapter

    @pytest.mark.asyncio
    async def test_health_check_all(self):
        """Test health check for all adapters."""
        router = ModelRouter()
        mock_primary = AsyncMock()
        mock_primary.health_check.return_value = {"provider": "gemini", "status": "connected"}
        mock_secondary = AsyncMock()
        mock_secondary.health_check.return_value = {"provider": "openai", "status": "connected"}
        router._primary_adapter = mock_primary
        router._secondary_adapter = mock_secondary
        
        results = await router.health_check_all()
        
        assert len(results) == 2
        assert results[0]["provider"] == "gemini"
        assert results[1]["provider"] == "openai"


class TestErrorHandling:
    """Test error handling in adapters."""

    @pytest.mark.asyncio
    async def test_retryable_errors(self):
        """Test that certain errors are retryable."""
        adapter = GeminiAdapter(api_key="test", model="test")
        
        # Rate limit should be retryable
        assert adapter._is_retryable_error(LLMRateLimitError("rate limit", "gemini", "test"))
        
        # Timeout should be retryable
        assert adapter._is_retryable_error(LLMTimeoutError("timeout", "gemini", "test"))
        
        # 5xx errors should be retryable
        import httpx
        response = MagicMock()
        response.status_code = 500
        assert adapter._is_retryable_error(httpx.HTTPStatusError("server error", request=None, response=response))
        
        # 429 should be retryable
        response.status_code = 429
        assert adapter._is_retryable_error(httpx.HTTPStatusError("rate limit", request=None, response=response))
        
        # 401 should NOT be retryable
        response.status_code = 401
        assert not adapter._is_retryable_error(httpx.HTTPStatusError("unauthorized", request=None, response=response))