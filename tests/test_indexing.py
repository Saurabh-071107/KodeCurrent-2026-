"""Tests for vector index persistence, document lifecycle, deduplication, and model safety."""

import tempfile
import pytest
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.embeddings import DeterministicLocalEmbeddingModel
from draftmate_ai.document_processing import ingest_document
from draftmate_ai.shared.document_models import DocumentChunk
from draftmate_ai.shared.exceptions import ConfigurationError


@pytest.fixture
def temp_index_dir():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        yield tmp


@pytest.fixture
def sample_processed_doc(sample_pdf_bytes):
    return ingest_document(source=sample_pdf_bytes, filename="agreement.pdf")


def test_indexing_chunks_and_count(temp_index_dir, sample_processed_doc):
    """Test indexing chunks and verifying collection count."""
    model = DeterministicLocalEmbeddingModel(dimension=128)
    mgr = VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model)

    added = mgr.index_document(sample_processed_doc)
    assert added > 0
    assert mgr.count() == added


def test_index_persistence_reload(temp_index_dir, sample_processed_doc):
    """Test that index state is persisted to disk and reloads identically."""
    model = DeterministicLocalEmbeddingModel(dimension=128)
    mgr1 = VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model)
    mgr1.index_document(sample_processed_doc)
    initial_count = mgr1.count()

    # Re-open manager targeting same storage directory
    mgr2 = VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model)
    assert mgr2.count() == initial_count

    # Verify query works on reloaded index
    results = mgr2.search_dense("Confidential Information", top_k=2)
    assert len(results) > 0
    assert results[0].document_id == sample_processed_doc.metadata.document_id


def test_duplicate_indexing_prevention(temp_index_dir, sample_processed_doc):
    """Test that re-inserting the same document does not create duplicate entries."""
    model = DeterministicLocalEmbeddingModel(dimension=128)
    mgr = VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model)

    first_add = mgr.index_document(sample_processed_doc)
    second_add = mgr.index_document(sample_processed_doc, skip_duplicates=True)

    assert first_add > 0
    assert second_add == 0
    assert mgr.count() == first_add


def test_delete_and_reindex_document(temp_index_dir, sample_processed_doc):
    """Test removing a document by ID and reindexing it."""
    model = DeterministicLocalEmbeddingModel(dimension=128)
    mgr = VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model)

    mgr.index_document(sample_processed_doc)
    doc_id = sample_processed_doc.metadata.document_id
    assert mgr.count() > 0

    deleted = mgr.delete_document(doc_id)
    assert deleted > 0
    assert mgr.count() == 0

    reindexed = mgr.reindex_document(sample_processed_doc)
    assert reindexed == deleted
    assert mgr.count() == reindexed


def test_incompatible_embedding_model_detection(temp_index_dir, sample_processed_doc):
    """Test that opening an index with a different embedding model or dimension raises ConfigurationError."""
    model1 = DeterministicLocalEmbeddingModel(dimension=128, model_name="local-model-v1")
    mgr1 = VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model1)
    mgr1.index_document(sample_processed_doc)

    # Attempt to open same index with dimension 256
    model2 = DeterministicLocalEmbeddingModel(dimension=256, model_name="local-model-v2")
    with pytest.raises(ConfigurationError) as exc_info:
        VectorIndexManager(storage_dir=temp_index_dir, embedding_model=model2, recreate_if_incompatible=False)

    assert "Incompatible vector index" in str(exc_info.value)
