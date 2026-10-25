"""Tests for Chunk 4: Style Adaptation, Export, and Voice Agent."""
import json
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
import io

from app.main import app
from app.schemas import (
    DraftResponse, FactExtractionResponse, DocumentType, Jurisdiction,
    DraftSection, PartyRoleInfo, PartyRole, DateInfo, ExtractedFact,
    StyleProfile, ExportFormat, VoiceCommandType, FindingSeverity,
    RedlineOperation, RedlineOperationType,
)
from tests.conftest import mock_adapter, mock_router


class TestStyleExtractionEndpoint:
    """Test POST /style/extract endpoint."""

    @pytest.mark.asyncio
    async def test_style_extraction_success(self, mock_router, mock_adapter):
        """Test successful style profile extraction."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "heading_styles": [{"level": 1, "numbering": "1.", "format": "bold"}],
            "paragraph_style": {"indentation": "first_line", "line_spacing": "1.15"},
            "list_styles": [{"type": "bullet", "symbol": "•"}],
            "tone_indicators": {"formality": "formal"},
            "avg_sentence_length": 18.5,
            "sentence_complexity": "moderate",
            "defined_terms": [{"term": "Agreement", "definition": "This Agreement"}],
            "preferred_terms": {"shall": "must"},
            "avoid_terms": ["hereby"],
            "table_style": {"borders": "grid"},
            "signature_blocks": [{"layout": "block"}]
        })
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            # Need a document first - use unique ID to avoid conflicts
            from app.core.storage import get_document_store
            from app.features.chunking import get_chunk_store, DocumentChunk
            doc_store = get_document_store()
            chunk_store = get_chunk_store()
            chunk_store.clear()
            
            # Use unique document ID to avoid UNIQUE constraint conflicts
            doc_id = f"test-doc-{uuid.uuid4().hex[:8]}"
            
            chunk = DocumentChunk(
                chunk_id="chunk_1",
                document_id=doc_id,
                text="This is a test legal document with formal tone.",
                page_number=1,
                source_filename="test.docx",
                file_type="docx",
                start_char=0,
                end_char=50,
            )
            chunk_store.add_chunks([chunk])
            
            # Create document record
            from app.core.storage import DocumentRecord
            from datetime import datetime
            record = DocumentRecord(
                id=doc_id,
                filename="style_ref.docx",
                file_type="docx",
                file_size=1000,
                upload_timestamp=datetime.utcnow(),
                extraction_status="completed",
                extraction_error=None,
                metadata={},
                chunk_count=1,
            )
            await doc_store.create(record)
            
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = {"document_id": doc_id}
                response = await client.post("/style/extract", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "profile" in data
            assert "profile_id" in data["profile"]
            assert "heading_styles" in data["profile"]
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_style_extraction_invalid_document(self, mock_router, mock_adapter):
        """Test style extraction with non-existent document."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/style/extract", json={"document_id": "non-existent"})
            
            assert response.status_code == 400
            data = response.json()
            assert "not found" in data["message"].lower() or "no chunks" in data["message"].lower()
        finally:
            mr._router = original


class TestStyleApplicationEndpoint:
    """Test POST /style/apply endpoint."""

    @pytest.mark.asyncio
    async def test_style_application_success(self, mock_router, mock_adapter):
        """Test successful style application."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "restyled_draft": {
                "document_type": "demand_letter",
                "title": "Demand Letter",
                "sections": [
                    {"title": "Header", "content": "John Doe\nJanuary 15, 2024\n\nABC Corp\n\nRe: Demand", "order": 0, "is_placeholder": True},
                    {"title": "Body", "content": "Dear ABC Corp,\n\nI must demand payment...", "order": 1, "is_placeholder": False}
                ],
                "assumptions": [],
                "warnings": [],
                "placeholders": [],
                "review_status": "draft_needs_review",
                "disclaimer": "Test disclaimer"
            },
            "changes_summary": [
                {"type": "terminology", "location": "Section 2", "description": "Replaced 'shall' with 'must'"}
            ],
            "warnings": ["Legal conclusion preserved"]
        })
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = {
                    "draft": _build_minimal_draft(),
                    "profile": _build_style_profile(),
                    "preserve_content": True,
                    "target_sections": None
                }
                response = await client.post("/style/apply", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "restyled_draft" in data
            assert "changes_summary" in data
            assert len(data["changes_summary"]) == 1
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_style_application_invalid_input(self):
        """Test style application with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/style/apply", json={})
        
        assert response.status_code == 422


class TestExportEndpoint:
    """Test POST /export endpoint."""

    @pytest.mark.asyncio
    async def test_export_docx_success(self, mock_router, mock_adapter):
        """Test successful DOCX export."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            request_data = {
                "draft": _build_minimal_draft(),
                "format": "docx",
                "include_comments": False,
                "include_changes_summary": False
            }
            response = await client.post("/export", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        assert "filename" in data
        assert data["format"] == "docx"
        assert "download_url" in data
        assert "expires_at" in data
        assert "file_size_bytes" in data

    @pytest.mark.asyncio
    async def test_export_pdf_no_libreoffice(self, mock_router, mock_adapter):
        """Test PDF export when LibreOffice is not available."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            request_data = {
                "draft": _build_minimal_draft(),
                "format": "pdf",
                "include_comments": False,
                "include_changes_summary": False
            }
            response = await client.post("/export", json=request_data)
        
        # Should return 200 but with DOCX format (fallback)
        assert response.status_code == 200
        data = response.json()
        # May return PDF if LibreOffice available, or DOCX as fallback
        assert data["format"] in ["docx", "pdf"]

    @pytest.mark.asyncio
    async def test_export_invalid_format(self):
        """Test export with invalid format."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            request_data = {
                "draft": _build_minimal_draft(),
                "format": "invalid"
            }
            response = await client.post("/export", json=request_data)
        
        assert response.status_code == 422


class TestVoiceCommandEndpoint:
    """Test POST /voice/command endpoint."""

    @pytest.mark.asyncio
    async def test_voice_command_summarize(self, mock_router, mock_adapter):
        """Test voice command for summarization."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "command_type": "summarize",
            "response_text": "This is a demand letter for a security deposit of $2,000.",
            "action_required": False,
            "proposed_changes": None,
            "target_location": None,
            "explanation": "Provided summary of the draft",
            "requires_confirmation": False
        })
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = {
                    "command_text": "Summarize this draft",
                    "draft": _build_minimal_draft(),
                    "facts": _build_minimal_facts()
                }
                response = await client.post("/voice/command", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["command_type"] == "summarize"
            assert "response_text" in data
            assert data["action_required"] is False
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_voice_command_revise_with_confirmation(self, mock_router, mock_adapter):
        """Test voice command for revision requiring confirmation."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "command_type": "revise_paragraph",
            "response_text": "I'll revise paragraph 2 to be more formal.",
            "action_required": True,
            "proposed_changes": [
                {
                    "operation_id": "voice_redline_1",
                    "operation_type": "replace",
                    "target_location": "Section 'Body'",
                    "original_text": "Dear ABC Corp,\n\nI demand payment of $2,000.",
                    "proposed_text": "Dear ABC Corp,\n\nI formally demand payment of $2,000.",
                    "explanation": "Made language more formal",
                    "risk_level": "high",
                    "related_finding_ids": [],
                    "evidence_ids": [],
                    "depends_on": []
                }
            ],
            "target_location": "Section 'Body'",
            "explanation": "Proposed revision to make language more formal",
            "requires_confirmation": True
        })
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        import os
        original = mr._router
        mr._router = mock_router
        
        # Set environment variables for voice configuration (is_voice_configured reads from settings)
        os.environ["VOICE_STT_PROVIDER"] = "local"
        os.environ["VOICE_STT_MODEL"] = "base"
        os.environ["VOICE_TTS_PROVIDER"] = "local"
        os.environ["VOICE_TTS_MODEL"] = "tts-1"
        os.environ["VOICE_TTS_VOICE"] = "alloy"
        # Clear any API keys that might override local provider
        os.environ.pop("VOICE_STT_API_KEY", None)
        os.environ.pop("VOICE_TTS_API_KEY", None)
        
        # Need to reload settings to pick up new env vars
        import app.config as config_module
        config_module.get_settings.cache_clear()
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = {
                    "command_text": "Make paragraph 2 more formal",
                    "draft": _build_minimal_draft(),
                    "facts": _build_minimal_facts()
                }
                response = await client.post("/voice/command", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["command_type"] == "revise_paragraph"
            assert data["action_required"] is True
            assert data["requires_confirmation"] is True
            assert "proposed_changes" in data
        finally:
            mr._router = original
            # Restore env
            os.environ.pop("VOICE_STT_PROVIDER", None)
            os.environ.pop("VOICE_STT_MODEL", None)
            os.environ.pop("VOICE_TTS_PROVIDER", None)
            os.environ.pop("VOICE_TTS_MODEL", None)
            os.environ.pop("VOICE_TTS_VOICE", None)
            config_module.get_settings.cache_clear()

    @pytest.mark.asyncio
    async def test_voice_command_invalid_input(self):
        """Test voice command with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/voice/command", json={})
        
        assert response.status_code == 422


class TestVoiceConfigureEndpoint:
    """Test POST /voice/configure endpoint."""

    @pytest.mark.asyncio
    async def test_voice_configure_success(self):
        """Test voice provider configuration."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            request_data = {
                "config": {
                    "stt_provider": "local",
                    "stt_model": "base",
                    "tts_provider": "local",
                    "tts_model": "tts-1",
                    "tts_voice": "alloy"
                }
            }
            response = await client.post("/voice/configure", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "stt_configured" in data
        assert "tts_configured" in data
        assert "message" in data


# Helper functions for test data
from datetime import date, datetime

def _build_minimal_draft() -> dict:
    return {
        "document_type": "demand_letter",
        "title": "Demand Letter",
        "sections": [
            {"title": "Header", "content": "John Doe\n[DATE]\n\nABC Corp\n\nRe: Demand", "order": 0, "is_placeholder": True},
            {"title": "Body", "content": "Dear ABC Corp,\n\nI demand payment of $2,000.", "order": 1, "is_placeholder": False}
        ],
        "assumptions": [],
        "warnings": [],
        "placeholders": ["[DATE]"],
        "review_status": "draft_needs_review",
        "disclaimer": "Test disclaimer"
    }


def _build_minimal_facts() -> dict:
    return {
        "user_provided_facts": [
            {"fact": "Security deposit is $2,000", "source_text": "deposit of $2,000", "confidence": 1.0, "is_assumption": False}
        ],
        "inferred_facts": [],
        "parties_and_roles": [
            {"name": "John Doe", "role": "sender", "confidence": 1.0, "reasoning": "User is sender"}
        ],
        "important_dates": [
            {"date": "2024-01-15", "description": "Move-out date", "is_approximate": False}
        ],
        "desired_outcome": "Recover deposit",
        "missing_information": ["Exact date"],
        "contradictions": [],
        "follow_up_questions": [],
        "assumptions": ["California law applies"],
        "uncertainties": []
    }


def _build_style_profile() -> dict:
    return {
        "profile_id": "test-profile-1",
        "source_document_id": "doc-1",
        "source_filename": "reference.docx",
        "heading_styles": [{"level": 1, "numbering": "1.", "format": "bold"}],
        "paragraph_style": {"indentation": "first_line", "line_spacing": "1.15"},
        "list_styles": [{"type": "bullet", "symbol": "•"}],
        "tone_indicators": {"formality": "formal"},
        "avg_sentence_length": 18.5,
        "sentence_complexity": "moderate",
        "defined_terms": [{"term": "Agreement", "definition": "This Agreement"}],
        "preferred_terms": {"shall": "must"},
        "avoid_terms": ["hereby"],
        "table_style": {"borders": "grid"},
        "signature_blocks": [{"layout": "block"}]
    }