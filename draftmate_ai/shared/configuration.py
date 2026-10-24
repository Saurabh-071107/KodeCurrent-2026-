"""Centralized configuration management for DraftMate AI using environment variables."""

import os
from functools import lru_cache
from typing import Optional, Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from draftmate_ai.shared.exceptions import ConfigurationError


class Settings(BaseSettings):
    """Application settings and configuration parameters."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Environment
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"

    # Model Provider Settings
    MODEL_PROVIDER: Literal["openai", "anthropic", "gemini", "ollama", "mock"] = "openai"
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API Key")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API Key")
    GEMINI_API_KEY: Optional[str] = Field(default=None, description="Google Gemini API Key")

    # Model Identifiers
    PRIMARY_MODEL: str = "gpt-4o"
    REASONING_MODEL: str = "o3-mini"
    FAST_MODEL: str = "gpt-4o-mini"

    # Embedding Configuration
    EMBEDDING_PROVIDER: Literal["openai", "gemini", "mock", "huggingface"] = "openai"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536
    EMBEDDING_BATCH_SIZE: int = 64

    # OCR Configuration
    OCR_ENABLED: bool = True
    OCR_ENGINE: Literal["tesseract", "mock"] = "tesseract"
    TESSERACT_CMD_PATH: Optional[str] = None
    OCR_LANGUAGE: str = "eng"
    OCR_DPI: int = 300
    OCR_CONFIDENCE_THRESHOLD: float = 60.0

    # Storage Paths & Limits
    STORAGE_DIR: str = "./data/storage"
    CACHE_DIR: str = "./data/cache"
    LOG_DIR: str = "./data/logs"
    MAX_FILE_SIZE_MB: int = 50

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = None

    # Chunking & Retrieval Defaults
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    MIN_CHUNK_SIZE: int = 100
    RETRIEVAL_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.70

    @field_validator("MAX_FILE_SIZE_MB")
    @classmethod
    def validate_max_file_size(cls, v: int) -> int:
        if v <= 0:
            raise ConfigurationError("MAX_FILE_SIZE_MB must be greater than 0.")
        return v

    @field_validator("CHUNK_SIZE")
    @classmethod
    def validate_chunk_size(cls, v: int) -> int:
        if v <= 50:
            raise ConfigurationError("CHUNK_SIZE must be at least 50 characters.")
        return v

    @field_validator("CHUNK_OVERLAP")
    @classmethod
    def validate_chunk_overlap(cls, v: int, info) -> int:
        chunk_size = info.data.get("CHUNK_SIZE", 800)
        if v < 0:
            raise ConfigurationError("CHUNK_OVERLAP cannot be negative.")
        if v >= chunk_size:
            raise ConfigurationError("CHUNK_OVERLAP must be strictly less than CHUNK_SIZE.")
        return v

    def validate_active_provider_key(self) -> None:
        """Validates that the active model provider has an API key set, raising ConfigurationError if missing."""
        if self.MODEL_PROVIDER == "openai" and not self.OPENAI_API_KEY:
            raise ConfigurationError(
                "OPENAI_API_KEY is required when MODEL_PROVIDER is 'openai'. Please set it in your environment or .env file."
            )
        elif self.MODEL_PROVIDER == "anthropic" and not self.ANTHROPIC_API_KEY:
            raise ConfigurationError(
                "ANTHROPIC_API_KEY is required when MODEL_PROVIDER is 'anthropic'. Please set it in your environment or .env file."
            )
        elif self.MODEL_PROVIDER == "gemini" and not self.GEMINI_API_KEY:
            raise ConfigurationError(
                "GEMINI_API_KEY is required when MODEL_PROVIDER is 'gemini'. Please set it in your environment or .env file."
            )

    @property
    def max_file_size_bytes(self) -> int:
        """Return maximum allowed file size in bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Obtain cached Settings singleton instance."""
    return Settings()


def reset_settings() -> None:
    """Clear cached Settings singleton instance (useful for testing dynamic env changes)."""
    get_settings.cache_clear()

