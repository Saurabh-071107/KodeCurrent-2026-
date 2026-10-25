"""Model router and LLM provider adapters."""
import json
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional

import httpx
import structlog
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.config import get_settings

logger = structlog.get_logger(__name__)


@dataclass
class LLMMessage:
    """A message in the conversation."""

    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class LLMResponse:
    """Structured response from LLM."""

    content: str
    model: str
    provider: str
    usage: Optional[dict[str, int]] = None
    latency_ms: int = 0


class LLMError(Exception):
    """Base exception for LLM errors."""

    def __init__(self, message: str, provider: str, model: str, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.provider = provider
        self.model = model
        self.original_error = original_error


class LLMAuthenticationError(LLMError):
    """Authentication/authorization error."""

    pass


class LLMRateLimitError(LLMError):
    """Rate limit exceeded."""

    pass


class LLMTimeoutError(LLMError):
    """Request timeout."""

    pass


class LLMProviderError(LLMError):
    """Provider returned an error."""

    pass


class LLMAdapter(ABC):
    """Abstract base class for LLM provider adapters."""

    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3,
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return provider name for logging/identification."""
        pass

    @abstractmethod
    def _build_request(self, messages: list[LLMMessage], **kwargs) -> dict[str, Any]:
        """Build provider-specific request payload."""
        pass

    @abstractmethod
    def _parse_response(self, response_data: dict[str, Any]) -> LLMResponse:
        """Parse provider-specific response into standard format."""
        pass

    @abstractmethod
    def _get_headers(self) -> dict[str, str]:
        """Get request headers."""
        pass

    @abstractmethod
    def _get_endpoint(self) -> str:
        """Get API endpoint URL."""
        pass

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout),
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _is_retryable_error(self, error: Exception) -> bool:
        """Determine if an error is retryable."""
        if isinstance(error, (LLMTimeoutError, LLMRateLimitError)):
            return True
        if isinstance(error, httpx.TimeoutException):
            return True
        if isinstance(error, httpx.HTTPStatusError):
            return error.response.status_code in (429, 500, 502, 503, 504)
        return False

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def _make_request_with_retry(
        self, client: httpx.AsyncClient, payload: dict[str, Any]
    ) -> httpx.Response:
        """Make HTTP request with retry logic."""
        response = await client.post(
            self._get_endpoint(),
            json=payload,
            headers=self._get_headers(),
        )
        response.raise_for_status()
        return response

    async def chat(self, messages: list[LLMMessage], **kwargs) -> LLMResponse:
        """Send chat completion request."""
        start_time = time.perf_counter()
        payload = self._build_request(messages, **kwargs)

        # Safe logging - no secrets or sensitive content
        logger.info(
            "llm_request",
            provider=self.provider_name,
            model=self.model,
            message_count=len(messages),
            total_chars=sum(len(m.content) for m in messages),
        )

        try:
            client = await self._get_client()
            response = await self._make_request_with_retry(client, payload)
            response_data = response.json()

            latency_ms = int((time.perf_counter() - start_time) * 1000)
            parsed = self._parse_response(response_data)
            parsed.latency_ms = latency_ms

            logger.info(
                "llm_response",
                provider=self.provider_name,
                model=self.model,
                latency_ms=latency_ms,
                response_chars=len(parsed.content),
            )
            return parsed

        except httpx.HTTPStatusError as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            if e.response.status_code == 401:
                raise LLMAuthenticationError(
                    f"Authentication failed: {e.response.text}",
                    self.provider_name,
                    self.model,
                    e,
                )
            elif e.response.status_code == 429:
                raise LLMRateLimitError(
                    f"Rate limit exceeded: {e.response.text}",
                    self.provider_name,
                    self.model,
                    e,
                )
            else:
                raise LLMProviderError(
                    f"Provider error ({e.response.status_code}): {e.response.text}",
                    self.provider_name,
                    self.model,
                    e,
                )
        except httpx.TimeoutException as e:
            raise LLMTimeoutError(
                f"Request timeout after {self.timeout}s",
                self.provider_name,
                self.model,
                e,
            )
        except Exception as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error(
                "llm_error",
                provider=self.provider_name,
                model=self.model,
                latency_ms=latency_ms,
                error_type=type(e).__name__,
                error=str(e),
            )
            raise LLMProviderError(
                f"Unexpected error: {str(e)}",
                self.provider_name,
                self.model,
                e,
            )

    async def health_check(self) -> dict[str, Any]:
        """Check provider connectivity."""
        start_time = time.perf_counter()
        try:
            # Simple test message
            test_messages = [LLMMessage(role="user", content="Health check - respond with 'OK'")]
            response = await self.chat(test_messages)
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return {
                "provider": self.provider_name,
                "model": self.model,
                "status": "connected",
                "latency_ms": latency_ms,
                "error": None,
            }
        except LLMAuthenticationError as e:
            return {
                "provider": self.provider_name,
                "model": self.model,
                "status": "error",
                "latency_ms": int((time.perf_counter() - start_time) * 1000),
                "error": f"Authentication failed: {str(e)}",
            }
        except LLMRateLimitError as e:
            return {
                "provider": self.provider_name,
                "model": self.model,
                "status": "error",
                "latency_ms": int((time.perf_counter() - start_time) * 1000),
                "error": f"Rate limited: {str(e)}",
            }
        except Exception as e:
            return {
                "provider": self.provider_name,
                "model": self.model,
                "status": "error",
                "latency_ms": int((time.perf_counter() - start_time) * 1000),
                "error": str(e),
            }


class GeminiAdapter(LLMAdapter):
    """Google Gemini API adapter."""

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _get_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

    def _get_endpoint(self) -> str:
        base = self.base_url or "https://generativelanguage.googleapis.com/v1beta"
        return f"{base}/models/{self.model}:generateContent"

    def _build_request(self, messages: list[LLMMessage], **kwargs) -> dict[str, Any]:
        # Convert messages to Gemini format
        contents = []
        system_instruction = None

        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
            elif msg.role == "user":
                contents.append({"role": "user", "parts": [{"text": msg.content}]})
            elif msg.role == "assistant":
                contents.append({"role": "model", "parts": [{"text": msg.content}]})

        request = {"contents": contents}
        if system_instruction:
            request["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        # Generation config
        generation_config = {
            "temperature": kwargs.get("temperature", 0.3),
            "topP": kwargs.get("top_p", 0.95),
            "topK": kwargs.get("top_k", 40),
            "maxOutputTokens": kwargs.get("max_tokens", 4096),
        }
        request["generationConfig"] = generation_config

        return request

    def _parse_response(self, response_data: dict[str, Any]) -> LLMResponse:
        try:
            candidates = response_data.get("candidates", [])
            if not candidates:
                raise LLMProviderError("No candidates in response", self.provider_name, self.model)

            candidate = candidates[0]
            content = candidate.get("content", {})
            parts = content.get("parts", [])
            text = "".join(part.get("text", "") for part in parts)

            usage = response_data.get("usageMetadata")
            usage_dict = None
            if usage:
                usage_dict = {
                    "prompt_tokens": usage.get("promptTokenCount", 0),
                    "completion_tokens": usage.get("candidatesTokenCount", 0),
                    "total_tokens": usage.get("totalTokenCount", 0),
                }

            return LLMResponse(
                content=text,
                model=self.model,
                provider=self.provider_name,
                usage=usage_dict,
            )
        except Exception as e:
            if isinstance(e, LLMProviderError):
                raise
            raise LLMProviderError(
                f"Failed to parse response: {str(e)}",
                self.provider_name,
                self.model,
                e,
            )


class OpenAIAdapter(LLMAdapter):
    """OpenAI-compatible API adapter (OpenAI, OpenRouter, etc.)."""

    @property
    def provider_name(self) -> str:
        return "openai"

    def _get_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def _get_endpoint(self) -> str:
        base = self.base_url or "https://api.openai.com/v1"
        return f"{base}/chat/completions"

    def _build_request(self, messages: list[LLMMessage], **kwargs) -> dict[str, Any]:
        formatted_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]

        return {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": kwargs.get("temperature", 0.3),
            "top_p": kwargs.get("top_p", 0.95),
            "max_tokens": kwargs.get("max_tokens", 4096),
        }

    def _parse_response(self, response_data: dict[str, Any]) -> LLMResponse:
        try:
            choices = response_data.get("choices", [])
            if not choices:
                raise LLMProviderError("No choices in response", self.provider_name, self.model)

            message = choices[0].get("message", {})
            content = message.get("content", "")

            usage = response_data.get("usage")
            usage_dict = None
            if usage:
                usage_dict = {
                    "prompt_tokens": usage.get("prompt_tokens", 0),
                    "completion_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0),
                }

            return LLMResponse(
                content=content,
                model=self.model,
                provider=self.provider_name,
                usage=usage_dict,
            )
        except Exception as e:
            if isinstance(e, LLMProviderError):
                raise
            raise LLMProviderError(
                f"Failed to parse response: {str(e)}",
                self.provider_name,
                self.model,
                e,
            )


class AnthropicAdapter(LLMAdapter):
    """Anthropic Claude API adapter."""

    @property
    def provider_name(self) -> str:
        return "anthropic"

    def _get_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
        }

    def _get_endpoint(self) -> str:
        base = self.base_url or "https://api.anthropic.com/v1"
        return f"{base}/messages"

    def _build_request(self, messages: list[LLMMessage], **kwargs) -> dict[str, Any]:
        # Separate system message
        system = None
        formatted_messages = []

        for msg in messages:
            if msg.role == "system":
                system = msg.content
            else:
                formatted_messages.append({"role": msg.role, "content": msg.content})

        request = {
            "model": self.model,
            "messages": formatted_messages,
            "max_tokens": kwargs.get("max_tokens", 4096),
            "temperature": kwargs.get("temperature", 0.3),
        }
        if system:
            request["system"] = system

        return request

    def _parse_response(self, response_data: dict[str, Any]) -> LLMResponse:
        try:
            content_blocks = response_data.get("content", [])
            text = "".join(block.get("text", "") for block in content_blocks if block.get("type") == "text")

            usage = response_data.get("usage")
            usage_dict = None
            if usage:
                usage_dict = {
                    "prompt_tokens": usage.get("input_tokens", 0),
                    "completion_tokens": usage.get("output_tokens", 0),
                    "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
                }

            return LLMResponse(
                content=text,
                model=self.model,
                provider=self.provider_name,
                usage=usage_dict,
            )
        except Exception as e:
            if isinstance(e, LLMProviderError):
                raise
            raise LLMProviderError(
                f"Failed to parse response: {str(e)}",
                self.provider_name,
                self.model,
                e,
            )


def create_adapter(config: dict[str, Any]) -> LLMAdapter:
    """Factory function to create adapter from config."""
    provider = config.get("provider", "").lower()
    api_key = config.get("api_key")
    model = config.get("model")
    base_url = config.get("base_url")
    timeout = config.get("timeout", 30)
    max_retries = config.get("max_retries", 3)

    if not api_key:
        raise ValueError(f"API key required for provider: {provider}")
    if not model:
        raise ValueError(f"Model required for provider: {provider}")

    adapters = {
        "gemini": GeminiAdapter,
        "openai": OpenAIAdapter,
        "openrouter": OpenAIAdapter,  # Uses OpenAI-compatible API
        "anthropic": AnthropicAdapter,
    }

    adapter_class = adapters.get(provider)
    if not adapter_class:
        raise ValueError(f"Unsupported provider: {provider}. Supported: {list(adapters.keys())}")

    return adapter_class(
        api_key=api_key,
        model=model,
        base_url=base_url,
        timeout=timeout,
        max_retries=max_retries,
    )


class ModelRouter:
    """Routes requests to appropriate LLM adapter."""

    def __init__(self):
        self._primary_adapter: Optional[LLMAdapter] = None
        self._secondary_adapter: Optional[LLMAdapter] = None
        self._initialized = False

    async def initialize(self):
        """Initialize adapters from configuration."""
        if self._initialized:
            return

        settings = get_settings()

        # Primary adapter
        primary_config = settings.llm.get_primary_config()
        missing = settings.llm.validate_required()
        if missing:
            logger.warning("Primary LLM not fully configured", missing=missing)
        else:
            try:
                self._primary_adapter = create_adapter(primary_config)
                logger.info("Primary LLM adapter initialized", **primary_config)
            except Exception as e:
                logger.error("Failed to initialize primary adapter", error=str(e))

        # Secondary adapter (optional)
        secondary_config = settings.llm.get_secondary_config()
        if secondary_config:
            try:
                self._secondary_adapter = create_adapter(secondary_config)
                logger.info("Secondary LLM adapter initialized", **secondary_config)
            except Exception as e:
                logger.error("Failed to initialize secondary adapter", error=str(e))

        self._initialized = True

    @property
    def primary(self) -> Optional[LLMAdapter]:
        return self._primary_adapter

    @property
    def secondary(self) -> Optional[LLMAdapter]:
        return self._secondary_adapter

    def get_adapter(self, use_secondary: bool = False) -> Optional[LLMAdapter]:
        """Get adapter, optionally preferring secondary."""
        if use_secondary and self._secondary_adapter:
            return self._secondary_adapter
        return self._primary_adapter

    async def health_check_all(self) -> list[dict[str, Any]]:
        """Check health of all configured adapters."""
        results = []
        if self._primary_adapter:
            results.append(await self._primary_adapter.health_check())
        if self._secondary_adapter:
            results.append(await self._secondary_adapter.health_check())
        return results

    async def close(self):
        """Close all adapters."""
        if self._primary_adapter:
            await self._primary_adapter.close()
        if self._secondary_adapter:
            await self._secondary_adapter.close()


# Global router instance
_router: Optional[ModelRouter] = None


def get_router() -> ModelRouter:
    """Get global model router instance."""
    global _router
    if _router is None:
        _router = ModelRouter()
    return _router


async def initialize_router():
    """Initialize the global router."""
    router = get_router()
    await router.initialize()