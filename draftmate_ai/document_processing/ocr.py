"""OCR engine integration for scanned documents and image-based PDFs."""

import shutil
from typing import Optional, Tuple
from PIL import Image
import io

from draftmate_ai.shared.exceptions import OCRError
from draftmate_ai.shared.configuration import get_settings
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)

# Try importing pytesseract
try:
    import pytesseract
    _PYTESSERACT_AVAILABLE = True
except ImportError:
    pytesseract = None
    _PYTESSERACT_AVAILABLE = False


def is_tesseract_installed(cmd_path: Optional[str] = None) -> bool:
    """Check if Tesseract binary is available on system PATH or configured path."""
    if not _PYTESSERACT_AVAILABLE:
        return False

    settings = get_settings()
    path_to_check = cmd_path or settings.TESSERACT_CMD_PATH

    if path_to_check:
        return shutil.which(path_to_check) is not None or shutil.os.path.exists(path_to_check)

    # Check default PATH
    return shutil.which("tesseract") is not None


def configure_tesseract() -> bool:
    """Configure pytesseract binary path from settings if available."""
    if not _PYTESSERACT_AVAILABLE:
        return False

    settings = get_settings()
    if settings.TESSERACT_CMD_PATH:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD_PATH
        return True

    if shutil.which("tesseract"):
        return True

    return False


def is_scanned_page(extracted_text: str, image_count: int, min_text_len: int = 30) -> bool:
    """Determine whether a document page is primarily scanned or image-based.

    Args:
        extracted_text: Text extracted via standard PDF parser.
        image_count: Number of embedded images found on the page.
        min_text_len: Minimum text length threshold to classify page as text-based.

    Returns:
        True if page contains little or no text and contains embedded images.
    """
    clean_text = extracted_text.strip() if extracted_text else ""
    return len(clean_text) < min_text_len and image_count > 0


def ocr_image(
    image: Image.Image,
    lang: str = "eng",
    strict: bool = False,
) -> Tuple[str, float]:
    """Perform OCR on a PIL Image instance.

    Args:
        image: PIL Image object.
        lang: Tesseract language string (e.g. 'eng').
        strict: If True, raises OCRError if Tesseract is not available or fails.

    Returns:
        Tuple of (extracted_text, confidence_score 0-100).
    """
    if not _PYTESSERACT_AVAILABLE or not is_tesseract_installed():
        msg = "Tesseract OCR engine is not installed or not found on PATH."
        logger.warning(msg)
        if strict:
            raise OCRError(msg)
        return "", 0.0

    configure_tesseract()

    try:
        data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
        text_parts = []
        confidences = []

        for text, conf in zip(data["text"], data["conf"]):
            clean_token = text.strip()
            if clean_token:
                text_parts.append(clean_token)
                try:
                    c = float(conf)
                    if c >= 0:
                        confidences.append(c)
                except (ValueError, TypeError):
                    pass

        extracted_text = " ".join(text_parts).strip()
        avg_conf = (sum(confidences) / len(confidences)) if confidences else 0.0
        return extracted_text, round(avg_conf, 2)

    except Exception as e:
        msg = f"OCR execution failed: {str(e)}"
        logger.error(msg)
        if strict:
            raise OCRError(msg) from e
        return "", 0.0


def ocr_pymupdf_page(
    page,
    dpi: int = 300,
    lang: str = "eng",
    strict: bool = False,
) -> Tuple[str, float]:
    """Render a PyMuPDF page to an image and run OCR.

    Args:
        page: PyMuPDF page object (fitz.Page).
        dpi: Rendering resolution for OCR.
        lang: Language string.
        strict: If True, raise OCRError on failure.

    Returns:
        Tuple of (ocr_text, confidence_score).
    """
    try:
        import pymupdf

        zoom = dpi / 72.0
        matrix = pymupdf.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        return ocr_image(img, lang=lang, strict=strict)
    except Exception as e:
        msg = f"Failed rendering or performing OCR on PDF page: {str(e)}"
        logger.warning(msg)
        if strict:
            raise OCRError(msg) from e
        return "", 0.0

