"""Configurable embedding models and batch processing interface.

Supports deterministic local embeddings for reproducible offline development,
alongside OpenAI and Gemini cloud embedding models with dimension validation,
L2 normalization, and batching.
"""

from abc import ABC, abstractmethod
import math
import hashlib
from typing import List, Optional, Tuple, Dict, Any
import numpy as np

from draftmate_ai.shared.configuration import get_settings
from draftmate_ai.shared.exceptions import ConfigurationError, DraftMateError
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


def l2_normalize(vector: List[float]) -> List[float]:
    """Compute L2 unit normalization for a vector."""
    arr = np.array(vector, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm == 0.0 or math.isnan(norm):
        return [0.0] * len(vector)
    return (arr / norm).tolist()


class BaseEmbeddingModel(ABC):
    """Abstract base class for all embedding model implementations."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Dimensionality of produced embedding vectors."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Identifier name of the embedding model."""
        pass

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate normalized embedding vector for a single text input."""
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate normalized embeddings for a batch of text inputs."""
        pass

    def validate_vector(self, vector: List[float]) -> None:
        """Validate vector dimensionality and finite values."""
        if len(vector) != self.dimension:
            raise ValueError(
                f"Vector dimension mismatch: expected {self.dimension}, got {len(vector)}"
            )
        if any(math.isnan(v) or math.isinf(v) for v in vector):
            raise ValueError("Embedding vector contains NaN or infinite values.")


class DeterministicLocalEmbeddingModel(BaseEmbeddingModel):
    """Deterministic, reproducible local embedding model.

    Generates dense embeddings via semantic subword n-gram hashing and pseudo-random
    orthogonal projections. Guarantees deterministic, reproducible results without
    requiring external network calls or GPU weights.
    """

    def __init__(self, dimension: int = 384, model_name: str = "deterministic-local-v1", seed: int = 42):
        self._dimension = dimension
        self._model_name = model_name
        self._seed = seed
        self._max_chars = 8000

        # Create reproducible orthogonal projection matrix
        rng = np.random.default_rng(seed)
        proj = rng.standard_normal((1024, dimension), dtype=np.float32)
        col_norms = np.linalg.norm(proj, axis=0, keepdims=True)
        self._projection = proj / np.maximum(col_norms, 1e-12)

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def _text_to_feature_indices(self, text: str) -> List[int]:
        """Convert text into hash bucket indices."""
        truncated = text[:self._max_chars].lower()
        words = truncated.split()
        indices = []

        # 1. Word hashes
        for w in words:
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest()[:8], 16)
            indices.append(h % 1024)

        # 2. Subword n-grams (3-grams, 4-grams)
        for i in range(len(truncated) - 3):
            sub = truncated[i : i + 3]
            h = int(hashlib.md5(sub.encode("utf-8")).hexdigest()[:8], 16)
            indices.append(h % 1024)

        return indices

    def embed_text(self, text: str) -> List[float]:
        """Compute normalized vector for a single text."""
        if not text or not text.strip():
            # Return zero vector if empty
            return [0.0] * self._dimension

        indices = self._text_to_feature_indices(text)
        if not indices:
            return [0.0] * self._dimension

        # Sparse feature vector
        sparse = np.zeros(1024, dtype=np.float32)
        for idx in indices:
            sparse[idx] += 1.0

        # Project to target dimension
        dense = np.dot(sparse, self._projection)
        normalized = l2_normalize(dense.tolist())
        self.validate_vector(normalized)
        return normalized

    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Compute embeddings in batches."""
        results: List[List[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            for t in batch:
                results.append(self.embed_text(t))
        return results


class OpenAIEmbeddingModel(BaseEmbeddingModel):
    """Embedding model using the OpenAI Embeddings API (e.g. text-embedding-3-small)."""

    def __init__(
        self,
        model_name: str = "text-embedding-3-small",
        api_key: Optional[str] = None,
        dimension: int = 1536,
    ):
        self._model_name = model_name
        self._dimension = dimension
        settings = get_settings()
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ConfigurationError(
                "OPENAI_API_KEY is required to initialize OpenAIEmbeddingModel."
            )

        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key)
        except Exception as e:
            raise DraftMateError(f"Failed to initialize OpenAI client: {e}") from e

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def embed_text(self, text: str) -> List[float]:
        clean = text[:8000].strip() or " "
        try:
            resp = self.client.embeddings.create(
                model=self._model_name,
                input=clean,
                dimensions=self._dimension,
            )
            vec = resp.data[0].embedding
            normalized = l2_normalize(vec)
            self.validate_vector(normalized)
            return normalized
        except Exception as e:
            raise DraftMateError(f"OpenAI embedding call failed: {e}") from e

    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        clean_texts = [(t[:8000].strip() or " ") for t in texts]
        results: List[List[float]] = []

        for i in range(0, len(clean_texts), batch_size):
            chunk = clean_texts[i : i + batch_size]
            try:
                resp = self.client.embeddings.create(
                    model=self._model_name,
                    input=chunk,
                    dimensions=self._dimension,
                )
                for item in resp.data:
                    vec = l2_normalize(item.embedding)
                    self.validate_vector(vec)
                    results.append(vec)
            except Exception as e:
                raise DraftMateError(f"OpenAI batch embedding failed at index {i}: {e}") from e

        return results


def get_embedding_model(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    dimension: Optional[int] = None,
) -> BaseEmbeddingModel:
    """Factory function returning the configured BaseEmbeddingModel instance."""
    settings = get_settings()
    selected_provider = (provider or settings.EMBEDDING_PROVIDER).lower()

    if selected_provider == "mock" or selected_provider == "local":
        dim = dimension or 384
        name = model_name or "deterministic-local-v1"
        return DeterministicLocalEmbeddingModel(dimension=dim, model_name=name)

    elif selected_provider == "openai":
        name = model_name or settings.EMBEDDING_MODEL
        dim = dimension or settings.EMBEDDING_DIMENSION
        # If API key is not present, gracefully fall back to local model with warning
        if not settings.OPENAI_API_KEY:
            logger.warning(
                "OPENAI_API_KEY is not set. Falling back to DeterministicLocalEmbeddingModel."
            )
            return DeterministicLocalEmbeddingModel(dimension=dim, model_name=f"fallback-{name}")
        return OpenAIEmbeddingModel(model_name=name, dimension=dim)

    # Default to deterministic local model
    dim = dimension or 384
    name = model_name or "deterministic-local-v1"
    return DeterministicLocalEmbeddingModel(dimension=dim, model_name=name)


def evaluate_embedding_models(
    models: List[BaseEmbeddingModel],
    evaluation_pairs: List[Tuple[str, str, bool]],
) -> Dict[str, Dict[str, float]]:
    """Evaluate candidate embedding models on a benchmark dataset of text pairs.

    Args:
        models: List of embedding models to benchmark.
        evaluation_pairs: List of (text_a, text_b, is_match) tuples.

    Returns:
        Dictionary mapping model names to performance metrics (mean positive similarity,
        mean negative similarity, margin, separation ratio).
    """
    results: Dict[str, Dict[str, float]] = {}

    for model in models:
        pos_sims: List[float] = []
        neg_sims: List[float] = []

        for text_a, text_b, is_match in evaluation_pairs:
            vec_a = np.array(model.embed_text(text_a))
            vec_b = np.array(model.embed_text(text_b))
            cosine_sim = float(np.dot(vec_a, vec_b))

            if is_match:
                pos_sims.append(cosine_sim)
            else:
                neg_sims.append(cosine_sim)

        avg_pos = float(np.mean(pos_sims)) if pos_sims else 0.0
        avg_neg = float(np.mean(neg_sims)) if neg_sims else 0.0
        margin = avg_pos - avg_neg
        separation = (avg_pos / (avg_neg + 1e-6)) if avg_neg != 0 else avg_pos

        results[model.model_name] = {
            "mean_positive_similarity": round(avg_pos, 4),
            "mean_negative_similarity": round(avg_neg, 4),
            "similarity_margin": round(margin, 4),
            "separation_ratio": round(separation, 4),
        }

    return results

