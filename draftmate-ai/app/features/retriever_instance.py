"""Global retriever instance."""
from typing import Optional
from app.features.retrieval import HybridRetriever
from app.config import get_settings

_retriever: Optional[HybridRetriever] = None


def get_retriever() -> HybridRetriever:
    """Get global hybrid retriever instance."""
    global _retriever
    if _retriever is None:
        settings = get_settings()
        _retriever = HybridRetriever(
            keyword_weight=0.5,
            embedding_weight=0.5,
            embedding_model=settings.embedding.model,
        )
    return _retriever


async def initialize_retriever() -> None:
    """Initialize the retriever (no-op, lazy initialization)."""
    get_retriever()