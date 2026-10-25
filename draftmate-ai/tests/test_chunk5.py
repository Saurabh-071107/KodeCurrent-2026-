"""Tests for Chunk 5: Legal Assistant, Summarization, Document Q&A, and External Document Review."""
import io
import json
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.schemas import (
    Jurisdiction,
    DocumentType,
    FindingSeverity,
    RetrievalResult,
)
from app.core.storage import get_document_store
from app.features.chunking import get_chunk_store
from app.features.retriever_instance import get_retriever
from tests.conftest import mock_adapter, mock_router


@pytest.fixture(autouse=True)
async def clear_stores():
    """Clear stores before each test."""
    doc_store = get_document_store()
    chunk_store = get_chunk_store()
    retriever = get_retriever()
    chunk_store.clear()
    docs = await doc_store.list(limit=1000)
    for doc in docs:
        await doc_store.delete(doc.id)
    retriever.build_index([])
    yield
    chunk_store.clear()
    docs = await doc_store.list(limit=1000)
    for doc in docs:
        await doc_store.delete(doc.id)
    retriever.build_index([])


class TestLegalAssistantEndpoint:
    """Test POST /assistant/legal endpoint."""

    @pytest.mark.asyncio
    async def test_legal_assistant_success(self, mock_router, mock_adapter):
        """Test asking general legal questions."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "answer": "Under Indian Contract Act, 1872, Section 10 requires free consent, competent parties, lawful consideration, and lawful object.",
            "sources": [
                {"title": "Indian Contract Act, 1872", "url": "https://legislative.gov.in/actsofparliamentfromtheyear/indian-contract-act-1872", "excerpt": "Section 10 - What agreements are contracts", "jurisdiction": "India"}
            ],
            "confidence": 0.9,
            "disclaimer": "This is general legal information, not legal advice.",
            "limitations": ["Applies to civil contracts only; specific statutes may impose additional requirements."],
            "follow_up_suggestions": [
                "What constitutes free consent under Section 14?",
                "What agreements are expressly declared void?"
            ]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "question": "What are the essential elements of a valid contract under Indian law?",
                "jurisdiction": "other",
                "conversation_history": [],
                "include_sources": True
            }
            resp = await client.post("/assistant/legal", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert "Indian Contract Act" in data["answer"]
            assert len(data["sources"]) == 1
            assert "disclaimer" in data
            assert len(data["follow_up_suggestions"]) == 2

    @pytest.mark.asyncio
    async def test_legal_assistant_without_jurisdiction(self, mock_router, mock_adapter):
        """Test legal assistant when jurisdiction is not specified."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "answer": "Generally, limitation periods require filing within a specified time.",
            "sources": [],
            "confidence": 0.7,
            "disclaimer": "General legal information only.",
            "limitations": [],
            "follow_up_suggestions": []
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "question": "What is the limitation period for recovering a commercial debt?"
            }
            resp = await client.post("/assistant/legal", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            # Must contain note about jurisdiction in disclaimer or limitations
            assert "jurisdiction" in data["disclaimer"].lower() or any("jurisdiction" in l.lower() for l in data["limitations"])


class TestSummarizationEndpoint:
    """Test POST /summarize endpoint."""

    @pytest.mark.asyncio
    async def test_summarize_uploaded_document(self, mock_router, mock_adapter):
        """Test summarizing an uploaded legal document."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "summary": "Commercial Lease Agreement between Alpha Corp (Lessor) and Beta Ltd (Lessee) for Office Suite 401.",
            "key_facts": ["Monthly rent is Rs 1,50,000", "Security deposit is 6 months rent"],
            "parties": ["Alpha Corp - Lessor", "Beta Ltd - Lessee"],
            "key_dates": ["2024-04-01: Commencement date", "2027-03-31: Expiry date"],
            "obligations": ["Lessee must maintain comprehensive insurance", "Lessor must ensure quiet enjoyment"],
            "risks": ["Lock-in period penalty of 12 months rent"],
            "citations": [],
            "references": [],
            "warnings": []
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Upload a document first
            file_content = b"COMMERCIAL LEASE AGREEMENT. This Agreement is entered into on 01-04-2024 by Alpha Corp and Beta Ltd."
            files = {"file": ("lease.txt", io.BytesIO(file_content), "text/plain")}
            up_resp = await client.post("/documents/upload", files=files)
            assert up_resp.status_code == 201
            doc_id = up_resp.json()["id"]

            # Summarize document
            payload = {
                "document_id": doc_id,
                "detail_level": "standard",
                "focus_areas": ["parties", "financial_terms", "obligations"]
            }
            resp = await client.post("/summarize", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["document_id"] == doc_id
            assert "Alpha Corp" in data["summary"]
            assert len(data["parties"]) == 2
            assert len(data["key_dates"]) == 2


class TestDocumentQAEndpoint:
    """Test POST /qa/document endpoint."""

    @pytest.mark.asyncio
    async def test_document_qa_with_evidence(self, mock_router, mock_adapter):
        """Test asking questions about an uploaded document.

        The embedding model is unavailable in CI due to a Protobuf version conflict,
        so BM25 retrieval may return zero results for short documents.  We patch the
        retriever at the ``document_qa`` module level so the test exercises the LLM
        integration path regardless of retrieval-index state.
        """
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "answer": "The security deposit is Rs. 9,00,000, equivalent to 6 months rent.",
            "sources": [],
            "confidence": 0.95,
            "insufficient_evidence": False,
            "follow_up_suggestions": ["When is the security deposit refundable?"]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        # Build a mock RetrievalResult so the retriever returns at least one chunk,
        # bypassing the early-exit path that fires when retrieval returns nothing.
        mock_result = RetrievalResult(
            chunk_id="chunk-deposit-01",
            document_id="placeholder",          # overwritten after upload
            text="Clause 5: Security Deposit. The Lessee shall deposit Rs 9,00,000.",
            score=0.9,
            source_filename="deposit.txt",
            page_number=1,
            file_type="txt",
            metadata={},
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Upload document
            content = b"Clause 5: Security Deposit. The Lessee shall deposit Rs 9,00,000 with the Lessor as interest-free refundable security deposit."
            files = {"file": ("deposit.txt", io.BytesIO(content), "text/plain")}
            up_resp = await client.post("/documents/upload", files=files)
            assert up_resp.status_code == 201
            doc_id = up_resp.json()["id"]

            # Patch the retriever used inside document_qa so it always returns our
            # mock chunk, making the test independent of BM25/embedding availability.
            mock_result.document_id = doc_id
            mock_retriever = MagicMock()
            mock_retriever.retrieve.return_value = [mock_result]

            payload = {
                "document_id": doc_id,
                "question": "What is the security deposit amount?",
                "include_sources": True
            }

            with patch("app.features.document_qa.get_retriever", return_value=mock_retriever):
                resp = await client.post("/qa/document", json=payload)

            assert resp.status_code == 200
            data = resp.json()
            assert "9,00,000" in data["answer"]
            assert data["insufficient_evidence"] is False


class TestExternalReviewEndpoint:
    """Test POST /review/external and POST /citations/verify/external."""

    @pytest.mark.asyncio
    async def test_review_external_document(self, mock_router, mock_adapter):
        """Test external document review identifying contradictions and missing terms."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "findings": [
                {
                    "finding_id": "ext_rev_01",
                    "category": "contradiction",
                    "severity": "high",
                    "location": "Clause 3 vs Clause 8",
                    "description": "Clause 3 specifies 30 days notice for termination while Clause 8 requires 90 days notice.",
                    "suggested_correction": "Harmonize notice period across Clause 3 and Clause 8 to 60 days.",
                    "evidence_ids": [],
                    "related_finding_ids": [],
                    "uncertainty": None,
                    "confidence": 0.95
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            content = b"Clause 3: 30 days notice. Clause 8: 90 days notice for termination."
            files = {"file": ("contract.txt", io.BytesIO(content), "text/plain")}
            up_resp = await client.post("/documents/upload", files=files)
            assert up_resp.status_code == 201
            doc_id = up_resp.json()["id"]

            payload = {
                "document_id": doc_id,
                "jurisdiction": "other"
            }
            resp = await client.post("/review/external", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["findings"]) == 1
            assert data["findings"][0]["category"] == "contradiction"
            assert data["document_hash"] != ""
            assert len(data["suggested_edits"]) > 0

    @pytest.mark.asyncio
    async def test_citations_verify_external(self):
        """Test external document citation verification."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            content = b"Pursuant to 42 U.S.C. Section 1983 and California Civil Code Section 1550."
            files = {"file": ("pleading.txt", io.BytesIO(content), "text/plain")}
            up_resp = await client.post("/documents/upload", files=files)
            assert up_resp.status_code == 201
            doc_id = up_resp.json()["id"]

            payload = {
                "document_id": doc_id,
                "jurisdiction": "us_ca"
            }
            resp = await client.post("/citations/verify/external", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["document_id"] == doc_id
            assert "results" in data
            assert data["sources_configured"] is False
