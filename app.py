"""
Streamlit Web Application: Multilingual Document Translator & Voiceover Studio
Upload DOCX, PDF, PPTX, or TXT documents and translate them into:
Hindi, Marathi, Gujarati, English, and Telugu with natural voiceover audio synthesis.
"""

import io
import time
import zipfile
import streamlit as st

from doc_translator import (
    DocMultilingualModel,
    DocumentExtractor,
    SUPPORTED_LANGUAGES,
    VoiceoverGenerator,
)

# Page configuration
st.set_page_config(
    page_title="Multilingual Document Translator & Voiceover Studio",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for styling
st.markdown(
    """
    <style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.5rem;
    }
    .lang-badge {
        display: inline-block;
        padding: 4px 10px;
        margin: 2px 4px;
        border-radius: 14px;
        font-size: 0.85rem;
        font-weight: 600;
        background-color: #EEF2FF;
        color: #4338CA;
        border: 1px solid #C7D2FE;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
    }
    .metric-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: #0F172A;
    }
    .metric-label {
        font-size: 0.8rem;
        color: #64748B;
        text-transform: uppercase;
    }
    .audio-container {
        background: #0f172a;
        padding: 12px 16px;
        border-radius: 10px;
        margin: 10px 0;
        border: 1px solid #334155;
    }
    .stDownloadButton button {
        width: 100%;
        border-radius: 6px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# App Header
st.markdown('<div class="main-title">🎙️ Multilingual Document Translator & Voiceover Studio</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-title">'
    'Convert text from <b>DOCX, PDF, PPTX, TXT</b> into 5 languages with natural <b>AI Voiceovers</b>: '
    '<span class="lang-badge">🇮🇳 Hindi (हिन्दी)</span>'
    '<span class="lang-badge">🇮🇳 Marathi (मराठी)</span>'
    '<span class="lang-badge">🇮🇳 Gujarati (ગુજરાતી)</span>'
    '<span class="lang-badge">🇬🇧 English</span>'
    '<span class="lang-badge">🇮🇳 Telugu (తెలుగు)</span>'
    '</div>',
    unsafe_allow_html=True,
)

# Sidebar Configuration
with st.sidebar:
    st.header("⚙️ Settings")

    st.subheader("Target Languages")
    select_all = st.checkbox("Select All 5 Languages", value=True)

    selected_langs = []
    for code, info in SUPPORTED_LANGUAGES.items():
        label = f"{info['name']} ({info['native']})"
        if select_all:
            checked = True
            st.checkbox(label, value=True, key=f"lang_{code}", disabled=True)
            selected_langs.append(code)
        else:
            is_checked = st.checkbox(label, value=(code in ["hi", "mr", "gu", "en", "te"]), key=f"lang_{code}")
            if is_checked:
                selected_langs.append(code)

    st.divider()
    source_lang_option = st.selectbox(
        "Source Language",
        options=["auto", "en", "hi", "mr", "gu", "te"],
        format_func=lambda x: "Auto Detect" if x == "auto" else f"{SUPPORTED_LANGUAGES.get(x, {}).get('name', x)} [{x}]",
    )

    parallel_mode = st.toggle(
        "Parallel Multi-target Translation",
        value=True,
        help="Translates all selected languages concurrently using multi-threading.",
    )

    enable_voiceovers = st.toggle(
        "Generate Voiceovers (Audio MP3)",
        value=True,
        help="Synthesizes neural speech audio for all translated languages.",
    )

    st.divider()
    st.info(
        "💡 **Features & Supported Formats:**\n\n"
        "- **Documents:** `.docx`, `.pdf`, `.pptx`, `.txt`, `.md`, `.html`\n"
        "- **Voiceover Engine:** Neural TTS (Hindi, Marathi, Gujarati, English, Telugu)\n"
        "- **Exports:** DOCX (Indic Fonts), PDF, TXT, MP3 Audio, ZIP"
    )

# Input Tabs
input_tab1, input_tab2 = st.tabs(["📁 Upload Document", "✍️ Paste Plain Text"])

uploaded_file = None
pasted_text = ""

with input_tab1:
    uploaded_file = st.file_uploader(
        "Choose a document to translate:",
        type=["docx", "pdf", "pptx", "txt", "md", "html", "htm"],
        help="Upload DOCX, PDF, PPTX, TXT, MD, or HTML file",
    )
    if uploaded_file:
        file_details = {
            "Filename": uploaded_file.name,
            "File size": f"{uploaded_file.size / 1024:.1f} KB",
            "Type": uploaded_file.type,
        }
        st.caption(f"📄 **{uploaded_file.name}** ({file_details['File size']})")

with input_tab2:
    pasted_text = st.text_area(
        "Enter text to translate:",
        height=200,
        placeholder="Type or paste any text in English, Hindi, or any language here...",
    )

translate_btn = st.button("🚀 Translate Document & Generate Voiceovers", type="primary", use_container_width=True)

# State initialization
if "result" not in st.session_state:
    st.session_state.result = None
if "audio_store" not in st.session_state:
    st.session_state.audio_store = {}

if translate_btn:
    if not selected_langs:
        st.error("⚠️ Please select at least one target language from the sidebar.")
    elif not uploaded_file and not pasted_text.strip():
        st.error("⚠️ Please upload a document or paste text to translate.")
    else:
        model = DocMultilingualModel()
        st.session_state.audio_store = {}
        progress_bar = st.progress(0, text="Initializing pipeline and extracting content...")

        try:
            if uploaded_file is not None:
                file_bytes = uploaded_file.getvalue()
                filename = uploaded_file.name
                progress_bar.progress(20, text=f"Extracting text from {filename}...")

                result = model.translate_document(
                    source=file_bytes,
                    filename=filename,
                    target_langs=selected_langs,
                    source_lang=source_lang_option,
                    parallel=parallel_mode,
                )
            else:
                progress_bar.progress(20, text="Processing input text...")
                result = model.translate_text(
                    text=pasted_text,
                    target_langs=selected_langs,
                    source_lang=source_lang_option,
                    parallel=parallel_mode,
                )

            # Pre-synthesize voiceovers
            if enable_voiceovers:
                total_langs = len(selected_langs)
                for idx, lang in enumerate(selected_langs):
                    pct = int(60 + (idx / total_langs) * 35)
                    progress_bar.progress(pct, text=f"Synthesizing {SUPPORTED_LANGUAGES.get(lang, {}).get('name', lang)} voiceover...")
                    try:
                        audio = result.to_audio_bytes(lang)
                        st.session_state.audio_store[lang] = audio
                    except Exception as ex:
                        st.session_state.audio_store[lang] = None

            progress_bar.progress(100, text="Translation & Voiceovers complete!")
            st.session_state.result = result
            st.success("✅ Translation and voiceovers completed successfully!")
            time.sleep(0.4)
            progress_bar.empty()

        except Exception as e:
            progress_bar.empty()
            st.error(f"❌ Operation failed: {str(e)}")


# Display Results
if st.session_state.result:
    res = st.session_state.result
    summary = res.summary()

    st.divider()
    st.subheader("📊 Document & Voiceover Summary")

    m_col1, m_col2, m_col3, m_col4 = st.columns(4)
    with m_col1:
        st.markdown(
            f'<div class="metric-card"><div class="metric-value">{summary["format"].upper()}</div><div class="metric-label">Document Format</div></div>',
            unsafe_allow_html=True,
        )
    with m_col2:
        st.markdown(
            f'<div class="metric-card"><div class="metric-value">{summary["word_count"]}</div><div class="metric-label">Words Extracted</div></div>',
            unsafe_allow_html=True,
        )
    with m_col3:
        st.markdown(
            f'<div class="metric-card"><div class="metric-value">{len(summary["translated_languages"])}</div><div class="metric-label">Languages Translated</div></div>',
            unsafe_allow_html=True,
        )
    with m_col4:
        st.markdown(
            f'<div class="metric-card"><div class="metric-value">🎙️ Neural AI</div><div class="metric-label">Voice Engine</div></div>',
            unsafe_allow_html=True,
        )

    st.write("")

    # Result Tabs
    tab_titles = ["📖 Original Text"]
    for lang in summary["translated_languages"]:
        info = SUPPORTED_LANGUAGES.get(lang, {"name": lang, "native": ""})
        tab_titles.append(f"{info['name']} ({info['native']})")
    tab_titles.append("🔄 Side-by-Side Comparison")

    tabs = st.tabs(tab_titles)

    # 1. Original Text Tab
    with tabs[0]:
        st.markdown("#### Extracted Source Content")
        st.text_area("Source Text", value=res.source_text, height=280, disabled=True, label_visibility="collapsed")

        # Source Voiceover
        st.markdown("##### 🔊 Source Voiceover Audio:")
        src_lang = "en" if source_lang_option == "auto" else source_lang_option
        try:
            if "source" not in st.session_state.audio_store or not st.session_state.audio_store["source"]:
                st.session_state.audio_store["source"] = VoiceoverGenerator.generate_audio_bytes(res.source_text, src_lang)
            
            src_audio = st.session_state.audio_store["source"]
            st.markdown(VoiceoverGenerator.to_html_audio_player(src_audio, audio_id="player_source"), unsafe_allow_html=True)
            st.download_button(
                label="🎵 Download Source Voiceover (.MP3)",
                data=src_audio,
                file_name="source_voiceover.mp3",
                mime="audio/mpeg",
                key="dl_source_audio",
            )
        except Exception as ex:
            st.caption(f"Source voiceover note: {ex}")

    # 2. Translated Tabs
    for idx, lang in enumerate(summary["translated_languages"]):
        with tabs[idx + 1]:
            info = SUPPORTED_LANGUAGES.get(lang, {"name": lang, "native": ""})
            translated_text = res.get_text(lang)

            st.markdown(f"#### {info['name']} Translation ({info['native']})")

            # Voiceover Player Card with Base64 Direct Embedding
            st.markdown(f"##### 🎙️ {info['name']} AI Voiceover")
            audio_bytes = st.session_state.audio_store.get(lang)

            # If audio not pre-cached, generate on demand
            if not audio_bytes:
                try:
                    with st.spinner(f"Generating {info['name']} voiceover..."):
                        audio_bytes = res.to_audio_bytes(lang)
                        st.session_state.audio_store[lang] = audio_bytes
                except Exception as ex:
                    st.warning(f"Voiceover notice: {ex}")

            if audio_bytes:
                # Render self-contained HTML5 player with pre-loaded base64 data
                st.markdown(
                    VoiceoverGenerator.to_html_audio_player(audio_bytes, audio_id=f"player_{lang}"),
                    unsafe_allow_html=True,
                )
            else:
                st.info("Audio generation in progress or text is empty.")

            # Text Area
            st.text_area(
                f"Translation_{lang}",
                value=translated_text,
                height=240,
                label_visibility="collapsed",
            )

            # Download Options (DOCX, PDF, TXT, MP3 Voiceover)
            st.markdown(f"##### 📥 Export {info['name']} Formats:")
            d_col1, d_col2, d_col3, d_col4 = st.columns(4)

            with d_col1:
                docx_bytes = res.to_bytes(lang, file_format="docx")
                st.download_button(
                    label=f"📄 DOCX",
                    data=docx_bytes,
                    file_name=f"translated_{lang}.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    key=f"dl_docx_{lang}",
                )

            with d_col2:
                try:
                    pdf_bytes = res.to_bytes(lang, file_format="pdf")
                    st.download_button(
                        label=f"📕 PDF",
                        data=pdf_bytes,
                        file_name=f"translated_{lang}.pdf",
                        mime="application/pdf",
                        key=f"dl_pdf_{lang}",
                    )
                except Exception as ex:
                    st.caption(f"PDF note: {ex}")

            with d_col3:
                txt_bytes = res.to_bytes(lang, file_format="txt")
                st.download_button(
                    label=f"📝 TXT",
                    data=txt_bytes,
                    file_name=f"translated_{lang}.txt",
                    mime="text/plain",
                    key=f"dl_txt_{lang}",
                )

            with d_col4:
                if audio_bytes:
                    st.download_button(
                        label=f"🎵 Voiceover (MP3)",
                        data=audio_bytes,
                        file_name=f"voiceover_{lang}.mp3",
                        mime="audio/mpeg",
                        key=f"dl_mp3_{lang}",
                    )

    # 3. Side-by-Side Comparison Tab
    with tabs[-1]:
        st.markdown("#### 🔄 Side-by-Side Chunk Alignment")
        chunks = res.chunks
        for i, chunk in enumerate(chunks):
            with st.expander(f"Paragraph / Chunk #{i+1} (Preview: {chunk[:60]}...)", expanded=(i == 0)):
                col_orig, col_trans = st.columns(2)
                with col_orig:
                    st.markdown("**Original:**")
                    st.info(chunk)
                with col_trans:
                    st.markdown("**Translations:**")
                    for lang in summary["translated_languages"]:
                        info = SUPPORTED_LANGUAGES.get(lang, {"name": lang, "native": ""})
                        t_chunks = res.get_chunks(lang)
                        t_text = t_chunks[i] if i < len(t_chunks) else ""
                        st.markdown(f"**{info['name']} ({info['native']}):**")
                        st.write(t_text)

    # Bulk Download All in a ZIP
    st.divider()
    st.subheader("📦 Bulk Export (All Documents & Voiceovers in One ZIP)")
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for lang in summary["translated_languages"]:
            # Add DOCX
            try:
                docx_data = res.to_bytes(lang, "docx")
                zf.writestr(f"documents/translated_{lang}.docx", docx_data)
            except Exception:
                pass
            # Add PDF
            try:
                pdf_data = res.to_bytes(lang, "pdf")
                zf.writestr(f"documents/translated_{lang}.pdf", pdf_data)
            except Exception:
                pass
            # Add TXT
            try:
                txt_data = res.to_bytes(lang, "txt")
                zf.writestr(f"documents/translated_{lang}.txt", txt_data)
            except Exception:
                pass
            # Add Voiceover Audio (MP3)
            try:
                mp3_data = st.session_state.audio_store.get(lang) or res.to_audio_bytes(lang)
                zf.writestr(f"voiceovers/voiceover_{lang}.mp3", mp3_data)
            except Exception:
                pass

    zip_buffer.seek(0)
    st.download_button(
        label="📥 Download All Translated Documents & Audio Voiceovers (.ZIP)",
        data=zip_buffer.getvalue(),
        file_name="all_translations_and_voiceovers.zip",
        mime="application/zip",
        use_container_width=True,
    )
