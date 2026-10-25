"""Tests for document management and retrieval."""
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
import io

from app.main import app
from app.schemas import DocumentType, Jurisdiction, FactExtractionResponse
from app.core.storage import get_document_store
from app.features.chunking import get_chunk_store
from app.features.retriever_instance import get_retriever
from tests.conftest import mock_adapter, mock_router


@pytest.fixture(autouse=True)
async def clear_stores():
    """Clear document and chunk stores between tests."""
    doc_store = get_document_store()
    chunk_store = get_chunk_store()
    retriever = get_retriever()
    
    # Clear chunk store
    chunk_store.clear()
    
    # Clear document store by deleting all documents
    docs = await doc_store.list(limit=1000)
    for doc in docs:
        await doc_store.delete(doc.id)
    
    # Rebuild retriever index
    retriever.build_index([])
    
    yield
    
    # Cleanup after test
    chunk_store.clear()
    docs = await doc_store.list(limit=1000)
    for doc in docs:
        await doc_store.delete(doc.id)
    retriever.build_index([])


class TestDocumentUpload:
    """Test document upload endpoint."""

    @pytest.mark.asyncio
    async def test_upload_txt_document(self, mock_router, mock_adapter):
        """Test uploading a text document."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                file_content = b"This is a test legal document about a contract dispute."
                files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
                response = await client.post("/documents/upload", files=files)
            
            assert response.status_code == 201
            data = response.json()
            assert "id" in data
            assert data["filename"] == "test.txt"
            assert data["file_type"] == "txt"
            assert data["extraction_status"] in ["pending", "processing", "completed"]
        finally:
            mr._router = original
            # Clean up
            chunk_store = get_chunk_store()
            chunk_store.clear()
            doc_store = get_document_store()
            import asyncio
            asyncio.create_task(doc_store.initialize())  # Reset

    @pytest.mark.asyncio
    async def test_upload_invalid_file_type(self, mock_router, mock_adapter):
        """Test uploading an unsupported file type."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                file_content = b"test content"
                files = {"file": ("test.exe", io.BytesIO(file_content), "application/octet-stream")}
                response = await client.post("/documents/upload", files=files)
            
            assert response.status_code == 400
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_upload_empty_file(self, mock_router, mock_adapter):
        """Test uploading an empty file."""
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
                response = await client.post("/documents/upload", files=files)
            
            assert response.status_code == 400
        finally:
            mr._router = original


class TestDocumentListing:
    """Test document listing endpoints."""

    @pytest.mark.asyncio
    async def test_list_documents_empty(self):
        """Test listing documents when none exist."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/documents")
        
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert "total" in data
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_get_document_not_found(self):
        """Test getting a non-existent document."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/documents/non-existent-id")
        
        assert response.status_code == 404


class TestRetrieval:
    """Test retrieval endpoint."""

    @pytest.mark.asyncio
    async def test_retrieve_no_documents(self):
        """Test retrieval when no documents are indexed."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/retrieve", json={
                "query": "contract dispute",
                "limit": 5
            })
        
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "query" in data
        assert data["total_results"] == 0


class TestEvidenceGroundedDrafting:
    """Test evidence-grounded drafting endpoint."""

    @pytest.mark.asyncio
    async def test_evidence_grounded_draft_no_evidence(self, mock_router, mock_adapter):
        """Test evidence-grounded drafting when no evidence is found."""
        mock_response = AsyncMock()
        mock_response.content = '{"document_type": "demand_letter", "title": "Test", "sections": [{"title": "Test", "content": "Test", "order": 0}], "assumptions": [], "warnings": [], "placeholders": [], "review_status": "draft_needs_review", "disclaimer": "This document is generated by an AI assistant and does not constitute legal advice."}'
        mock_adapter.chat.return_value = mock_response
        
        import app.core.model_router as mr
        original = mr._router
        mr._router = mock_router
        
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                request_data = {
                    "document_type": "demand_letter",
                    "facts": {
                        "user_provided_facts": [],
                        "inferred_facts": [],
                        "parties_and_roles": [],
                        "important_dates": [],
                        "desired_outcome": "Test outcome",
                        "missing_information": [],
                        "contradictions": [],
                        "follow_up_questions": [],
                        "assumptions": [],
                        "uncertainties": []
                    },
                    "query": "contract dispute evidence",
                    "jurisdiction": "us_ca"
                }
                response = await client.post("/draft/evidence-grounded", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "draft" in data
            assert "evidence_used" in data
            assert "evidence_excerpts" in data
            assert "warnings" in data
            assert "insufficient_evidence" in data
        finally:
            mr._router = original

    @pytest.mark.asyncio
    async def test_evidence_grounded_draft_invalid_input(self):
        """Test evidence-grounded drafting with invalid input."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/draft/evidence-grounded", json={})
        
        assert response.status_code == 422


class TestDocumentParsingIntegration:
    """Integration tests for document parsing."""

    def test_parse_txt(self):
        """Test parsing a text file."""
        from app.features.document_parsing import parse_document
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a test legal document about a contract dispute.\nIt has multiple lines.")
            temp_path = f.name
        
        try:
            parsed = parse_document(temp_path)
            assert parsed.file_type == "txt"
            assert len(parsed.pages) == 1
            assert "contract dispute" in parsed.pages[0].text
        finally:
            os.unlink(temp_path)

    def test_parse_invalid_extension(self):
        """Test parsing a file with invalid extension."""
        from app.features.document_parsing import parse_document, UnsupportedFileTypeError
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.exe', delete=False) as f:
            f.write("test")
            temp_path = f.name
        
        try:
            with pytest.raises(UnsupportedFileTypeError):
                parse_document(temp_path, allowed_extensions=[".txt"])
        finally:
            os.unlink(temp_path)


class TestChunking:
    """Test document chunking."""

    def test_split_text_into_chunks(self):
        """Test splitting text into chunks."""
        from app.features.chunking import split_text_into_chunks
        
        text = "This is a test document. It has multiple sentences. Each sentence should be handled correctly."
        chunks = split_text_into_chunks(text, chunk_size=50, chunk_overlap=10)
        
        assert len(chunks) > 0
        for chunk_text, start, end in chunks:
            assert len(chunk_text) <= 50 + 10  # Allow some flexibility

    def test_create_chunks_from_document(self):
        """Test creating chunks from parsed document."""
        from app.features.chunking import create_chunks_from_document
        
        text_chunks = [
            ("This is page 1 content about a contract.", {"page_number": 1, "source_filename": "test.txt", "file_type": "txt"}),
            ("This is page 2 content about the dispute.", {"page_number": 2, "source_filename": "test.txt", "file_type": "txt"}),
        ]
        
        chunks = create_chunks_from_document("doc-123", text_chunks, chunk_size=20, chunk_overlap=5)
        
        assert len(chunks) > 0
        for chunk in chunks:
            assert chunk.document_id == "doc-123"
            assert chunk.chunk_id.startswith("doc-123_chunk_")

    def test_chunk_store(self):
        """Test chunk store operations."""
        from app.features.chunking import get_chunk_store, DocumentChunk
        
        store = get_chunk_store()
        store.clear()
        
        chunk = DocumentChunk(
            chunk_id="test_chunk_1",
            document_id="doc_1",
            text="Test content",
            page_number=1,
            source_filename="test.txt",
            file_type="txt",
            start_char=0,
            end_char=12,
        )
        
        store.add_chunks([chunk])
        
        retrieved = store.get_chunk("test_chunk_1")
        assert retrieved is not None
        assert retrieved.text == "Test content"
        
        doc_chunks = store.get_document_chunks("doc_1")
        assert len(doc_chunks) == 1
        
        deleted = store.delete_document_chunks("doc_1")
        assert deleted == 1
        assert store.get_chunk("test_chunk_1") is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])