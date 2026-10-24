"""Integration tests connecting Ingestion, RAG, Contract Review, and Citation Verification."""

import io
import tempfile
import pytest

from draftmate_ai.integration import DraftMatePipeline
from draftmate_ai.citation_verification.evaluation import evaluate_citation_verification
from draftmate_ai.citation_verification.source_adapters import IndiaCodeAdapter, SupremeCourtOfIndiaAdapter
from draftmate_ai.citation_verification.schemas import VerificationStatus


def test_draftmate_pipeline_end_to_end():
    """Test full integration: Document Ingestion -> Citation Verification -> Contract Review -> RAG Querying."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as temp_dir:
        pipeline = DraftMatePipeline(vector_storage_dir=temp_dir)

        contract_content = (
            "COMMERCIAL SERVICES AGREEMENT\n\n"
            "This Agreement is between Alpha Corp and Beta Inc.\n\n"
            "SECTION 1. INTERIM RELIEF.\n"
            "Either party may apply for interim relief pursuant to Section 9 of the Arbitration and Conciliation Act, 1996.\n\n"
            "SECTION 2. LIMITATION OF LIABILITY.\n"
            "In no event shall aggregate liability exceed the total fees paid under this Agreement.\n\n"
            "SECTION 3. GOVERNING LAW.\n"
            "This Agreement is governed by the laws of India. The parties acknowledge Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225, para 45."
        )

        # 1. Process and analyze document through unified pipeline
        doc, analysis = pipeline.process_and_analyze_document(
            source=contract_content.encode("utf-8"),
            filename="commercial_services_agreement.txt",
            index_for_rag=True,
            perform_contract_review=True,
        )

        assert analysis.total_elements > 0
        assert analysis.rag_indexed is True
        assert analysis.citation_report.total_citations >= 2
        assert analysis.contract_review_report is not None

        # 2. Verify Citations are extracted and verified
        cit_results = analysis.citation_report.results
        assert any(r.overall_status == VerificationStatus.VERIFIED for r in cit_results)

        # 3. Query RAG vector index
        rag_resp = pipeline.query_document_rag("What law governs interim relief?")
        assert rag_resp.abstained is False
        assert "Section 9" in rag_resp.answer or "Arbitration" in rag_resp.answer
        assert len(rag_resp.sources) > 0

        # 4. Perform Contract Redlining
        reconstructed_markup, docx_bytes = pipeline.redline_contract(doc, mode="markup")
        assert len(reconstructed_markup) > 0
        assert len(docx_bytes) > 0
        assert docx_bytes.startswith(b"PK\x03\x04")


def test_external_source_safe_failure_handling():
    """Verify that external network source adapters gracefully disclose limitations when disconnected."""
    ic_adapter = IndiaCodeAdapter()
    limits = ic_adapter.report_limitations()
    assert len(limits) > 0
    assert any("offline" in l.lower() or "internet" in l.lower() or "sandbox" in l.lower() for l in limits)

    # Search returns empty list without raising an unhandled exception or breaking
    res = ic_adapter.search("Arbitration Act")
    assert res == []

    sci_adapter = SupremeCourtOfIndiaAdapter()
    sci_limits = sci_adapter.report_limitations()
    assert len(sci_limits) > 0
    assert any("scraping" in l.lower() or "network" in l.lower() for l in sci_limits)


def test_citation_evaluation_benchmark_suite():
    """Verify that benchmark evaluation metrics run and compute accurate non-zero scores."""
    report = evaluate_citation_verification()

    assert report.total_samples >= 6
    assert report.extraction_precision > 0.8
    assert report.extraction_recall > 0.8
    assert report.extraction_f1 > 0.8
    assert report.status_accuracy >= 0.8
    assert report.anti_fabrication_rejection_rate == 1.0  # 100% rejection of fabricated case
    assert len(report.limitations_and_failure_modes) > 0

