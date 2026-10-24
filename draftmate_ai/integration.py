"""Shared integration orchestrator unifying Document Processing, RAG, Contract Review, and Citation Verification."""

from typing import Optional, Dict, Any, List, Tuple
from pydantic import BaseModel, Field

from draftmate_ai.shared.document_models import ProcessedDocument
from draftmate_ai.document_processing.ingestion import ingest_document
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.retrieval import HybridRetriever
from draftmate_ai.document_rag.generation import BaseLLMClient, get_llm_client
from draftmate_ai.document_rag.evidence_validation import EvidenceValidator
from draftmate_ai.document_rag.schemas import RAGResponse, RetrievalConfig
from draftmate_ai.contract_review.issue_detection import ContractIssueDetector
from draftmate_ai.contract_review.redlining import RedlineEngine
from draftmate_ai.contract_review.cross_clause_analysis import ConsistencyChecker
from draftmate_ai.contract_review.schemas import ContractReviewReport, ReviewPosture
from draftmate_ai.citation_verification.verification import CitationVerificationEngine
from draftmate_ai.citation_verification.schemas import DocumentCitationReport, VerificationResult
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class IntegratedDocumentAnalysis(BaseModel):
    """Unified legal report combining Document RAG, Contract Review, and Citation Verification."""
    document_id: str
    document_title: Optional[str] = None
    contract_type: Optional[str] = None
    total_elements: int = 0
    total_chunks: int = 0
    citation_report: DocumentCitationReport
    contract_review_report: Optional[ContractReviewReport] = None
    rag_indexed: bool = False
    processing_metadata: Dict[str, Any] = Field(default_factory=dict)


class DraftMatePipeline:
    """Enterprise coordinator unifying all three DraftMate AI capabilities into a single pipeline."""

    def __init__(
        self,
        vector_storage_dir: Optional[str] = None,
        review_posture: ReviewPosture = ReviewPosture.NEUTRAL,
    ):
        self.citation_engine = CitationVerificationEngine()
        self.issue_detector = ContractIssueDetector(posture=review_posture)
        self.consistency_checker = ConsistencyChecker()
        self.index_manager = VectorIndexManager(storage_dir=vector_storage_dir)
        self.retriever = HybridRetriever(index_manager=self.index_manager)
        self.llm_client = get_llm_client(provider="local")
        self.evidence_validator = EvidenceValidator(index_manager=self.index_manager)

    def process_and_analyze_document(
        self,
        source: Any,
        filename: Optional[str] = None,
        index_for_rag: bool = True,
        perform_contract_review: bool = True,
    ) -> Tuple[ProcessedDocument, IntegratedDocumentAnalysis]:
        """Ingest document, extract & verify citations, detect contract issues, and index into RAG vector store."""
        logger.info(f"Ingesting document for integrated legal analysis: {filename or 'in-memory'}")
        doc: ProcessedDocument = ingest_document(source, filename=filename)

        # 1. Run Citation Verification
        logger.info(f"Running citation verification on document {doc.document_id}")
        citation_rep = self.citation_engine.verify_document_citations(doc)

        # 2. Run Contract Review (if applicable)
        contract_rep = None
        if perform_contract_review:
            logger.info(f"Executing contract review on document {doc.document_id}")
            contract_rep = self.issue_detector.review_contract(doc)

        # 3. Index into RAG vector store
        rag_indexed = False
        if index_for_rag:
            logger.info(f"Indexing document chunks into vector database")
            self.index_manager.index_document(doc)
            self.retriever.refresh_index()
            rag_indexed = True

        analysis = IntegratedDocumentAnalysis(
            document_id=doc.document_id,
            document_title=doc.metadata.title,
            contract_type=contract_rep.contract_type if contract_rep else None,
            total_elements=len(doc.elements),
            total_chunks=len(doc.chunks),
            citation_report=citation_rep,
            contract_review_report=contract_rep,
            rag_indexed=rag_indexed,
            processing_metadata={
                "extraction_method": doc.metadata.extraction_method,
                "character_count": len(doc.raw_text),
                "file_size_bytes": doc.metadata.file_size_bytes,
            },
        )

        return doc, analysis

    def query_document_rag(self, question: str, top_k: int = 3) -> RAGResponse:
        """Execute grounded hybrid retrieval and answer generation with provenance validation."""
        retrieved_chunks = self.retriever.retrieve(query=question, top_k=top_k)

        raw_resp = self.llm_client.generate_grounded_answer(
            question=question,
            evidence_chunks=retrieved_chunks,
        )

        validated_resp = self.evidence_validator.validate_response(raw_resp, strict_mode=True)
        return validated_resp

    def redline_contract(
        self,
        doc: ProcessedDocument,
        accepted_finding_ids: Optional[List[str]] = None,
        mode: str = "markup",
    ) -> Tuple[str, bytes]:
        """Apply findings from contract review and generate redlined text and tracked changes DOCX."""
        engine = RedlineEngine(original_text=doc.raw_text, document_id=doc.document_id)

        # Review contract to get findings
        report = self.issue_detector.review_contract(doc)
        for finding in report.findings:
            chg = engine.create_change_from_finding(finding)
            if chg and accepted_finding_ids is not None:
                if finding.finding_id in accepted_finding_ids:
                    engine.accept_change(chg.change_id)
                else:
                    engine.reject_change(chg.change_id)
            elif chg and accepted_finding_ids is None:
                # Default: accept all proposed changes for demonstration
                engine.accept_change(chg.change_id)

        reconstructed = engine.reconstruct_document(mode=mode)
        docx_bytes = engine.export_to_docx(mode=mode)
        return reconstructed, docx_bytes
