"""Tests for the RAG evaluation metrics suite and benchmark report generation."""

import tempfile
import pytest
from draftmate_ai.document_rag.evaluation import (
    recall_at_k,
    precision_at_k,
    reciprocal_rank,
    ndcg_at_k,
    evaluate_faithfulness,
    evaluate_completeness,
    RAGEvaluator,
    EvaluationQuery,
)
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.embeddings import DeterministicLocalEmbeddingModel
from draftmate_ai.document_rag.retrieval import HybridRetriever
from draftmate_ai.document_rag.generation import DeterministicLocalLegalLLM
from draftmate_ai.document_processing import ingest_document


def test_metric_recall_at_k():
    """Test recall@k calculation."""
    retrieved = ["c1", "c2", "c3", "c4"]
    relevant = ["c2", "c5"]

    assert recall_at_k(retrieved, relevant, k=1) == 0.0
    assert recall_at_k(retrieved, relevant, k=2) == 0.5  # c2 found
    assert recall_at_k(retrieved, relevant, k=4) == 0.5


def test_metric_precision_at_k():
    """Test precision@k calculation."""
    retrieved = ["c1", "c2", "c3", "c4"]
    relevant = ["c1", "c3"]

    assert precision_at_k(retrieved, relevant, k=1) == 1.0  # c1 matches
    assert precision_at_k(retrieved, relevant, k=2) == 0.5  # 1 of 2
    assert precision_at_k(retrieved, relevant, k=4) == 0.5  # 2 of 4


def test_metric_reciprocal_rank():
    """Test MRR reciprocal rank calculation."""
    assert reciprocal_rank(["c1", "c2", "c3"], ["c1"]) == 1.0
    assert reciprocal_rank(["c1", "c2", "c3"], ["c2"]) == 0.5
    assert reciprocal_rank(["c1", "c2", "c3"], ["c3"]) == 1.0 / 3.0
    assert reciprocal_rank(["c1", "c2", "c3"], ["c9"]) == 0.0


def test_metric_ndcg_at_k():
    """Test nDCG@k ranking quality calculation."""
    # Perfect ranking: relevant item at rank 1
    assert ndcg_at_k(["c1", "c2"], ["c1"], k=2) == 1.0
    # Relevant item at rank 2
    imperfect = ndcg_at_k(["c2", "c1"], ["c1"], k=2)
    assert 0.0 < imperfect < 1.0


def test_evaluate_faithfulness():
    """Test token faithfulness computation."""
    excerpts = ["Tenant shall pay monthly base rent of $5,000."]
    answer_faithful = "The tenant shall pay monthly base rent of $5,000."
    answer_unsupported = "The tenant owns the whole building and free parking."

    score_faithful = evaluate_faithfulness(answer_faithful, excerpts)
    score_unsupported = evaluate_faithfulness(answer_unsupported, excerpts)

    assert score_faithful > score_unsupported


def test_end_to_end_evaluation_pipeline(sample_pdf_bytes, sample_legal_text):
    """Test running RAGEvaluator to generate a complete EvaluationReport."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        model = DeterministicLocalEmbeddingModel(dimension=128)
        mgr = VectorIndexManager(storage_dir=tmp, embedding_model=model)

        doc1 = ingest_document(source=sample_pdf_bytes, filename="agreement.pdf")
        doc2 = ingest_document(source=sample_legal_text.encode("utf-8"), filename="lease.txt")

        mgr.index_document(doc1)
        mgr.index_document(doc2)

        retriever = HybridRetriever(index_manager=mgr)
        llm = DeterministicLocalLegalLLM()
        evaluator = RAGEvaluator(retriever=retriever, llm_client=llm)

        # Benchmark queries
        rent_chunk_ids = [c.chunk_id for c in doc2.chunks if "$5,000" in c.text]
        queries = [
            EvaluationQuery(
                query_id="q1",
                question="What is the monthly base rent?",
                expected_chunk_ids=rent_chunk_ids,
                reference_answer="Base rent is $5,000 per month.",
                is_abstention_case=False,
            ),
            EvaluationQuery(
                query_id="q2",
                question="What is the policy for keeping dolphins in the office suite?",
                expected_chunk_ids=[],
                reference_answer="",
                is_abstention_case=True,
            ),
        ]

        report = evaluator.evaluate_queries(queries=queries, top_k=3)

        assert report.total_queries == 2
        assert "recall@5" in report.recall_at_k
        assert "precision@1" in report.precision_at_k
        assert report.mean_reciprocal_rank >= 0.0
        assert report.appropriate_abstention_rate == 1.0
        assert len(report.details) == 2
