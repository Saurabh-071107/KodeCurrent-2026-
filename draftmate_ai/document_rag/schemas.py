"""Pydantic schemas for the Document RAG module.

Defines strongly-typed data transfer objects for retrieval, query processing,
grounded generation, citation evidence, and evaluation metrics.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SourceReference(BaseModel):
    """Citation linking an answer claim to verified source text."""
    document_id: str = Field(description="Unique identifier of source document.")
    document_name: str = Field(description="Filename of source document.")
    chunk_id: str = Field(description="Identifier of chunk providing evidence.")
    page: Optional[int] = Field(default=None, description="Page reference if available.")
    section: Optional[str] = Field(default=None, description="Section heading if available.")
    clause: Optional[str] = Field(default=None, description="Clause numbering if available.")
    supporting_excerpt: str = Field(description="Verbatim source passage supporting the claim.")
    is_verified: bool = Field(default=True, description="Whether excerpt was verified against source.")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Verification confidence.")


class RAGResponse(BaseModel):
    """Structured response returned by evidence-grounded generation."""
    question: str = Field(description="User question asked against the documents.")
    answer: str = Field(description="Evidence-grounded answer synthesised from retrieved passages.")
    sources: List[SourceReference] = Field(default_factory=list, description="Traceable supporting citations.")
    unsupported_aspects: List[str] = Field(default_factory=list, description="Sub-questions or aspects not addressed by evidence.")
    limitations: List[str] = Field(default_factory=list, description="Scope boundaries, ambiguity, or caveats.")
    abstained: bool = Field(default=False, description="True if evidence was insufficient to answer.")


class RetrievedChunk(BaseModel):
    """A chunk retrieved by semantic, lexical, or hybrid search."""
    chunk_id: str
    document_id: str
    document_name: str
    text: str
    original_text: str
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    section_heading: Optional[str] = None
    clause_number: Optional[str] = None
    paragraph_numbers: List[int] = Field(default_factory=list)
    score: float = Field(default=0.0, description="Combined or individual retrieval score.")
    dense_score: Optional[float] = None
    lexical_score: Optional[float] = None
    retrieval_method: str = "dense"  # "dense", "lexical", "hybrid_rrf", "reranked"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RetrievalFilter(BaseModel):
    """Metadata filters applied during vector or lexical retrieval."""
    document_ids: Optional[List[str]] = None
    filenames: Optional[List[str]] = None
    page_min: Optional[int] = None
    page_max: Optional[int] = None
    clause_numbers: Optional[List[str]] = None
    section_headings: Optional[List[str]] = None
    custom_metadata: Optional[Dict[str, Any]] = None


class RetrievalConfig(BaseModel):
    """Configurable hyperparameters governing the hybrid retrieval pipeline."""
    top_k: int = Field(default=5, ge=1, description="Number of final results to return.")
    semantic_weight: float = Field(default=0.6, ge=0.0, le=1.0, description="Weight for semantic dense retrieval.")
    lexical_weight: float = Field(default=0.4, ge=0.0, le=1.0, description="Weight for BM25 lexical retrieval.")
    rrf_k: int = Field(default=60, ge=1, description="Constant k used in Reciprocal Rank Fusion.")
    min_score_threshold: float = Field(default=0.0, ge=0.0, description="Minimum relevance score threshold.")
    enable_reranking: bool = Field(default=True, description="Whether to apply cross-encoder or lexical reranking.")
    rerank_top_k: int = Field(default=10, ge=1, description="Number of candidate chunks to fetch before reranking.")


class EvaluationQuery(BaseModel):
    """A labeled evaluation benchmark instance."""
    query_id: str
    question: str
    expected_chunk_ids: List[str] = Field(default_factory=list)
    reference_answer: Optional[str] = None
    is_abstention_case: bool = False
    forbidden_claims: List[str] = Field(default_factory=list)


class EvaluationReport(BaseModel):
    """Evaluation metrics summary across retrieval and generation."""
    recall_at_k: Dict[str, float]
    precision_at_k: Dict[str, float]
    mean_reciprocal_rank: float
    ndcg_at_k: Dict[str, float]
    evidence_relevance: float
    citation_correctness: float
    answer_faithfulness: float
    answer_completeness: float
    unsupported_claim_rate: float
    appropriate_abstention_rate: float
    total_queries: int
    details: List[Dict[str, Any]] = Field(default_factory=list)

