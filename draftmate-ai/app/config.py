"""Configuration management for DraftMate AI."""
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional, Union

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine project root and absolute path to .env
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

# Load local .env from project root without overriding existing environment variables
if ENV_FILE.is_file():
    load_dotenv(dotenv_path=ENV_FILE, override=False)


class LLMSettings(BaseSettings):
    """LLM Provider configuration."""

    provider: str = Field(default="gemini", alias="LLM_PROVIDER")
    base_url: Optional[str] = Field(default=None, alias="LLM_BASE_URL")
    api_key: Optional[str] = Field(default=None, alias="LLM_API_KEY")
    model: Optional[str] = Field(default=None, alias="LLM_MODEL")
    timeout: int = Field(default=30, alias="LLM_TIMEOUT")
    max_retries: int = Field(default=3, alias="LLM_MAX_RETRIES")

    # Secondary provider (optional)
    provider_secondary: Optional[str] = Field(default=None, alias="LLM_PROVIDER_SECONDARY")
    base_url_secondary: Optional[str] = Field(default=None, alias="LLM_BASE_URL_SECONDARY")
    api_key_secondary: Optional[str] = Field(default=None, alias="LLM_API_KEY_SECONDARY")
    model_secondary: Optional[str] = Field(default=None, alias="LLM_MODEL_SECONDARY")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    @field_validator("provider", "provider_secondary", mode="before")
    @classmethod
    def validate_provider(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.lower().strip()

    def get_primary_config(self) -> dict:
        """Get primary provider configuration as dict."""
        return {
            "provider": self.provider,
            "base_url": self.base_url,
            "api_key": self.api_key,
            "model": self.model,
            "timeout": self.timeout,
            "max_retries": self.max_retries,
        }

    def get_secondary_config(self) -> Optional[dict]:
        """Get secondary provider configuration as dict, if configured."""
        if not self.provider_secondary:
            return None
        return {
            "provider": self.provider_secondary,
            "base_url": self.base_url_secondary,
            "api_key": self.api_key_secondary,
            "model": self.model_secondary,
            "timeout": self.timeout,
            "max_retries": self.max_retries,
        }

    def validate_required(self) -> list[str]:
        """Validate required fields are present. Returns list of missing fields."""
        missing = []
        if not self.api_key:
            missing.append("LLM_API_KEY")
        if not self.model:
            missing.append("LLM_MODEL")
        if not self.provider:
            missing.append("LLM_PROVIDER")
        return missing


class EmbeddingSettings(BaseSettings):
    """Embedding configuration (separate from LLM)."""

    provider: str = Field(default="local", alias="EMBEDDING_PROVIDER")
    model: str = Field(default="all-MiniLM-L6-v2", alias="EMBEDDING_MODEL")
    base_url: Optional[str] = Field(default=None, alias="EMBEDDING_BASE_URL")
    api_key: Optional[str] = Field(default=None, alias="EMBEDDING_API_KEY")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("provider", mode="before")
    @classmethod
    def validate_provider(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.lower().strip()


class DocumentSettings(BaseSettings):
    """Document processing configuration."""

    upload_dir: str = Field(default="./uploads", alias="DOCUMENT_UPLOAD_DIR")
    max_file_size_mb: int = Field(default=50, alias="DOCUMENT_MAX_FILE_SIZE_MB")
    allowed_extensions: Union[list[str], str] = Field(
        default=[".pdf", ".docx", ".txt"], alias="DOCUMENT_ALLOWED_EXTENSIONS"
    )
    chunk_size: int = Field(default=500, alias="DOCUMENT_CHUNK_SIZE")
    chunk_overlap: int = Field(default=100, alias="DOCUMENT_CHUNK_OVERLAP")
    retrieval_limit: int = Field(default=10, alias="DOCUMENT_RETRIEVAL_LIMIT")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_extensions", mode="after")
    @classmethod
    def parse_allowed_extensions(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",") if ext.strip()]
        return v


class ServerSettings(BaseSettings):
    """Server configuration."""

    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class StyleSettings(BaseSettings):
    """Style adaptation configuration."""

    upload_dir: str = Field(default="./styles", alias="STYLE_UPLOAD_DIR")
    max_file_size_mb: int = Field(default=50, alias="STYLE_MAX_FILE_SIZE_MB")
    allowed_extensions: Union[list[str], str] = Field(
        default=[".pdf", ".docx"], alias="STYLE_ALLOWED_EXTENSIONS"
    )

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_extensions", mode="after")
    @classmethod
    def parse_allowed_extensions(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",") if ext.strip()]
        return v


class ExportSettings(BaseSettings):
    """Document export configuration."""

    output_dir: str = Field(default="./exports", alias="EXPORT_OUTPUT_DIR")
    max_file_age_hours: int = Field(default=24, alias="EXPORT_MAX_FILE_AGE_HOURS")
    libreoffice_path: Optional[str] = Field(default=None, alias="LIBREOFFICE_PATH")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class VoiceSettings(BaseSettings):
    """Voice agent configuration."""

    stt_provider: str = Field(default="openai", alias="VOICE_STT_PROVIDER")
    stt_model: str = Field(default="whisper-1", alias="VOICE_STT_MODEL")
    stt_api_key: Optional[str] = Field(default=None, alias="VOICE_STT_API_KEY")
    stt_base_url: Optional[str] = Field(default=None, alias="VOICE_STT_BASE_URL")

    tts_provider: str = Field(default="openai", alias="VOICE_TTS_PROVIDER")
    tts_model: str = Field(default="tts-1", alias="VOICE_TTS_MODEL")
    tts_voice: str = Field(default="alloy", alias="VOICE_TTS_VOICE")
    tts_api_key: Optional[str] = Field(default=None, alias="VOICE_TTS_API_KEY")
    tts_base_url: Optional[str] = Field(default=None, alias="VOICE_TTS_BASE_URL")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class Settings(BaseSettings):
    """Application settings."""

    llm: LLMSettings = Field(default_factory=LLMSettings)
    embedding: EmbeddingSettings = Field(default_factory=EmbeddingSettings)
    document: DocumentSettings = Field(default_factory=DocumentSettings)
    style: StyleSettings = Field(default_factory=StyleSettings)
    export: ExportSettings = Field(default_factory=ExportSettings)
    voice: VoiceSettings = Field(default_factory=VoiceSettings)
    server: ServerSettings = Field(default_factory=ServerSettings)

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=("settings_",),
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def validate_startup_config() -> list[str]:
    """Validate configuration at startup. Returns list of errors."""
    settings = get_settings()
    errors = []

    # Check primary LLM config
    missing = settings.llm.validate_required()
    for field in missing:
        errors.append(f"Missing required configuration: {field}")

    return errors