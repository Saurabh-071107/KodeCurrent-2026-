"""Tests for structure-aware, deterministic document chunking."""

import pytest
from draftmate_ai.document_processing.chunking import StructureAwareChunker, split_text_with_overlap
from draftmate_ai.document_processing.text_extractor import TextExtractor
from draftmate_ai.document_processing.pdf_extractor import PDFExtractor
from draftmate_ai.shared.schemas import ChunkingConfig


def test_chunking_deterministic(sample_legal_text):
    """Test that chunking runs deterministically with identical chunks and IDs."""
    extractor = TextExtractor()
    doc = extractor.extract(sample_legal_text.encode("utf-8"), filename="lease.txt")

    config = ChunkingConfig(chunk_size=300, chunk_overlap=50)
    chunker = StructureAwareChunker(config=config)

    chunks_run_1 = chunker.chunk_document(doc)
    chunks_run_2 = chunker.chunk_document(doc)

    assert len(chunks_run_1) == len(chunks_run_2)
    for c1, c2 in zip(chunks_run_1, chunks_run_2):
        assert c1.chunk_id == c2.chunk_id
        assert c1.text == c2.text
        assert c1.paragraph_numbers == c2.paragraph_numbers
        assert c1.section_heading == c2.section_heading


def test_chunking_metadata_preservation(sample_pdf_bytes):
    """Test that page references, section headings, clauses, and document IDs are preserved in chunks."""
    extractor = PDFExtractor(enable_ocr=False)
    doc = extractor.extract(sample_pdf_bytes, filename="agreement.pdf")

    config = ChunkingConfig(chunk_size=400, chunk_overlap=80)
    chunker = StructureAwareChunker(config=config)
    chunks = chunker.chunk_document(doc)

    assert len(chunks) > 0
    for chunk in chunks:
        assert chunk.document_id == doc.metadata.document_id
        assert chunk.chunk_id.startswith(doc.metadata.document_id)
        assert chunk.character_count == len(chunk.text)
        assert len(chunk.element_ids) > 0
        if chunk.page_start is not None:
            assert chunk.page_start in (1, 2)
            assert chunk.page_end in (1, 2)
            assert chunk.page_start <= chunk.page_end


def test_chunking_heading_attachment(sample_legal_text):
    """Test that section headings are attached as context to child content."""
    extractor = TextExtractor()
    doc = extractor.extract(sample_legal_text.encode("utf-8"), filename="lease.txt")

    config = ChunkingConfig(chunk_size=500, attach_heading_to_content=True)
    chunker = StructureAwareChunker(config=config)
    chunks = chunker.chunk_document(doc)

    # Verify that at least one chunk has attached heading prefix [HEADING]
    has_attached = any("[" in c.text and "]" in c.text for c in chunks)
    assert has_attached


def test_chunking_split_oversized_elements():
    """Test splitting an exceptionally long section safely without loss."""
    long_paragraph = "This is a very important legal clause that spans multiple sentences. " * 30
    text = f"ARTICLE 1: GENERAL TERMS\n\n{long_paragraph}"

    extractor = TextExtractor()
    doc = extractor.extract(text.encode("utf-8"), filename="long.txt")

    config = ChunkingConfig(chunk_size=250, chunk_overlap=50)
    chunker = StructureAwareChunker(config=config)
    chunks = chunker.chunk_document(doc)

    assert len(chunks) > 1
    # Each sub-chunk should adhere approximately to the configured chunk size limit
    for c in chunks:
        assert len(c.text) <= config.chunk_size + 150  # sentence tolerance


def test_chunking_configurable_sizes(sample_legal_text):
    """Test that changing chunk_size produces different, smaller or larger chunks."""
    extractor = TextExtractor()
    doc = extractor.extract(sample_legal_text.encode("utf-8"), filename="lease.txt")

    small_chunker = StructureAwareChunker(config=ChunkingConfig(chunk_size=200, chunk_overlap=30))
    large_chunker = StructureAwareChunker(config=ChunkingConfig(chunk_size=1000, chunk_overlap=100))

    small_chunks = small_chunker.chunk_document(doc)
    large_chunks = large_chunker.chunk_document(doc)

    assert len(small_chunks) > len(large_chunks)

