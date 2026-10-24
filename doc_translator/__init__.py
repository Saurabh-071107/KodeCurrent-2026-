"""
DocMultilingualModel: Multilingual Document Translation & Voiceover Pipeline
Translates text from DOCX, PDF, PPTX, TXT, and other documents into:
- Hindi (hi)
- Marathi (mr)
- Gujarati (gu)
- English (en)
- Telugu (te)

Includes multi-format export (DOCX, PDF, TXT) and voiceover audio synthesis (MP3).
"""

from .model import DocMultilingualModel, TranslationResult
from .extractor import DocumentExtractor
from .engine import TranslationEngine, SUPPORTED_LANGUAGES
from .exporter import DocumentExporter
from .voiceover import VoiceoverGenerator

__version__ = "1.1.0"
__all__ = [
    "DocMultilingualModel",
    "TranslationResult",
    "DocumentExtractor",
    "TranslationEngine",
    "DocumentExporter",
    "VoiceoverGenerator",
    "SUPPORTED_LANGUAGES",
]
