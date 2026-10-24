"""
CLI Interface for Multilingual Document Translation & Voiceover.
Converts documents (DOCX, PDF, PPTX, TXT, MD, HTML) or raw text into:
Hindi (hi), Marathi (mr), Gujarati (gu), English (en), and Telugu (te).
Generates natural voiceovers (MP3) for all translated languages.
"""

import argparse
import os
import sys
from doc_translator import DocMultilingualModel, SUPPORTED_LANGUAGES, VoiceoverGenerator


def main():
    parser = argparse.ArgumentParser(
        description="Translate documents (DOCX, PDF, PPTX, TXT) into Hindi, Marathi, Gujarati, English, Telugu with Voiceovers."
    )
    parser.add_argument(
        "input",
        type=str,
        help="Path to input document (DOCX, PDF, PPTX, TXT, etc.) or raw text string.",
    )
    parser.add_argument(
        "--targets",
        "-t",
        nargs="+",
        default=["hi", "mr", "gu", "en", "te"],
        help="Target language codes (default: hi mr gu en te). Options: hi, mr, gu, en, te.",
    )
    parser.add_argument(
        "--source-lang",
        "-s",
        default="auto",
        help="Source language code (default: auto).",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        default="./translated_output",
        help="Output directory to save translated documents and voiceovers (default: ./translated_output).",
    )
    parser.add_argument(
        "--formats",
        "-f",
        nargs="+",
        default=["docx", "txt"],
        help="Output file formats: docx, pdf, txt, mp3 (default: docx txt).",
    )
    parser.add_argument(
        "--voiceover",
        "-v",
        action="store_true",
        help="Generate audio voiceover (.mp3) for all translated languages.",
    )
    parser.add_argument(
        "--no-parallel",
        action="store_true",
        help="Disable concurrent target translation (run sequentially).",
    )

    args = parser.parse_args()

    # Reconfigure stdout for UTF-8 on Windows
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    formats = list(args.formats)
    if args.voiceover and "mp3" not in formats:
        formats.append("mp3")

    print("=" * 65)
    print("   MULTILINGUAL TRANSLATOR & VOICEOVER PIPELINE (5 LANGUAGES)   ")
    print("=" * 65)
    print(f"Target Languages : {', '.join(args.targets)}")
    print(f"Output Formats   : {', '.join(formats)}")
    print(f"Voiceover Audio  : {'Enabled (MP3)' if args.voiceover or 'mp3' in formats else 'Disabled'}")
    print(f"Output Directory : {args.output_dir}")
    print("-" * 65)

    model = DocMultilingualModel()

    input_is_file = os.path.exists(args.input)
    if input_is_file:
        print(f"Processing document: {args.input}")
        result = model.translate_document(
            args.input,
            target_langs=args.targets,
            source_lang=args.source_lang,
            parallel=not args.no_parallel,
        )
    else:
        print(f"Processing raw text input ({len(args.input)} chars)...")
        result = model.translate_text(
            args.input,
            target_langs=args.targets,
            source_lang=args.source_lang,
            parallel=not args.no_parallel,
        )

    print("-" * 65)
    summary = result.summary()
    print(f"Extraction Format: {summary['format']}")
    print(f"Word Count       : {summary['word_count']}")
    print(f"Chunks Processed : {summary['chunk_count']}")
    print(f"Time Taken       : {summary['duration_seconds']}s")
    print("-" * 65)

    # Save to disk
    print(f"Saving translated files and voiceovers to '{args.output_dir}'...")
    saved_files = result.save_all(args.output_dir, formats=formats)

    for lang, files in saved_files.items():
        lang_name = SUPPORTED_LANGUAGES.get(lang, {}).get("name", lang)
        print(f"\n[{lang.upper()} - {lang_name}]:")
        for f in files:
            icon = "🎵" if f.endswith(".mp3") else "-> "
            print(f"  {icon} {f}")
        preview = result.get_text(lang)[:120].replace("\n", " ")
        print(f"  Preview: \"{preview}...\"")

    print("\n" + "=" * 65)
    print(" Translation & Voiceovers Completed Successfully!")
    print("=" * 65)


if __name__ == "__main__":
    main()
