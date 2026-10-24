"""
Translation Engine module.
Provides fast, accurate neural translation into Hindi, Marathi, Gujarati, English, and Telugu.
Supports concurrent multi-target translation, chunking, and fallback engines.
"""

import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Union, Callable
import requests

try:
    from deep_translator import GoogleTranslator, MyMemoryTranslator
except ImportError:
    GoogleTranslator = None
    MyMemoryTranslator = None

# 5 Target Languages defined by user request
SUPPORTED_LANGUAGES: Dict[str, Dict[str, str]] = {
    "hi": {
        "name": "Hindi",
        "native": "हिन्दी",
        "script": "Devanagari",
        "font_hint": "Mangal",
    },
    "mr": {
        "name": "Marathi",
        "native": "मराठी",
        "script": "Devanagari",
        "font_hint": "Mangal",
    },
    "gu": {
        "name": "Gujarati",
        "native": "ગુજરાતી",
        "script": "Gujarati",
        "font_hint": "Shruti",
    },
    "en": {
        "name": "English",
        "native": "English",
        "script": "Latin",
        "font_hint": "Arial",
    },
    "te": {
        "name": "Telugu",
        "native": "తెలుగు",
        "script": "Telugu",
        "font_hint": "Gautami",
    },
}


class TranslationEngine:
    """
    Multilingual Translation Engine supporting Hindi, Marathi, Gujarati, English, and Telugu.
    """

    def __init__(self, request_timeout: int = 15, max_retries: int = 3):
        self.request_timeout = request_timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        })

    @staticmethod
    def get_supported_languages() -> Dict[str, Dict[str, str]]:
        return SUPPORTED_LANGUAGES

    @staticmethod
    def validate_language(lang_code: str) -> str:
        code = lang_code.strip().lower()
        if code not in SUPPORTED_LANGUAGES:
            # Check by language name
            for k, info in SUPPORTED_LANGUAGES.items():
                if info["name"].lower() == code or info["native"].lower() == code:
                    return k
            valid_keys = ", ".join(SUPPORTED_LANGUAGES.keys())
            raise ValueError(f"Language '{lang_code}' not supported. Choose from: {valid_keys}")
        return code

    def translate_text(
        self,
        text: str,
        target_lang: str,
        source_lang: str = "auto"
    ) -> str:
        """
        Translates a single string of text into the specified target language.
        Handles retry and fallback.
        """
        if not text or not text.strip():
            return text

        target_code = self.validate_language(target_lang)

        # Optimization: if explicit source and target match, return as is
        if source_lang.lower() == target_code:
            return text

        # Attempt Primary Engine (GTX)
        try:
            return self._translate_gtx(text, target_code, source_lang)
        except Exception as e:
            # Fallback to secondary engines
            return self._translate_fallback(text, target_code, source_lang, str(e))

    def _translate_gtx(self, text: str, target_lang: str, source_lang: str = "auto") -> str:
        """
        Primary engine: Google GTX endpoint.
        """
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": source_lang,
            "tl": target_lang,
            "dt": "t",
            "q": text,
        }

        last_err = None
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, params=params, timeout=self.request_timeout)
                if resp.status_code == 200:
                    data = resp.json()
                    # data[0] contains list of [translated_segment, original_segment, ...]
                    translated_parts = [segment[0] for segment in data[0] if segment and segment[0]]
                    return "".join(translated_parts)
                elif resp.status_code == 429:
                    time.sleep(1.0 * (attempt + 1))
                else:
                    time.sleep(0.5)
            except Exception as exc:
                last_err = exc
                time.sleep(0.8 * (attempt + 1))

        raise RuntimeError(f"GTX translation failed after {self.max_retries} attempts: {last_err}")

    def _translate_fallback(self, text: str, target_lang: str, source_lang: str, original_err: str) -> str:
        """
        Fallback using deep-translator classes.
        """
        if GoogleTranslator:
            try:
                src = "auto" if source_lang == "auto" else source_lang
                translator = GoogleTranslator(source=src, target=target_lang)
                return translator.translate(text)
            except Exception:
                pass

        if MyMemoryTranslator:
            try:
                lang_map = {
                    "hi": "hi-IN",
                    "mr": "mr-IN",
                    "gu": "gu-IN",
                    "en": "en-GB",
                    "te": "te-IN",
                }
                t_code = lang_map.get(target_lang, target_lang)
                s_code = "en-GB" if source_lang == "auto" else lang_map.get(source_lang, source_lang)
                mm = MyMemoryTranslator(source=s_code, target=t_code)
                return mm.translate(text)
            except Exception:
                pass

        # If all backends fail, return text with warning indicator or raise
        raise RuntimeError(f"All translation backends failed. Last error: {original_err}")

    def translate_chunks(
        self,
        chunks: List[str],
        target_lang: str,
        source_lang: str = "auto",
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[str]:
        """
        Translates a list of text chunks into target_lang sequentially with delay
        to respect rate limits.
        """
        target_code = self.validate_language(target_lang)
        results = []
        total = len(chunks)

        for idx, chunk in enumerate(chunks):
            if not chunk.strip():
                results.append(chunk)
            else:
                translated = self.translate_text(chunk, target_code, source_lang)
                results.append(translated)

            if progress_callback:
                progress_callback(idx + 1, total)

            # Polite small pause between rapid chunk requests
            if idx < total - 1:
                time.sleep(0.1)

        return results

    def translate_to_multiple(
        self,
        text_or_chunks: Union[str, List[str]],
        target_langs: List[str],
        source_lang: str = "auto",
        parallel: bool = True,
        progress_callback: Optional[Callable[[str, int, int], None]] = None,
    ) -> Dict[str, Union[str, List[str]]]:
        """
        Translates text or chunks into multiple target languages.
        If parallel=True, translates to all target languages concurrently using threads.

        Returns:
            Dict[lang_code, translated_text_or_chunks]
        """
        valid_targets = [self.validate_language(t) for t in target_langs]
        is_single_str = isinstance(text_or_chunks, str)
        chunks = [text_or_chunks] if is_single_str else text_or_chunks

        results: Dict[str, Union[str, List[str]]] = {}

        def _worker(tgt: str):
            def _prog(done, total):
                if progress_callback:
                    progress_callback(tgt, done, total)

            translated_chunks = self.translate_chunks(
                chunks,
                target_lang=tgt,
                source_lang=source_lang,
                progress_callback=_prog if progress_callback else None,
            )
            if is_single_str:
                return tgt, translated_chunks[0] if translated_chunks else ""
            else:
                return tgt, translated_chunks

        if parallel and len(valid_targets) > 1:
            with ThreadPoolExecutor(max_workers=min(len(valid_targets), 5)) as executor:
                futures = {executor.submit(_worker, tgt): tgt for tgt in valid_targets}
                for fut in as_completed(futures):
                    tgt_code, res = fut.result()
                    results[tgt_code] = res
        else:
            for tgt in valid_targets:
                _, res = _worker(tgt)
                results[tgt] = res

        return results

