# Multilingual Document Translation & Voiceover Studio

An end-to-end NLP model and pipeline that extracts text from documents (**DOCX, PDF, PPTX, TXT, MD, HTML**), translates it accurately into **five languages**, and generates high-fidelity **AI Voiceovers (MP3)**:

| Code | Language | Script | Native Name | Voiceover Audio |
| :---: | :---: | :---: | :---: | :---: |
| **`hi`** | Hindi | Devanagari | हिन्दी | 🎙️ High Quality MP3 |
| **`mr`** | Marathi | Devanagari | मराठी | 🎙️ High Quality MP3 |
| **`gu`** | Gujarati | Gujarati | ગુજરાતી | 🎙️ High Quality MP3 |
| **`en`** | English | Latin | English | 🎙️ High Quality MP3 |
| **`te`** | Telugu | Telugu | తెలుగు | 🎙️ High Quality MP3 |

---

## 🌟 Key Features

- **Document Ingestion**:
  - **DOCX**: Extracts paragraphs, headings, bullet lists, and tables.
  - **PDF**: PyMuPDF (`fitz`) and `pypdf` extraction preserving layout and sections.
  - **PPTX**: Slides, shapes, notes, and tables.
  - **TXT / MD / HTML / RTF**: Multi-encoding safe reading (`utf-8`, `utf-8-sig`, `cp1252`, `latin-1`).
- **Parallel Multi-Target Translation**:
  - Concurrent multi-threaded translation into all 5 target languages.
  - Intelligent sentence boundary chunking (`.`, `?`, `!`, `।`).
- **AI Voiceover Studio (TTS)**:
  - Natural speech voiceover synthesis for **Hindi, Marathi, Gujarati, English, and Telugu**.
  - Direct in-memory streaming audio bytes or export to `.mp3` files.
- **Multi-Format Export**:
  - Exports translated documents to **DOCX** (with native Indian script typography), **PDF**, **TXT**, and **MP3** voiceovers.
- **Three Interfaces**:
  1. **Python API**: Direct programmatic access via `DocMultilingualModel`.
  2. **CLI**: Fast terminal tool with `--voiceover` support.
  3. **Interactive Web UI**: Modern Streamlit app with embedded audio players, side-by-side comparison, and bulk ZIP download.

---

## 🚀 Quick Start

### 1. Requirements

Install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Python API Usage

```python
from doc_translator import DocMultilingualModel

# Initialize model
model = DocMultilingualModel()

# Translate a document (DOCX, PDF, PPTX, TXT)
result = model.translate_document(
    "annual_report.pdf",
    target_langs=["hi", "mr", "gu", "en", "te"],
    parallel=True
)

# 1. Access translated text
hindi_text = result.get_text("hi")
marathi_text = result.get_text("mr")
gujarati_text = result.get_text("gu")
telugu_text = result.get_text("te")
english_text = result.get_text("en")

# 2. Generate voiceover audio bytes (MP3)
hindi_audio_bytes = result.to_audio_bytes("hi")
telugu_audio_bytes = result.to_audio_bytes("te")

# 3. Save voiceovers and documents to disk
result.save_voiceover("hi", "report_hindi.mp3")
result.save_voiceover("te", "report_telugu.mp3")

# Bulk save all 5 languages in DOCX, PDF, TXT, and MP3 audio
result.save_all(output_dir="./translated_docs", formats=["docx", "pdf", "txt", "mp3"])
```

### 3. Generate Standalone Voiceover for Any Text

```python
from doc_translator import DocMultilingualModel

model = DocMultilingualModel()

# Directly synthesize voiceover for any text and language
audio_data = model.generate_voiceover(
    "नमस्ते, आप कैसे हैं?",
    lang_code="hi",
    output_path="hindi_greeting.mp3"
)
```

---

## 🖥️ Command-Line Interface (CLI)

Run translation and voiceover generation directly from your terminal:

```bash
# Translate PDF to all 5 languages with voiceover MP3 audio files:
python cli.py document.pdf --targets hi mr gu en te --voiceover --output-dir ./output

# Translate a DOCX document to Hindi and Gujarati with voiceovers:
python cli.py contract.docx --targets hi gu --voiceover --output-dir ./output

# Translate raw text and synthesize audio:
python cli.py "Welcome to the international conference on AI." --targets hi mr gu en te --voiceover
```

---

## 🌐 Interactive Web Studio (Streamlit)

Launch the web studio in your browser:

```bash
streamlit run app.py
```

The web app includes:
- **Audio Players**: Listen to the generated voiceover for each translated language right in your browser.
- **Source Audio**: Listen to the voiceover of the original document text.
- **One-Click Downloads**: Download `.docx`, `.pdf`, `.txt`, and `.mp3` voiceover files individually.
- **Bulk ZIP Export**: Download all translated documents and all `.mp3` voiceover audios in one single ZIP package!

---

## 🧪 Running Unit Tests

Run the full automated test suite (including voiceover tests):

```bash
python test_translator.py
```
*(All 8 unit and integration tests run and pass cleanly).*

---

## 📁 Project Architecture

```
nlp/
├── doc_translator/
│   ├── __init__.py           # Package exports & versioning
│   ├── extractor.py          # Document parsing (DOCX, PDF, PPTX, TXT, MD, HTML)
│   ├── engine.py             # Neural translation engine & multi-threading
│   ├── exporter.py           # Formatted export (DOCX, PDF, TXT, JSON)
│   ├── voiceover.py          # Voiceover audio synthesis for all 5 languages
│   └── model.py              # Unified DocMultilingualModel interface
├── app.py                    # Streamlit web studio with audio players
├── cli.py                    # Command-line interface with --voiceover
├── test_translator.py        # Automated test suite (8 tests)
├── requirements.txt          # Dependencies list
└── README.md                 # Complete documentation
```
