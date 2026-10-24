"""Document RAG subsystem: embeddings, persistent indexing, hybrid retrieval, generation, and validation."""

from draftmate_ai.document_rag.schemas import (
    SourceReference,
    RAGResponse,
    RetrievedChunk,
    RetrievalFilter,
    RetrievalConfig,
    EvaluationQuery,
    EvaluationReport,
)
from draftmate_ai.document_rag.embeddings import (
    BaseEmbeddingModel,
    DeterministicLocalEmbeddingModel,
    OpenAIEmbeddingModel,
    get_embedding_model,
    evaluate_embedding_models,
)
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.query_processing import LegalQueryProcessor, ProcessedQuery
from draftmate_ai.document_rag.reranking import BaseReranker, CrossEncoderReranker
from draftmate_ai.document_rag.retrieval import HybridRetriever
from draftmate_ai.document_rag.generation import (
    BaseLLMClient,
    DeterministicLocalLegalLLM,
    OpenAILLMClient,
    get_llm_client,
    sanitize_untrusted_text,
)
from draftmate_ai.document_rag.evidence_validation import EvidenceValidator
from draftmate_ai.document_rag.evaluation import (
    RAGEvaluator,
    LEGAL_EVALUATION_DATASET,
    recall_at_k,
    precision_at_k,
    reciprocal_rank,
    ndcg_at_k,
)

__all__ = [
    "SourceReference",
    "RAGResponse",
    "RetrievedChunk",
    "RetrievalFilter",
    "RetrievalConfig",
    "EvaluationQuery",
    "EvaluationReport",
    "BaseEmbeddingModel",
    "DeterministicLocalEmbeddingModel",
    "OpenAIEmbeddingModel",
    "get_embedding_model",
    "evaluate_embedding_models",
    "VectorIndexManager",
    "LegalQueryProcessor",
    "ProcessedQuery",
    "BaseReranker",
    "CrossEncoderReranker",
    "HybridRetriever",
    "BaseLLMClient",
    "DeterministicLocalLegalLLM",
    "OpenAILLMClient",
    "get_llm_client",
    "sanitize_untrusted_text",
    "EvidenceValidator",
    "RAGEvaluator",
    "LEGAL_EVALUATION_DATASET",
    "recall_at_k",
    "precision_at_k",
    "reciprocal_rank",
    "ndcg_at_k",
]

