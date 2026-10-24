"""Tests for configuration validation, environment parsing, and provider keys."""

import pytest
from draftmate_ai.shared.configuration import Settings, get_settings, reset_settings
from draftmate_ai.shared.exceptions import ConfigurationError


def test_settings_defaults():
    """Test standard default settings values."""
    settings = Settings()
    assert settings.CHUNK_SIZE == 800
    assert settings.CHUNK_OVERLAP == 150
    assert settings.MAX_FILE_SIZE_MB == 50
    assert settings.OCR_ENABLED is True


def test_settings_validation_invalid_chunk_overlap():
    """Test that chunk overlap >= chunk size raises ConfigurationError."""
    with pytest.raises(ConfigurationError):
        Settings(CHUNK_SIZE=500, CHUNK_OVERLAP=500)

    with pytest.raises(ConfigurationError):
        Settings(CHUNK_SIZE=500, CHUNK_OVERLAP=600)


def test_settings_provider_key_validation():
    """Test that validate_active_provider_key raises ConfigurationError when key is missing."""
    settings = Settings(MODEL_PROVIDER="openai", OPENAI_API_KEY=None)
    with pytest.raises(ConfigurationError):
        settings.validate_active_provider_key()

    # Valid when key is supplied
    valid_settings = Settings(MODEL_PROVIDER="openai", OPENAI_API_KEY="sk-test-key")
    valid_settings.validate_active_provider_key()  # Should not raise

