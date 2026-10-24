"""
Voiceover Generator module.
Converts any text—from DOCX, PDF, PPTX, TXT, or manual input—of ANY length
into complete, natural-sounding audio speech (MP3) for:
- Hindi (hi)
- Marathi (mr)
- Gujarati (gu)
- English (en)
- Telugu (te)

Uses High-Definition Microsoft Neural Voices (Edge-TTS) with chunked synthesis
and automatic multi-tier fallback to Google TTS (gTTS) and local SAPI.
"""

import asyncio
import base64
import io
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Optional, Union, List

try:
    import edge_tts
except ImportError:
    edge_tts = None

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None

from .engine import SUPPORTED_LANGUAGES


class VoiceoverGenerator:
    """
    Synthesizes complete speech audio for any text or document in
    Hindi, Marathi, Gujarati, English, and Telugu.
    No length restriction: automatically chunks long documents and concatenates audio.
    """

    SUPPORTED_VOICE_LANGS = ["hi", "mr", "gu", "en", "te"]

    # Neural Voices for each language (natural human cadence & pronunciation)
    EDGE_VOICES = {
        "hi": "hi-IN-MadhurNeural",
        "mr": "mr-IN-AarohiNeural",
        "gu": "gu-IN-DhwaniNeural",
        "te": "te-IN-MohanNeural",
        "en": "en-IN-NeerjaNeural",
    }

    # Backup gTTS language codes
    GTTS_LANG_MAP = {
        "hi": "hi",
        "mr": "mr",
        "gu": "gu",
        "en": "en",
        "te": "te",
    }

    @classmethod
    def is_available(cls) -> bool:
        return edge_tts is not None or gTTS is not None or pyttsx3 is not None

    @classmethod
    def clean_text_for_speech(cls, text: str) -> str:
        """
        Cleans text to sound natural in speech synthesis.
        Removes markdown links, code blocks, excessive symbols, and cleans whitespace.
        Does NOT truncate text.
        """
        if not text:
            return ""

        # Remove markdown URLs, brackets, formatting characters
        cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
        cleaned = re.sub(r"[#*_~`|]", " ", cleaned)
        # Normalize multiple spaces and multiple newlines
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()

        return cleaned

    @classmethod
    def split_text_into_speech_chunks(cls, text: str, max_chunk_chars: int = 2500) -> List[str]:
        """
        Splits text of arbitrary length (e.g. from entire PDF or DOCX) into coherent
        chunks suitable for TTS synthesis. Never splits in the middle of a sentence.
        """
        if len(text) <= max_chunk_chars:
            return [text]

        chunks: List[str] = []
        # Split first by paragraphs
        paragraphs = text.split("\n")
        current_chunk = []
        current_len = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If a single paragraph is larger than max_chunk_chars, split by sentence endings
            if len(para) > max_chunk_chars:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_len = 0

                sentences = re.split(r"(?<=[.!?।])\s+", para)
                sub_chunk = []
                sub_len = 0
                for sent in sentences:
                    sent = sent.strip()
                    if not sent:
                        continue
                    if sub_len + len(sent) > max_chunk_chars and sub_chunk:
                        chunks.append(" ".join(sub_chunk))
                        sub_chunk = [sent]
                        sub_len = len(sent)
                    else:
                        sub_chunk.append(sent)
                        sub_len += len(sent) + 1
                if sub_chunk:
                    chunks.append(" ".join(sub_chunk))
                continue

            if current_len + len(para) + 1 > max_chunk_chars and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [para]
                current_len = len(para)
            else:
                current_chunk.append(para)
                current_len += len(para) + 1

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks or [text]

    @classmethod
    def generate_audio_bytes(
        cls,
        text: str,
        lang_code: str,
        slow: bool = False,
    ) -> bytes:
        """
        Generates full-length MP3 audio bytes for any text of any length
        (DOCX, PDF, PPTX, TXT, or string input).
        Handles multi-chunk synthesis and seamless MP3 concatenation.
        """
        code = lang_code.lower().strip()
        cleaned_text = cls.clean_text_for_speech(text)

        if not cleaned_text:
            raise ValueError("Cannot generate voiceover for empty text.")

        chunks = cls.split_text_into_speech_chunks(cleaned_text, max_chunk_chars=2500)
        audio_parts: List[bytes] = []

        for chunk in chunks:
            chunk = chunk.strip()
            if not chunk:
                continue
            part = cls._synthesize_single_chunk(chunk, code, slow=slow)
            if part:
                audio_parts.append(part)

        if not audio_parts:
            raise RuntimeError(f"Voiceover generation produced no audio for '{lang_code}'.")

        # Concatenate MP3 frames
        return b"".join(audio_parts)

    @classmethod
    def _synthesize_single_chunk(cls, text: str, lang_code: str, slow: bool = False) -> bytes:
        """Synthesizes a single chunk using Edge-TTS -> gTTS -> pyttsx3."""
        last_error = None

        # 1. Tier 1: Microsoft Edge Neural TTS
        if edge_tts is not None:
            voice_name = cls.EDGE_VOICES.get(lang_code)
            if voice_name:
                try:
                    data = cls._generate_edge_tts(text, voice_name)
                    if data and len(data) > 200:
                        return data
                except Exception as exc:
                    last_error = exc

        # 2. Tier 2: Google Translate TTS (gTTS)
        if gTTS is not None:
            gtts_lang = cls.GTTS_LANG_MAP.get(lang_code, lang_code)
            try:
                tts = gTTS(text=text, lang=gtts_lang, slow=slow)
                buffer = io.BytesIO()
                tts.write_to_fp(buffer)
                buffer.seek(0)
                data = buffer.getvalue()
                if data and len(data) > 200:
                    return data
            except Exception as exc:
                last_error = exc

        # 3. Tier 3: pyttsx3 fallback (for English)
        if pyttsx3 is not None and lang_code == "en":
            try:
                return cls._pyttsx3_audio_bytes(text)
            except Exception as exc:
                last_error = exc

        raise RuntimeError(
            f"Voiceover synthesis failed for language '{lang_code}'. Last error: {last_error}"
        )

    @classmethod
    def _generate_edge_tts(cls, text: str, voice: str) -> bytes:
        """
        Runs Edge-TTS in an isolated thread to prevent event loop collision in Streamlit.
        """
        def _worker():
            async def _async_task():
                communicate = edge_tts.Communicate(text, voice)
                audio_buffer = b""
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_buffer += chunk["data"]
                return audio_buffer

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(_async_task())
            finally:
                loop.close()

        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_worker)
            return future.result(timeout=40)

    @classmethod
    def to_html_audio_player(cls, audio_bytes: bytes, audio_id: str = "player") -> str:
        """
        Generates a responsive HTML5 audio player with an embedded base64 Data URI.
        Preloads automatically and plays reliably in all browsers (Chrome, Edge, Firefox, Safari)
        even inside hidden tabs.
        """
        if not audio_bytes:
            return "<em>No audio available</em>"

        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
        html = f"""
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 12px 16px; border-radius: 10px; margin: 8px 0; border: 1px solid #334155;">
            <audio id="{audio_id}" controls preload="auto" style="width: 100%; height: 38px; outline: none;">
                <source src="data:audio/mpeg;base64,{b64_audio}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        </div>
        """
        return html

    @classmethod
    def save_audio(
        cls,
        text: str,
        lang_code: str,
        output_path: str,
        slow: bool = False,
    ) -> str:
        """
        Generates and saves MP3 audio file to the designated path.
        """
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        audio_data = cls.generate_audio_bytes(text, lang_code, slow=slow)
        with open(output_path, "wb") as f:
            f.write(audio_data)
        return output_path

    @classmethod
    def generate_all(
        cls,
        translations: Dict[str, str],
        output_dir: Optional[str] = None,
        base_filename: str = "voiceover",
        parallel: bool = True,
    ) -> Dict[str, Union[bytes, str]]:
        """
        Generates voiceovers for multiple languages in parallel.
        """
        results: Dict[str, Union[bytes, str]] = {}

        def _task(lang_code: str, text_content: str):
            if output_dir:
                out_path = os.path.join(output_dir, f"{base_filename}_{lang_code}.mp3")
                saved = cls.save_audio(text_content, lang_code, out_path)
                return lang_code, saved
            else:
                audio_bytes = cls.generate_audio_bytes(text_content, lang_code)
                return lang_code, audio_bytes

        if parallel and len(translations) > 1:
            with ThreadPoolExecutor(max_workers=min(len(translations), 5)) as executor:
                futures = {
                    executor.submit(_task, lang, text): lang
                    for lang, text in translations.items()
                    if text and text.strip()
                }
                for fut in as_completed(futures):
                    lang, res = fut.result()
                    results[lang] = res
        else:
            for lang, text in translations.items():
                if text and text.strip():
                    lang, res = _task(lang, text)
                    results[lang] = res

        return results

    @classmethod
    def _pyttsx3_audio_bytes(cls, text: str) -> bytes:
        """Fallback for English using local pyttsx3."""
        import tempfile
        engine = pyttsx3.init()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            engine.save_to_file(text, tmp_path)
            engine.runAndWait()
            with open(tmp_path, "rb") as f:
                data = f.read()
            return data
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
