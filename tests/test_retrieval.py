"""Tests for hybrid retrieval, BM25 lexical search, RRF fusion, query processing, and filtering."""

import tempfile
import pytest
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.embeddings import DeterministicLocalEmbeddingModel
from draftmate_ai.document_rag.retrieval import HybridRetriever
from draftmate_ai.document_rag.query_processing import LegalQueryProcessor
from draftmate_ai.document_rag.schemas import RetrievalConfig, RetrievalFilter
from draftmate_ai.document_processing import ingest_document


@pytest.fixture
def populated_retriever(sample_pdf_bytes, sample_legal_text):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        model = DeterministicLocalEmbeddingModel(dimension=128)
        mgr = VectorIndexManager(storage_dir=tmp, embedding_model=model)

        doc1 = ingest_document(source=sample_pdf_bytes, filename="agreement.pdf")
        doc2 = ingest_document(source=sample_legal_text.encode("utf-8"), filename="lease.txt")

        mgr.index_document(doc1)
        mgr.index_document(doc2)

        retriever = HybridRetriever(
            index_manager=mgr,
            config=RetrievalConfig(top_k=4, semantic_weight=0.6, lexical_weight=0.4),
        )
        yield retriever


def test_query_processing_entities_and_acronyms():
    """Test query processor extracts clause references and expands legal acronyms."""
    qp = LegalQueryProcessor(expand_acronyms=True)
    res = qp.process("What are the confidentiality obligations in Section 1.01 of the NDA?")

    assert "Section 1.01" in res.extracted_clauses
    assert res.query_type == "clause_lookup"
    assert any("non-disclosure" in t or "confidential" in t for t in res.lexical_tokens)


def test_hybrid_retrieval_returns_relevant_chunks(populated_retriever):
    """Test hybrid retrieval retrieves relevant chunks using RRF."""
    results = populated_retriever.retrieve("What is the monthly base rent?")

    assert len(results) > 0
    # The lease rent clause should rank near top
    top_chunk = results[0]
    assert top_chunk.document_name == "lease.txt"
    assert "rent" in top_chunk.text.lower() or "$5,000" in top_chunk.text


def test_metadata_filtering(populated_retriever):
    """Test restricting retrieval by document filename and clause."""
    filter_lease = RetrievalFilter(filenames=["lease.txt"])
    results = populated_retriever.retrieve("Standard of Care", filters=filter_lease)

    # Even though agreement.pdf has "Standard of Care", filter restricts to lease.txt
    for r in results:
        assert r.document_name == "lease.txt"


def test_retrieval_score_thresholding(populated_retriever):
    """Test filtering chunks below a minimum relevance score."""
    high_threshold_config = RetrievalConfig(top_k=5, min_score_threshold=0.95)
    results = populated_retriever.retrieve(
        "Quantum superposition in semiconductor devices",
        config_override=high_threshold_config,
    )

    # Unrelated query should yield 0 results with very high threshold
    assert len(results) == 0


def test_retrieval_safety_traceability(populated_retriever):
    """Ensure every retrieved chunk contains valid document_id and non-empty text."""
    results = populated_retriever.retrieve("Invoicing and fees schedule")

    assert len(results) > 0
    for r in results:
        assert r.document_id and r.document_id != "unknown"
        assert r.document_name in ("agreement.pdf", "lease.txt")
        assert len(r.text.strip()) > 0
        assert r.chunk_id.startswith(r.document_id)
