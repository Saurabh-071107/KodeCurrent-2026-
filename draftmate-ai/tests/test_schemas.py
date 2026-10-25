"""Tests for schemas and configuration."""
import pytest
from datetime import date
from pydantic import ValidationError

from app.config import Settings, LLMSettings, ServerSettings, validate_startup_config
from app.schemas import (
    DocumentType,
    Jurisdiction,
    PartyRole,
    PartyInfo,
    DateInfo,
    FactExtractionRequest,
    FactExtractionResponse,
    ExtractedFact,
    PartyRoleInfo,
    DraftRequest,
    DraftResponse,
    DraftSection,
    HealthResponse,
    LLMHealthResponse,
    ErrorResponse,
)


class TestSchemas:
    """Test Pydantic schemas."""

    def test_document_type_enum(self):
        """Test DocumentType enum values."""
        assert DocumentType.LEGAL_NOTICE == "legal_notice"
        assert DocumentType.FORMAL_LETTER == "formal_letter"
        assert DocumentType.AGREEMENT == "agreement"
        assert DocumentType.DEMAND_LETTER == "demand_letter"
        assert DocumentType.CEASE_DESIST == "cease_desist"

    def test_jurisdiction_enum(self):
        """Test Jurisdiction enum values."""
        assert Jurisdiction.US_CA == "us_ca"
        assert Jurisdiction.US_NY == "us_ny"
        assert Jurisdiction.OTHER == "other"

    def test_party_role_enum(self):
        """Test PartyRole enum values."""
        assert PartyRole.CLAIMANT == "claimant"
        assert PartyRole.SENDER == "sender"
        assert PartyRole.RECIPIENT == "recipient"
        assert PartyRole.PARTY_A == "party_a"

    def test_party_info_valid(self):
        """Test valid PartyInfo."""
        party = PartyInfo(
            name="John Doe",
            role=PartyRole.SENDER,
            address="123 Main St",
            contact="john@example.com",
            represented_by="Jane Lawyer",
        )
        assert party.name == "John Doe"
        assert party.role == PartyRole.SENDER

    def test_party_info_minimal(self):
        """Test PartyInfo with only required fields."""
        party = PartyInfo(name="Jane Doe", role=PartyRole.RECIPIENT)
        assert party.name == "Jane Doe"
        assert party.role == PartyRole.RECIPIENT
        assert party.address is None

    def test_party_info_invalid_name(self):
        """Test PartyInfo with empty name."""
        with pytest.raises(ValidationError):
            PartyInfo(name="", role=PartyRole.SENDER)

    def test_date_info_valid(self):
        """Test valid DateInfo."""
        d = DateInfo(date=date(2024, 1, 15), description="Move-out date", is_approximate=False)
        assert d.date == date(2024, 1, 15)
        assert d.is_approximate is False

    def test_date_info_approximate(self):
        """Test DateInfo with approximate flag."""
        d = DateInfo(date=date(2024, 3, 1), description="Approximate date", is_approximate=True)
        assert d.is_approximate is True

    def test_fact_extraction_request_valid(self):
        """Test valid FactExtractionRequest."""
        request = FactExtractionRequest(
            problem_description="This is a detailed problem description that is long enough.",
            document_type=DocumentType.DEMAND_LETTER,
            objective="Recover damages",
        )
        assert request.problem_description == "This is a detailed problem description that is long enough."
        assert request.document_type == DocumentType.DEMAND_LETTER

    def test_fact_extraction_request_short_description(self):
        """Test FactExtractionRequest with too short description."""
        with pytest.raises(ValidationError):
            FactExtractionRequest(
                problem_description="Short",
                document_type=DocumentType.DEMAND_LETTER,
                objective="Test",
            )

    def test_fact_extraction_request_empty_objective(self):
        """Test FactExtractionRequest with empty objective."""
        with pytest.raises(ValidationError):
            FactExtractionRequest(
                problem_description="This is a valid problem description.",
                document_type=DocumentType.DEMAND_LETTER,
                objective="",
            )

    def test_fact_extraction_request_with_all_fields(self):
        """Test FactExtractionRequest with all optional fields."""
        request = FactExtractionRequest(
            problem_description="This is a detailed problem description that is long enough.",
            document_type=DocumentType.AGREEMENT,
            jurisdiction=Jurisdiction.US_CA,
            parties=[
                PartyInfo(name="Party A", role=PartyRole.PARTY_A),
                PartyInfo(name="Party B", role=PartyRole.PARTY_B),
            ],
            important_dates=[
                DateInfo(date=date(2024, 1, 1), description="Start date"),
            ],
            objective="Create agreement",
            context="Additional context here",
        )
        assert request.jurisdiction == Jurisdiction.US_CA
        assert len(request.parties) == 2
        assert len(request.important_dates) == 1
        assert request.context == "Additional context here"

    def test_extracted_fact_valid(self):
        """Test valid ExtractedFact."""
        fact = ExtractedFact(
            fact="Security deposit is $2000",
            source_text="deposit of $2000",
            confidence=0.9,
            is_assumption=False,
        )
        assert fact.confidence == 0.9
        assert fact.is_assumption is False

    def test_extracted_fact_confidence_bounds(self):
        """Test ExtractedFact confidence bounds."""
        with pytest.raises(ValidationError):
            ExtractedFact(fact="Test", source_text="Test", confidence=1.5)
        with pytest.raises(ValidationError):
            ExtractedFact(fact="Test", source_text="Test", confidence=-0.1)

    def test_party_role_info_valid(self):
        """Test valid PartyRoleInfo."""
        party = PartyRoleInfo(
            name="John Doe",
            role=PartyRole.SENDER,
            confidence=0.95,
            reasoning="User identified as sender",
        )
        assert party.confidence == 0.95

    def test_fact_extraction_response_valid(self):
        """Test valid FactExtractionResponse."""
        response = FactExtractionResponse(
            desired_outcome="Recover deposit",
        )
        assert response.desired_outcome == "Recover deposit"
        assert response.user_provided_facts == []
        assert response.missing_information == []

    def test_draft_section_valid(self):
        """Test valid DraftSection."""
        section = DraftSection(
            title="Header",
            content="Content here",
            order=0,
            is_placeholder=True,
        )
        assert section.title == "Header"
        assert section.is_placeholder is True

    def test_draft_response_valid(self):
        """Test valid DraftResponse."""
        response = DraftResponse(
            document_type=DocumentType.DEMAND_LETTER,
            title="Demand Letter",
            sections=[
                DraftSection(title="Header", content="Content", order=0),
            ],
        )
        assert response.document_type == DocumentType.DEMAND_LETTER
        assert len(response.sections) == 1
        assert "legal advice" in response.disclaimer.lower()

    def test_draft_request_valid(self):
        """Test valid DraftRequest."""
        request = DraftRequest(
            document_type=DocumentType.LEGAL_NOTICE,
            facts=FactExtractionResponse(desired_outcome="Test"),
        )
        assert request.document_type == DocumentType.LEGAL_NOTICE

    def test_health_response(self):
        """Test HealthResponse."""
        response = HealthResponse(status="healthy", timestamp="2024-01-01T00:00:00Z")
        assert response.status == "healthy"
        assert response.version == "1.0.0"

    def test_llm_health_response(self):
        """Test LLMHealthResponse."""
        response = LLMHealthResponse(
            provider="gemini",
            model="gemini-1.5-flash",
            status="connected",
            latency_ms=100,
        )
        assert response.provider == "gemini"
        assert response.latency_ms == 100

    def test_error_response(self):
        """Test ErrorResponse."""
        response = ErrorResponse(
            error="validation_error",
            message="Invalid input",
            details={"field": "problem_description"},
        )
        assert response.error == "validation_error"
        assert response.details["field"] == "problem_description"


class TestConfig:
    """Test configuration management."""

    def test_llm_settings_defaults(self):
        """Test LLMSettings defaults."""
        settings = LLMSettings(
            provider="gemini",
            api_key="test-key",
            model="gemini-1.5-flash",
        )
        assert settings.timeout == 30
        assert settings.max_retries == 3
        assert settings.provider_secondary is None

    def test_llm_settings_provider_lowercase(self):
        """Test provider is lowercased."""
        settings = LLMSettings(
            provider="GEMINI",
            api_key="test-key",
            model="gemini-1.5-flash",
        )
        assert settings.provider == "gemini"

    def test_llm_settings_validate_required(self, monkeypatch):
        """Test validation of required fields."""
        monkeypatch.delenv("LLM_API_KEY", raising=False)
        monkeypatch.delenv("LLM_MODEL", raising=False)
        settings = LLMSettings(provider="gemini", _env_file=None)
        missing = settings.validate_required()
        assert "LLM_API_KEY" in missing
        assert "LLM_MODEL" in missing

    def test_llm_settings_get_primary_config(self):
        """Test getting primary config dict."""
        settings = LLMSettings(
            LLM_PROVIDER="gemini",
            LLM_API_KEY="test-key",
            LLM_MODEL="gemini-1.5-flash",
            LLM_BASE_URL="https://custom.url",
            LLM_TIMEOUT=60,
            LLM_MAX_RETRIES=5,
        )
        config = settings.get_primary_config()
        assert config["provider"] == "gemini"
        assert config["api_key"] == "test-key"
        assert config["model"] == "gemini-1.5-flash"
        assert config["base_url"] == "https://custom.url"
        assert config["timeout"] == 60
        assert config["max_retries"] == 5

    def test_llm_settings_get_secondary_config_none(self):
        """Test getting secondary config when not set."""
        settings = LLMSettings(
            provider="gemini",
            api_key="test-key",
            model="gemini-1.5-flash",
        )
        assert settings.get_secondary_config() is None

    def test_llm_settings_get_secondary_config_set(self):
        """Test getting secondary config when set."""
        settings = LLMSettings(
            LLM_PROVIDER="gemini",
            LLM_API_KEY="test-key",
            LLM_MODEL="gemini-1.5-flash",
            LLM_PROVIDER_SECONDARY="openai",
            LLM_API_KEY_SECONDARY="key2",
            LLM_MODEL_SECONDARY="gpt-4o",
        )
        config = settings.get_secondary_config()
        assert config is not None
        assert config["provider"] == "openai"
        assert config["api_key"] == "key2"
        assert config["model"] == "gpt-4o"

    def test_server_settings_defaults(self):
        """Test ServerSettings defaults."""
        settings = ServerSettings()
        assert settings.host == "0.0.0.0"
        assert settings.port == 8000
        assert settings.log_level == "INFO"

    def test_settings_combined(self):
        """Test combined Settings."""
        settings = Settings()
        assert isinstance(settings.llm, LLMSettings)
        assert isinstance(settings.server, ServerSettings)

    def test_validate_startup_config(self):
        """Test startup config validation."""
        # This will use actual settings, so we test the function exists
        errors = validate_startup_config()
        # Should return a list (may have errors if not configured)
        assert isinstance(errors, list)