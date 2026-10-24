"""Tests for embedding generation, normalization, batching, and candidate evaluation."""

import pytest
import numpy as np
from draftmate_ai.document_rag.embeddings import (
    DeterministicLocalEmbeddingModel,
    get_embedding_model,
    l2_normalize,
    evaluate_embedding_models,
)


def test_deterministic_embedding_dimension_and_norm():
    """Test vector dimensionality and unit length normalization."""
    model = DeterministicLocalEmbeddingModel(dimension=384)
    vec = model.embed_text("Section 1.1 Confidential Information.")

    assert len(vec) == 384
    norm = np.linalg.norm(np.array(vec))
    assert pytest.approx(norm, abs=1e-5) == 1.0


def test_embedding_reproducibility():
    """Test that same model produces strictly deterministic vectors."""
    model = DeterministicLocalEmbeddingModel(dimension=384, seed=42)
    vec1 = model.embed_text("Master Services Agreement between Alpha Corp and Beta LLC.")
    vec2 = model.embed_text("Master Services Agreement between Alpha Corp and Beta LLC.")

    assert vec1 == vec2


def test_embedding_semantic_sensitivity():
    """Test that semantically related texts have higher similarity than unrelated texts."""
    model = DeterministicLocalEmbeddingModel(dimension=384)

    v_lease1 = np.array(model.embed_text("Tenant shall pay monthly base rent of $5,000."))
    v_lease2 = np.array(model.embed_text("Rent payments are due on the first day of each month."))
    v_unrelated = np.array(model.embed_text("Photosynthesis in marine phytoplankton produces oxygen."))

    sim_related = float(np.dot(v_lease1, v_lease2))
    sim_unrelated = float(np.dot(v_lease1, v_unrelated))

    assert sim_related > sim_unrelated


def test_embedding_batch_processing():
    """Test processing list of texts in configurable batch sizes."""
    model = DeterministicLocalEmbeddingModel(dimension=256)
    texts = [
        "Clause 1. Indemnification",
        "Clause 2. Governing Law",
        "Clause 3. Termination",
        "Clause 4. Severability",
        "Clause 5. Force Majeure",
    ]

    batch_vecs = model.embed_batch(texts, batch_size=2)
    assert len(batch_vecs) == len(texts)
    for v in batch_vecs:
        assert len(v) == 256
        assert pytest.approx(np.linalg.norm(np.array(v)), abs=1e-5) == 1.0


def test_embedding_long_input_handling():
    """Test that inputs exceeding standard window lengths are truncated safely without error."""
    model = DeterministicLocalEmbeddingModel(dimension=128)
    long_text = "Section 5. Confidentiality obligations. " * 500  # ~20,000 characters

    vec = model.embed_text(long_text)
    assert len(vec) == 128
    assert pytest.approx(np.linalg.norm(np.array(vec)), abs=1e-5) == 1.0


def test_embedding_empty_text():
    """Test handling of empty text input."""
    model = DeterministicLocalEmbeddingModel(dimension=128)
    vec = model.embed_text("")
    assert len(vec) == 128
    assert all(x == 0.0 for x in vec)


def test_candidate_models_evaluation():
    """Test benchmark evaluation function on candidate embedding models."""
    model1 = DeterministicLocalEmbeddingModel(dimension=128, model_name="local-128", seed=10)
    model2 = DeterministicLocalEmbeddingModel(dimension=256, model_name="local-256", seed=20)

    pairs = [
        ("Tenant pays rent monthly", "Rent is payable on monthly basis", True),
        ("Governing law is Delaware", "Agreement governed by laws of State of Delaware", True),
        ("Tenant pays rent monthly", "Rocket propulsion uses liquid hydrogen", False),
    ]

    benchmark = evaluate_embedding_models([model1, model2], pairs)
    assert "local-128" in benchmark
    assert "local-256" in benchmark
    for m_name, metrics in benchmark.items():
        assert metrics["mean_positive_similarity"] > metrics["mean_negative_similarity"]
        assert metrics["similarity_margin"] > 0.0

