"""
DocMultilingualModel: High-Level Unified Translation & Voiceover Model.
Orchestrates document extraction, multi-language neural translation, multi-format export, and audio voiceover.
"""

import os
import time
from typing import Dict, List, Optional, Union, BinaryIO, Any

from .extractor import DocumentExtractor
from .engine import TranslationEngine, SUPPORTED_LANGUAGES
from .exporter import DocumentExporter
from .voiceover import VoiceoverGenerator


class TranslationResult:
    """
    Encapsulates the output of a document or text translation.
    Provides easy access to translations, export methods, and voiceover audio generation.
    """

    def __init__(
        self,
        source_filename: str,
        source_format: str,
        source_text: str,
        chunks: List[str],
        translations: Dict[str, List[str]],
        metadata: Dict[str, Any],
        duration_seconds: float = 0.0,
    ):
        self.filename = source_filename
        self.format = source_format
        self.source_text = source_text
        self.chunks = chunks
        self.translations = translations  # Dict[lang_code, List[str]]
        self.metadata = metadata
        self.duration_seconds = duration_seconds
        self._audio_cache: Dict[str, bytes] = {}

    def get_text(self, lang_code: str) -> str:
        """Returns the joined full translated text for the specified language."""
        code = lang_code.lower()
        if code not in self.translations:
            raise KeyError(f"Language '{lang_code}' not in translation results. Available: {list(self.translations.keys())}")
        return "\n\n".join(self.translations[code])

    def get_chunks(self, lang_code: str) -> List[str]:
        """Returns the individual translated chunks for the specified language."""
        code = lang_code.lower()
        if code not in self.translations:
            raise KeyError(f"Language '{lang_code}' not in translation results. Available: {list(self.translations.keys())}")
        return self.translations[code]

    def to_bytes(self, lang_code: str, file_format: str = "docx") -> bytes:
        """Exports translation to in-memory bytes (useful for web apps / Streamlit)."""
        fmt = file_format.lower().replace(".", "")
        text = self.get_text(lang_code)
        title = f"Translation ({SUPPORTED_LANGUAGES.get(lang_code, {}).get('name', lang_code)})"

        if fmt == "docx":
            return DocumentExporter.to_docx_bytes(
                text, lang_code, title=title, original_title=self.filename
            )
        elif fmt == "pdf":
            return DocumentExporter.to_pdf_bytes(text, lang_code, title=title)
        elif fmt in ["txt", "text"]:
            return text.encode("utf-8")
        elif fmt in ["mp3", "audio", "voiceover"]:
            return self.to_audio_bytes(lang_code)
        else:
            raise ValueError(f"Unsupported format '{file_format}'. Supported: 'docx', 'pdf', 'txt', 'mp3'")

    def to_audio_bytes(self, lang_code: str) -> bytes:
        """
        Synthesizes and returns MP3 voiceover audio bytes for the translated text.
        Handles full documents of any length without truncation.
        Caches the audio bytes for fast subsequent access.
        """
        code = lang_code.lower()
        if code in self._audio_cache:
            return self._audio_cache[code]

        text = self.get_text(code)
        audio_data = VoiceoverGenerator.generate_audio_bytes(text, code)
        self._audio_cache[code] = audio_data
        return audio_data

    def save_voiceover(
        self,
        lang_code: str,
        output_path: str,
    ) -> str:
        """Saves complete MP3 voiceover audio file for the specified language."""
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        audio_data = self.to_audio_bytes(lang_code)
        with open(output_path, "wb") as f:
            f.write(audio_data)
        return output_path

    def save_all_voiceovers(
        self,
        output_dir: str,
        parallel: bool = True,
    ) -> Dict[str, str]:
        """
        Generates and saves MP3 voiceover files for all translated languages in output_dir.
        Handles full-length documents from PDF, DOCX, etc.
        Returns mapping of lang_code to created MP3 file path.
        """
        os.makedirs(output_dir, exist_ok=True)
        base_name, _ = os.path.splitext(self.filename or "translated_doc")
        full_texts = {lang: self.get_text(lang) for lang in self.translations.keys()}

        saved = VoiceoverGenerator.generate_all(
            full_texts,
            output_dir=output_dir,
            base_filename=base_name,
            parallel=parallel,
        )
        return saved

    def save(
        self,
        output_path: str,
        lang_code: str,
        file_format: Optional[str] = None,
    ) -> str:
        """
        Saves translation of a specific language to disk.
        If file_format is omitted, it's inferred from the output_path extension.
        """
        code = lang_code.lower()
        if file_format is None:
            _, ext = os.path.splitext(output_path)
            file_format = ext.replace(".", "").lower() or "docx"

        fmt = file_format.lower()
        text = self.get_text(code)
        title = f"Translation - {self.filename}"

        if fmt == "docx":
            DocumentExporter.save_docx(output_path, text, code, title=title)
        elif fmt == "pdf":
            DocumentExporter.save_pdf(output_path, text, code, title=title)
        elif fmt in ["txt", "text"]:
            DocumentExporter.save_txt(output_path, text)
        elif fmt in ["mp3", "audio"]:
            self.save_voiceover(code, output_path)
        else:
            raise ValueError(f"Unsupported export format '{file_format}'. Choose 'docx', 'pdf', 'txt', or 'mp3'.")

        return output_path

    def save_all(
        self,
        output_dir: str,
        formats: Optional[List[str]] = None,
    ) -> Dict[str, List[str]]:
        """
        Saves all translated languages to the designated directory in chosen formats.
        Supports formats: 'docx', 'pdf', 'txt', 'mp3'.
        Returns mapping of lang_code to list of created file paths.
        """
        formats = formats or ["docx", "txt"]
        os.makedirs(output_dir, exist_ok=True)
        base_name, _ = os.path.splitext(self.filename or "translated_doc")

        saved_files: Dict[str, List[str]] = {}

        for lang_code in self.translations.keys():
            saved_files[lang_code] = []
            for fmt in formats:
                fmt_clean = fmt.lower().replace(".", "")
                out_path = os.path.join(output_dir, f"{base_name}_{lang_code}.{fmt_clean}")
                self.save(out_path, lang_code, file_format=fmt_clean)
                saved_files[lang_code].append(out_path)

        return saved_files

    def summary(self) -> Dict[str, Any]:
        """Provides statistics about source document and translations."""
        return {
            "filename": self.filename,
            "format": self.format,
            "char_count": len(self.source_text),
            "word_count": len(self.source_text.split()),
            "chunk_count": len(self.chunks),
            "translated_languages": list(self.translations.keys()),
            "duration_seconds": round(self.duration_seconds, 2),
            "voiceover_supported": VoiceoverGenerator.is_available(),
        }


class DocMultilingualModel:
    """
    Multilingual Document Translation & Voiceover Model.
    Supports input in DOCX, PDF, PPTX, TXT, HTML, and string text.
    Translates into 5 target languages: Hindi, Marathi, Gujarati, English, Telugu.
    Generates natural audio voiceovers in all 5 languages.
    """

    DEFAULT_LANGUAGES = ["hi", "mr", "gu", "en", "te"]

    def __init__(
        self,
        request_timeout: int = 15,
        max_chunk_chars: int = 1500,
    ):
        self.engine = TranslationEngine(request_timeout=request_timeout)
        self.max_chunk_chars = max_chunk_chars

    @staticmethod
    def get_supported_languages() -> Dict[str, Dict[str, str]]:
        """Returns details about supported languages: Hindi, Marathi, Gujarati, English, Telugu."""
        return SUPPORTED_LANGUAGES

    def translate_document(
        self,
        source: Union[str, bytes, BinaryIO],
        target_langs: Optional[List[str]] = None,
        source_lang: str = "auto",
        filename: Optional[str] = None,
        parallel: bool = True,
        progress_callback: Optional[Any] = None,
    ) -> TranslationResult:
        """
        Extracts and translates document into specified target languages.

        Args:
            source: Path to file, raw bytes, or file-like object.
            target_langs: List of language codes (default: all 5 languages).
            source_lang: Source language code or 'auto'.
            filename: Original filename (recommended when passing bytes).
            parallel: Whether to translate multiple targets in parallel threads.
            progress_callback: Optional callable for tracking progress.

        Returns:
            TranslationResult instance with full translations, voiceover synthesis, and export utilities.
        """
        start_time = time.time()
        targets = target_langs or self.DEFAULT_LANGUAGES

        # 1. Extract document contents
        extracted = DocumentExtractor.extract(source, filename=filename)
        paragraphs = extracted["paragraphs"]
        full_text = extracted["full_text"]

        # 2. Chunk text intelligently
        chunks = DocumentExtractor.create_translation_chunks(
            paragraphs, max_chunk_chars=self.max_chunk_chars
        )
        if not chunks and full_text.strip():
            chunks = [full_text.strip()]

        # 3. Translate across all target languages
        translations_dict = self.engine.translate_to_multiple(
            chunks,
            target_langs=targets,
            source_lang=source_lang,
            parallel=parallel,
            progress_callback=progress_callback,
        )

        duration = time.time() - start_time

        return TranslationResult(
            source_filename=extracted.get("filename", "document"),
            source_format=extracted.get("format", "unknown"),
            source_text=full_text,
            chunks=chunks,
            translations=translations_dict,
            metadata=extracted.get("metadata", {}),
            duration_seconds=duration,
        )

    def translate_text(
        self,
        text: str,
        target_langs: Optional[List[str]] = None,
        source_lang: str = "auto",
        parallel: bool = True,
    ) -> TranslationResult:
        """Convenience method to translate plain text string directly."""
        return self.translate_document(
            source=text,
            target_langs=target_langs,
            source_lang=source_lang,
            filename="text_input.txt",
            parallel=parallel,
        )

    def generate_voiceover(
        self,
        text: str,
        lang_code: str,
        output_path: Optional[str] = None,
    ) -> Union[bytes, str]:
        """Convenience method to generate voiceover for any text and language."""
        if output_path:
            return VoiceoverGenerator.save_audio(text, lang_code, output_path)
        return VoiceoverGenerator.generate_audio_bytes(text, lang_code)
