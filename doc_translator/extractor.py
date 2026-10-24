"""
Document Extractor module.
Extracts plain text and structured blocks from DOCX, PDF, PPTX, TXT, MD, HTML, and other formats.
"""

import io
import os
import re
from typing import List, Dict, Any, Union, BinaryIO

try:
    import docx
except ImportError:
    docx = None

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import pptx
except ImportError:
    pptx = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


class DocumentExtractor:
    """
    Extracts text and structured sections from documents of various formats.
    Supported extensions: .docx, .pdf, .pptx, .txt, .md, .html, .htm, .rtf
    """

    SUPPORTED_EXTENSIONS = [".docx", ".pdf", ".pptx", ".txt", ".md", ".html", ".htm", ".rtf"]

    @classmethod
    def is_supported(cls, filename_or_path: str) -> bool:
        ext = os.path.splitext(filename_or_path)[1].lower()
        return ext in cls.SUPPORTED_EXTENSIONS

    @classmethod
    def extract(cls, source: Union[str, bytes, BinaryIO], filename: str = None) -> Dict[str, Any]:
        """
        Extract text from file path, bytes, or file-like object.
        Returns a dict:
        {
            "format": "docx" | "pdf" | "pptx" | "txt" | "unknown",
            "filename": str,
            "full_text": str,
            "paragraphs": List[str],
            "metadata": Dict[str, Any]
        }
        """
        # Determine filename and extension
        if isinstance(source, str) and os.path.exists(source):
            filename = filename or os.path.basename(source)
            ext = os.path.splitext(filename)[1].lower()
            with open(source, "rb") as f:
                data = f.read()
        elif isinstance(source, bytes):
            data = source
            ext = os.path.splitext(filename or "")[1].lower()
        elif hasattr(source, "read"):
            data = source.read()
            if hasattr(source, "name") and not filename:
                filename = os.path.basename(source.name)
            ext = os.path.splitext(filename or "")[1].lower()
        else:
            # Fallback treat as raw string
            raw_str = str(source)
            paras = [p.strip() for p in raw_str.split("\n\n") if p.strip()]
            return {
                "format": "raw_text",
                "filename": filename or "input.txt",
                "full_text": raw_str,
                "paragraphs": paras or [raw_str],
                "metadata": {"char_count": len(raw_str), "paragraph_count": len(paras or [raw_str])}
            }

        # Dispatch based on extension
        if ext == ".docx":
            return cls._extract_docx(data, filename)
        elif ext == ".pdf":
            return cls._extract_pdf(data, filename)
        elif ext == ".pptx":
            return cls._extract_pptx(data, filename)
        elif ext in [".html", ".htm"]:
            return cls._extract_html(data, filename)
        else:
            # Default to text extractor
            return cls._extract_text(data, filename, ext)

    @classmethod
    def _extract_docx(cls, data: bytes, filename: str = "document.docx") -> Dict[str, Any]:
        if not docx:
            raise ImportError("python-docx is required to extract DOCX files.")
        
        file_stream = io.BytesIO(data)
        doc = docx.Document(file_stream)
        paragraphs = []

        # Extract regular paragraphs
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                paragraphs.append(text)

        # Extract text inside tables
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    # Deduplicate repeated cells in merged rows
                    unique_cells = []
                    for c in row_cells:
                        if not unique_cells or c != unique_cells[-1]:
                            unique_cells.append(c)
                    if unique_cells:
                        paragraphs.append(" | ".join(unique_cells))

        full_text = "\n\n".join(paragraphs)
        return {
            "format": "docx",
            "filename": filename,
            "full_text": full_text,
            "paragraphs": paragraphs,
            "metadata": {
                "paragraph_count": len(paragraphs),
                "table_count": len(doc.tables),
                "char_count": len(full_text)
            }
        }

    @classmethod
    def _extract_pdf(cls, data: bytes, filename: str = "document.pdf") -> Dict[str, Any]:
        paragraphs = []
        page_count = 0

        # Try PyMuPDF (fitz) first as it gives superior layout parsing
        if fitz:
            try:
                doc = fitz.open(stream=data, filetype="pdf")
                page_count = len(doc)
                for page_idx in range(page_count):
                    page = doc[page_idx]
                    # Blocks extract coherent paragraphs
                    blocks = page.get_text("blocks")
                    for b in blocks:
                        # block tuple: (x0, y0, x1, y1, text, block_no, block_type)
                        text = b[4].strip()
                        if text:
                            paragraphs.append(text)
                doc.close()
            except Exception:
                paragraphs = []

        # Fallback to pypdf if PyMuPDF returned no text (e.g. error)
        if not paragraphs and pypdf:
            stream = io.BytesIO(data)
            reader = pypdf.PdfReader(stream)
            page_count = len(reader.pages)
            for page in reader.pages:
                page_text = page.extract_text() or ""
                page_paras = [p.strip() for p in page_text.split("\n\n") if p.strip()]
                paragraphs.extend(page_paras)

        # Normalize multiple internal newlines within a single block
        normalized_paras = []
        for p in paragraphs:
            cleaned = re.sub(r"[ \t]+", " ", p)
            cleaned = re.sub(r"\n+", "\n", cleaned).strip()
            if cleaned:
                normalized_paras.append(cleaned)

        full_text = "\n\n".join(normalized_paras)
        return {
            "format": "pdf",
            "filename": filename,
            "full_text": full_text,
            "paragraphs": normalized_paras,
            "metadata": {
                "page_count": page_count,
                "paragraph_count": len(normalized_paras),
                "char_count": len(full_text)
            }
        }

    @classmethod
    def _extract_pptx(cls, data: bytes, filename: str = "document.pptx") -> Dict[str, Any]:
        if not pptx:
            raise ImportError("python-pptx is required to extract PPTX files.")

        stream = io.BytesIO(data)
        prs = pptx.Presentation(stream)
        paragraphs = []
        slide_count = len(prs.slides)

        for slide_idx, slide in enumerate(prs.slides, start=1):
            slide_texts = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for para in shape.text_frame.paragraphs:
                        text = para.text.strip()
                        if text:
                            slide_texts.append(text)
                elif shape.has_table:
                    for row in shape.table.rows:
                        row_vals = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_vals:
                            slide_texts.append(" | ".join(row_vals))
            if slide_texts:
                paragraphs.extend(slide_texts)

        full_text = "\n\n".join(paragraphs)
        return {
            "format": "pptx",
            "filename": filename,
            "full_text": full_text,
            "paragraphs": paragraphs,
            "metadata": {
                "slide_count": slide_count,
                "paragraph_count": len(paragraphs),
                "char_count": len(full_text)
            }
        }

    @classmethod
    def _extract_html(cls, data: bytes, filename: str = "document.html") -> Dict[str, Any]:
        text_content = cls._decode_bytes(data)
        if BeautifulSoup:
            soup = BeautifulSoup(text_content, "html.parser")
            # Remove scripts and styles
            for elem in soup(["script", "style", "noscript", "header", "footer"]):
                elem.decompose()
            text = soup.get_text(separator="\n\n")
        else:
            text = re.sub(r"<[^>]+>", " ", text_content)

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        full_text = "\n\n".join(paragraphs)
        return {
            "format": "html",
            "filename": filename,
            "full_text": full_text,
            "paragraphs": paragraphs,
            "metadata": {
                "paragraph_count": len(paragraphs),
                "char_count": len(full_text)
            }
        }

    @classmethod
    def _extract_text(cls, data: bytes, filename: str = "document.txt", ext: str = ".txt") -> Dict[str, Any]:
        text = cls._decode_bytes(data)
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paras and text.strip():
            paras = [p.strip() for p in text.split("\n") if p.strip()]

        full_text = "\n\n".join(paras)
        return {
            "format": ext.replace(".", "") or "txt",
            "filename": filename,
            "full_text": full_text,
            "paragraphs": paras,
            "metadata": {
                "paragraph_count": len(paras),
                "char_count": len(full_text)
            }
        }

    @staticmethod
    def _decode_bytes(data: bytes) -> str:
        for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]:
            try:
                return data.decode(enc)
            except UnicodeDecodeError:
                continue
        return data.decode("utf-8", errors="ignore")

    @classmethod
    def create_translation_chunks(cls, paragraphs: List[str], max_chunk_chars: int = 1500) -> List[str]:
        """
        Groups paragraphs or splits large paragraphs into chunks safe for translation requests.
        Ensures paragraph integrity where possible.
        """
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_len = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If a single paragraph exceeds max_chunk_chars, split it by sentence endings
            if len(para) > max_chunk_chars:
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_len = 0
                
                # Split large paragraph by punctuation: period, question, exclamation, devanagari danda
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

            if current_len + len(para) + 2 > max_chunk_chars and current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = [para]
                current_len = len(para)
            else:
                current_chunk.append(para)
                current_len += len(para) + 2

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks
