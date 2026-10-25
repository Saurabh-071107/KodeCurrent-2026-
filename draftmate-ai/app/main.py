"""Main FastAPI application for DraftMate AI."""
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, List, Optional

import structlog
from fastapi import FastAPI, HTTPException, Request, status, UploadFile, File, Form
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import get_settings, validate_startup_config
from app.core.model_router import initialize_router, get_router
from app.features.document_management import (
    upload_document,
    list_documents,
    get_document,
    delete_document,
    initialize_documents,
    DocumentUploadError,
    get_document_store,
)
from app.features.document_parsing import DocumentParsingError, UnsupportedFileTypeError, FileTooLargeError
from app.features.drafting import generate_draft, DraftingError
from app.features.evidence_drafting import (
    generate_evidence_grounded_draft,
    EvidenceGroundedDraftRequest,
    EvidenceGroundedDraftResponse,
)
from app.features.fact_extraction import extract_facts, FactExtractionError
from app.features.review import review_draft, ReviewError
from app.features.citation_verification import verify_citations, CitationVerificationError
from app.features.redlining import (
    generate_redlines,
    apply_redline_decisions,
    get_redline_preview,
    store_redline_state,
    RedliningError,
)
from app.features.style_adaptation import (
    extract_style_profile,
    apply_style_profile,
    StyleExtractionError,
    StyleApplicationError,
)
from app.features.export import (
    export_document,
    cleanup_old_exports,
    ExportError,
)
from app.features.voice_agent import (
    process_voice_command,
    configure_voice_providers,
    VoiceCommandError,
)
from app.features.external_review import review_external_document, ExternalReviewError
from app.features.summarization import summarize_document, SummarizationError
from app.features.document_qa import answer_document_question, DocumentQAError
from app.features.legal_assistant import answer_legal_question, LegalAssistantError
from app.features.case_workspace import (
    create_case_workspace,
    list_case_workspaces,
    get_case_workspace,
    delete_case_workspace,
    upload_case_document,
    get_case_documents,
    delete_case_document,
    initialize_case_workspace,
    CaseWorkspaceError,
)
from app.features.case_understanding import generate_case_brief, CaseUnderstandingError
from app.features.opposition_analysis import compare_client_opposition, OppositionAnalysisError
from app.features.legal_research import conduct_legal_research, LegalResearchError
from app.features.argument_builder import generate_arguments, ArgumentBuilderError
from app.features.scrutiny_checklist import run_scrutiny_checklist, ScrutinyChecklistError
from app.features.citation_verification_case import verify_citations_in_case, CitationVerificationCaseError
from app.features.case_assistant import process_case_command, CaseAssistantError
from app.schemas import (
    FactExtractionRequest,
    FactExtractionResponse,
    DraftRequest,
    DraftResponse,
    HealthResponse,
    LLMHealthResponse,
    ErrorResponse,
    DocumentType,
    Jurisdiction,
    FactExtractionResponse as FactExtractionResponseSchema,
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentDeleteResponse,
    RetrievalRequest,
    RetrievalResponse,
    EvidenceGroundedDraftRequest,
    EvidenceGroundedDraftResponse,
    RetrievalResult,
    EvidenceExcerpt,
    # Chunk 3 schemas
    ReviewRequest,
    ReviewResponse,
    ReviewFinding,
    FindingCategory,
    FindingSeverity,
    CitationVerificationRequest,
    CitationVerificationResponse,
    CitationVerificationResult,
    CitationStatus,
    RedlineRequest,
    RedlineResponse,
    RedlineOperation,
    RedlineOperationType,
    RedlineDecision,
    RedlineDecisionsRequest,
    RedlineDecisionsResponse,
    RedlinePreviewRequest,
    RedlinePreviewResponse,
    # Chunk 4 schemas
    StyleExtractionRequest,
    StyleExtractionResponse,
    StyleApplicationRequest,
    StyleApplicationResponse,
    ExportRequest,
    ExportResponse,
    ExportFormat,
    VoiceCommandRequest,
    VoiceCommandResponse,
    VoiceProviderConfigRequest,
    VoiceProviderConfigResponse,
    # Chunk 5 schemas
    ExternalReviewRequest,
    ExternalReviewResponse,
    CitationVerificationExternalRequest,
    CitationVerificationExternalResponse,
    SummarizationRequest,
    SummarizationResponse,
    DocumentQARequest,
    DocumentQAResponse,
    LegalAssistantRequest,
    LegalAssistantResponse,
    # Chunk 6 schemas
    CaseWorkspaceCreateRequest,
    CaseWorkspaceResponse,
    CaseWorkspaceListResponse,
    CaseDocumentUploadRequest,
    CaseDocumentUploadResponse,
    CaseBriefRequest,
    CaseBriefResponse,
    OppositionComparisonRequest,
    OppositionComparisonResponse,
    LegalResearchRequest,
    LegalResearchResponse,
    ArgumentBuilderRequest,
    ArgumentBuilderResponse,
    ScrutinyChecklistRequest,
    ScrutinyChecklistResponse,
    CitationVerificationCaseRequest,
    CitationVerificationCaseResponse,
    CaseAssistantRequest,
    CaseAssistantResponse,
)
from app.core.storage import DocumentRecord

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("starting_draftmate_ai")

    # Validate configuration
    errors = validate_startup_config()
    if errors:
        for error in errors:
            logger.warning("config_warning", error=error)
        logger.warning("startup_with_warnings", errors=errors)
    else:
        logger.info("configuration_validated")

    # Initialize LLM router
    try:
        await initialize_router()
        logger.info("llm_router_initialized")
    except Exception as e:
        logger.error("llm_router_init_failed", error=str(e))

    # Initialize document management
    try:
        await initialize_documents()
        logger.info("document_management_initialized")
    except Exception as e:
        logger.error("document_management_init_failed", error=str(e))

    # Start periodic export cleanup
    import asyncio
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(3600)  # Run every hour
            try:
                deleted = await cleanup_old_exports()
                if deleted > 0:
                    logger.info("periodic_export_cleanup", deleted=deleted)
            except Exception as e:
                logger.error("periodic_cleanup_failed", error=str(e))
    
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield

    # Shutdown
    logger.info("shutting_down_draftmate_ai")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    router = get_router()
    await router.close()
    logger.info("shutdown_complete")


# Create FastAPI app
app = FastAPI(
    title="DraftMate AI",
    description="AI-powered legal document drafting service. Extracts facts from legal problems and generates initial document drafts.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI request validation errors."""
    logger.warning("validation_error", path=request.url.path, errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="validation_error",
            message="Request validation failed",
            details={"errors": exc.errors()},
        ).model_dump(),
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors."""
    logger.warning("pydantic_validation_error", path=request.url.path, errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="validation_error",
            message="Request validation failed",
            details={"errors": exc.errors()},
        ).model_dump(),
    )


@app.exception_handler(FactExtractionError)
async def fact_extraction_exception_handler(request: Request, exc: FactExtractionError):
    """Handle fact extraction errors."""
    logger.error("fact_extraction_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="fact_extraction_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(DraftingError)
async def drafting_exception_handler(request: Request, exc: DraftingError):
    """Handle drafting errors."""
    logger.error("drafting_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="drafting_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(DocumentUploadError)
async def document_upload_exception_handler(request: Request, exc: DocumentUploadError):
    """Handle document upload errors."""
    logger.error("document_upload_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            error="document_upload_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    """Handle ValueError from feature modules (e.g., no LLM configured)."""
    logger.error("value_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            error="bad_request",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTPException with consistent error format."""
    logger.warning("http_exception", path=request.url.path, status_code=exc.status_code, detail=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="http_error",
            message=exc.detail,
        ).model_dump(),
    )


@app.exception_handler(ExportError)
async def export_exception_handler(request: Request, exc: ExportError):
    """Handle export errors."""
    logger.error("export_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="export_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(VoiceCommandError)
async def voice_command_exception_handler(request: Request, exc: VoiceCommandError):
    """Handle voice command errors."""
    logger.error("voice_command_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="voice_command_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(StyleExtractionError)
async def style_extraction_exception_handler(request: Request, exc: StyleExtractionError):
    """Handle style extraction errors."""
    logger.error("style_extraction_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="style_extraction_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(StyleApplicationError)
async def style_application_exception_handler(request: Request, exc: StyleApplicationError):
    """Handle style application errors."""
    logger.error("style_application_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="style_application_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(ExternalReviewError)
async def external_review_exception_handler(request: Request, exc: ExternalReviewError):
    """Handle external review errors."""
    logger.error("external_review_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="external_review_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(SummarizationError)
async def summarization_exception_handler(request: Request, exc: SummarizationError):
    """Handle summarization errors."""
    logger.error("summarization_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="summarization_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(DocumentQAError)
async def document_qa_exception_handler(request: Request, exc: DocumentQAError):
    """Handle document Q&A errors."""
    logger.error("document_qa_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="document_qa_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(LegalAssistantError)
async def legal_assistant_exception_handler(request: Request, exc: LegalAssistantError):
    """Handle legal assistant errors."""
    logger.error("legal_assistant_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="legal_assistant_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(CaseWorkspaceError)
async def case_workspace_exception_handler(request: Request, exc: CaseWorkspaceError):
    """Handle case workspace errors."""
    logger.error("case_workspace_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="case_workspace_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(CaseUnderstandingError)
async def case_understanding_exception_handler(request: Request, exc: CaseUnderstandingError):
    """Handle case understanding errors."""
    logger.error("case_understanding_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="case_understanding_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(OppositionAnalysisError)
async def opposition_analysis_exception_handler(request: Request, exc: OppositionAnalysisError):
    """Handle opposition analysis errors."""
    logger.error("opposition_analysis_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="opposition_analysis_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(LegalResearchError)
async def legal_research_exception_handler(request: Request, exc: LegalResearchError):
    """Handle legal research errors."""
    logger.error("legal_research_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="legal_research_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(ArgumentBuilderError)
async def argument_builder_exception_handler(request: Request, exc: ArgumentBuilderError):
    """Handle argument builder errors."""
    logger.error("argument_builder_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="argument_builder_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(ScrutinyChecklistError)
async def scrutiny_checklist_exception_handler(request: Request, exc: ScrutinyChecklistError):
    """Handle scrutiny checklist errors."""
    logger.error("scrutiny_checklist_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="scrutiny_checklist_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(CitationVerificationCaseError)
async def citation_verification_case_exception_handler(request: Request, exc: CitationVerificationCaseError):
    """Handle citation verification case errors."""
    logger.error("citation_verification_case_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="citation_verification_case_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(CaseAssistantError)
async def case_assistant_exception_handler(request: Request, exc: CaseAssistantError):
    """Handle case assistant errors."""
    logger.error("case_assistant_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="case_assistant_failed",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error("unhandled_error", path=request.url.path, error_type=type(exc).__name__, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="internal_error",
            message="An unexpected error occurred",
        ).model_dump(),
    )


# Health endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Basic service health check."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@app.get("/health/llm", response_model=list[LLMHealthResponse], tags=["Health"])
async def llm_health_check():
    """Check LLM provider connectivity."""
    router = get_router()
    results = await router.health_check_all()

    if not results:
        return [LLMHealthResponse(
            provider="none",
            model="none",
            status="not_configured",
            error="No LLM provider configured",
        )]

    return [LLMHealthResponse(**r) for r in results]


# Fact extraction endpoint
@app.post(
    "/facts",
    response_model=FactExtractionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Fact Extraction"],
    summary="Extract structured facts from a legal problem description",
    description="""
    Analyze a legal problem description and extract structured facts including:
    - User-provided and inferred facts with confidence levels
    - Parties and their roles
    - Important dates
    - Missing information and contradictions
    - Follow-up questions and explicit assumptions
    
    This endpoint does NOT generate a document - it only extracts and structures facts.
    Use the extracted facts with the /draft endpoint to generate a document.
    """,
)
async def extract_facts_endpoint(request: FactExtractionRequest) -> FactExtractionResponse:
    """
    Extract facts from a legal problem description.
    
    - **problem_description**: Detailed description of the legal issue (10-10000 chars)
    - **document_type**: Type of document you intend to generate
    - **jurisdiction**: Legal jurisdiction if known (optional)
    - **parties**: Known parties with names and roles (optional)
    - **important_dates**: Key dates related to the matter (optional)
    - **objective**: What you want to achieve with the document
    - **context**: Additional background information (optional)
    """
    return await extract_facts(request)


# Draft generation endpoint
@app.post(
    "/draft",
    response_model=DraftResponse,
    status_code=status.HTTP_200_OK,
    tags=["Document Drafting"],
    summary="Generate a legal document draft from extracted facts",
    description="""
    Generate a structured legal document draft based on previously extracted facts.
    
    The draft will:
    - Use only the provided facts (no fabrication)
    - Include placeholders for missing information
    - Return structured sections with metadata
    - Include assumptions, warnings, and review status
    - Contain a prominent legal disclaimer
    
    Supported document types: legal_notice, formal_letter, agreement, demand_letter, cease_desist
    """,
)
async def generate_draft_endpoint(request: DraftRequest) -> DraftResponse:
    """
    Generate a legal document draft.
    
    - **document_type**: Type of document to generate
    - **facts**: Extracted facts from the /facts endpoint (required)
    - **jurisdiction**: Legal jurisdiction (optional)
    - **custom_instructions**: Additional drafting instructions (optional)
    - **template_id**: Optional template identifier (not yet implemented)
    """
    return await generate_draft(request)


# Document Management Endpoints
@app.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Document Management"],
    summary="Upload and process a document",
    description="""
    Upload a document (PDF, DOCX, or TXT) for parsing, chunking, and indexing.
    
    The document will be:
    - Stored securely on disk
    - Parsed for text extraction
    - Split into chunks for retrieval
    - Indexed for keyword and embedding-based search
    
    Maximum file size: 50 MB (configurable)
    Supported formats: PDF, DOCX, TXT
    """,
)
async def upload_document_endpoint(
    file: UploadFile = File(...),
) -> DocumentUploadResponse:
    """
    Upload a document for processing.
    
    - **file**: Document file (PDF, DOCX, or TXT)
    """
    try:
        file_content = await file.read()
        record = await upload_document(file_content, file.filename, file.content_type)
        
        return DocumentUploadResponse(
            id=record.id,
            filename=record.filename,
            file_type=record.file_type,
            file_size=record.file_size,
            upload_timestamp=record.upload_timestamp,
            extraction_status=record.extraction_status,
            extraction_error=record.extraction_error,
            metadata=record.metadata,
            chunk_count=record.chunk_count,
        )
    except DocumentUploadError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("upload_failed", filename=file.filename, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload failed")


@app.get(
    "/documents",
    response_model=DocumentListResponse,
    tags=["Document Management"],
    summary="List uploaded documents",
    description="List all uploaded documents with optional filtering by status.",
)
async def list_documents_endpoint(
    limit: int = 100,
    offset: int = 0,
    status_filter: Optional[str] = None,
) -> DocumentListResponse:
    """List uploaded documents."""
    documents = await list_documents(limit=limit, offset=offset, status=status_filter)
    total = await get_document_store().count(status=status_filter)
    
    return DocumentListResponse(
        documents=[
            DocumentUploadResponse(
                id=doc.id,
                filename=doc.filename,
                file_type=doc.file_type,
                file_size=doc.file_size,
                upload_timestamp=doc.upload_timestamp,
                extraction_status=doc.extraction_status,
                extraction_error=doc.extraction_error,
                metadata=doc.metadata,
                chunk_count=doc.chunk_count,
            )
            for doc in documents
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@app.get(
    "/documents/{document_id}",
    response_model=DocumentUploadResponse,
    tags=["Document Management"],
    summary="Get document details",
    description="Get detailed information about a specific document.",
)
async def get_document_endpoint(document_id: str) -> DocumentUploadResponse:
    """Get document by ID."""
    record = await get_document(document_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    return DocumentUploadResponse(
        id=record.id,
        filename=record.filename,
        file_type=record.file_type,
        file_size=record.file_size,
        upload_timestamp=record.upload_timestamp,
        extraction_status=record.extraction_status,
        extraction_error=record.extraction_error,
        metadata=record.metadata,
        chunk_count=record.chunk_count,
    )


@app.delete(
    "/documents/{document_id}",
    response_model=DocumentDeleteResponse,
    tags=["Document Management"],
    summary="Delete a document",
    description="Delete a document and all its associated chunks from the index.",
)
async def delete_document_endpoint(document_id: str) -> DocumentDeleteResponse:
    """Delete a document."""
    deleted = await delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    return DocumentDeleteResponse(deleted=True, document_id=document_id)


# Retrieval Endpoint
@app.post(
    "/retrieve",
    response_model=RetrievalResponse,
    tags=["Retrieval"],
    summary="Retrieve relevant document chunks",
    description="""
    Search uploaded documents for relevant passages using hybrid keyword + embedding search.
    
    The search combines:
    - BM25 keyword matching (always available)
    - Sentence-transformer embeddings (optional, requires sentence-transformers package)
    
    Results are ranked by combined relevance score.
    """,
)
async def retrieve_endpoint(request: RetrievalRequest) -> RetrievalResponse:
    """Retrieve relevant document chunks for a query."""
    from app.features.retriever_instance import get_retriever
    
    retriever = get_retriever()
    results = retriever.retrieve(
        query=request.query,
        top_k=request.limit,
        document_ids=request.document_ids,
    )
    
    return RetrievalResponse(
        results=[
            RetrievalResult(
                chunk_id=r.chunk_id,
                document_id=r.document_id,
                text=r.text,
                score=r.score,
                source_filename=r.source_filename,
                page_number=r.page_number,
                file_type=r.file_type,
                metadata=r.metadata,
            )
            for r in results
        ],
        query=request.query,
        total_results=len(results),
    )


# Evidence-Grounded Drafting Endpoint
@app.post(
    "/draft/evidence-grounded",
    response_model=EvidenceGroundedDraftResponse,
    status_code=status.HTTP_200_OK,
    tags=["Document Drafting"],
    summary="Generate a document draft grounded in uploaded evidence",
    description="""
    Generate a legal document draft that cites and uses uploaded document evidence.
    
    This endpoint:
    1. Retrieves relevant passages from uploaded documents based on the query
    2. Combines user-provided facts with retrieved evidence
    3. Generates a draft with [Source X] citations
    4. Returns evidence excerpts and warnings about evidence sufficiency
    
    The draft distinguishes between:
    - User-provided facts
    - Uploaded document evidence (cited)
    - Assumptions and uncertainties
    
    If evidence is insufficient, warnings are included.
    """,
)
async def evidence_grounded_draft_endpoint(request: EvidenceGroundedDraftRequest) -> EvidenceGroundedDraftResponse:
    """
    Generate an evidence-grounded legal document draft.
    
    - **document_type**: Type of document to generate
    - **facts**: Extracted facts from the /facts endpoint (required)
    - **query**: Search query to find relevant evidence in uploaded documents
    - **jurisdiction**: Legal jurisdiction (optional)
    - **document_ids**: Optional filter to specific documents
    - **custom_instructions**: Additional drafting instructions (optional)
    - **max_evidence_chunks**: Maximum evidence chunks to retrieve (default: 8)
    """
    try:
        internal_request = EvidenceGroundedDraftRequest(
            document_type=request.document_type,
            facts=request.facts,
            query=request.query,
            jurisdiction=request.jurisdiction,
            document_ids=request.document_ids,
            custom_instructions=request.custom_instructions,
            max_evidence_chunks=request.max_evidence_chunks,
        )
        
        result = await generate_evidence_grounded_draft(internal_request)
        
        return EvidenceGroundedDraftResponse(
            draft=result.draft,
            evidence_used=[
                RetrievalResult(
                    chunk_id=r.chunk_id,
                    document_id=r.document_id,
                    text=r.text,
                    score=r.score,
                    source_filename=r.source_filename,
                    page_number=r.page_number,
                    file_type=r.file_type,
                    metadata=r.metadata,
                )
                for r in result.evidence_used
            ],
            evidence_excerpts=[
                EvidenceExcerpt(
                    source_id=e["source_id"],
                    chunk_id=e["chunk_id"],
                    document_id=e["document_id"],
                    source_filename=e["source_filename"],
                    page_number=e["page_number"],
                    excerpt=e["excerpt"],
                    score=e["score"],
                )
                for e in result.evidence_excerpts
            ],
            warnings=result.warnings,
            insufficient_evidence=result.insufficient_evidence,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("evidence_grounded_draft_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Evidence-grounded draft generation failed")


# Review Endpoint
@app.post(
    "/review",
    response_model=ReviewResponse,
    status_code=status.HTTP_200_OK,
    tags=["Review"],
    summary="Review a legal document draft for issues",
    description="""
    Analyze a legal document draft for:
    - Ambiguous language and undefined terms
    - Contradictory facts or clauses
    - Missing information and unresolved placeholders
    - Inconsistent parties, dates, amounts, terminology, obligations
    - Unsupported factual claims
    - Potentially missing clauses (labeled as suggestions)
    - Structural inconsistencies and broken cross-references
    
    Each finding includes a stable ID, location, category, severity, explanation, suggested correction, evidence IDs, and uncertainty notes.
    """,
)
async def review_endpoint(request: ReviewRequest) -> ReviewResponse:
    """
    Review a legal document draft.
    
    - **draft**: Draft to review (from /draft or /draft/evidence-grounded)
    - **facts**: Original extracted facts (from /facts)
    - **jurisdiction**: Legal jurisdiction (optional)
    - **document_ids**: Optional uploaded document IDs for evidence context
    - **custom_checks**: Additional custom review criteria (optional)
    """
    try:
        return await review_draft(request)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("review_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Review failed")


# Citation Verification Endpoint
@app.post(
    "/citations/verify",
    response_model=CitationVerificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Citation Verification"],
    summary="Verify legal citations in a draft",
    description="""
    Extract and verify legal citations from a draft document.
    
    For each citation:
    - Normalizes the citation form
    - Checks authoritative sources (when configured)
    - Reports whether the source supports the stated proposition
    - Indicates whether current legal status was checked
    - Returns status: VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, NOT_CHECKED
    
    If no authoritative source integration is configured, returns NOT_CHECKED with a clear reason.
    Does not invent citations, URLs, or verification results.
    """,
)
async def citation_verification_endpoint(request: CitationVerificationRequest) -> CitationVerificationResponse:
    """
    Verify citations in a legal document draft.
    
    - **draft**: Draft containing citations to verify
    - **jurisdiction**: Legal jurisdiction for source selection (optional)
    - **citation_ids**: Optional specific citations to verify
    """
    try:
        return await verify_citations(request)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("citation_verification_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Citation verification failed")


# Redlining Endpoints
@app.post(
    "/redline",
    response_model=RedlineResponse,
    status_code=status.HTTP_200_OK,
    tags=["Redlining"],
    summary="Generate redline edit proposals for a draft",
    description="""
    Generate precise redline edit operations (INSERT, DELETE, REPLACE) for a legal draft.
    
    Operations are based on:
    - Review findings (if provided)
    - Original facts and placeholders
    - Document type and jurisdiction requirements
    
    Each operation includes:
    - Stable operation ID
    - Target location and exact original text
    - Proposed text and explanation
    - Risk level and related finding/evidence IDs
    - Dependency information
    
    Original text is validated against the current draft to prevent stale edits.
    """,
)
async def redline_endpoint(request: RedlineRequest) -> RedlineResponse:
    """
    Generate redline edit proposals for a draft.
    
    - **draft**: Draft to redline
    - **review_response**: Optional review findings to base redlines on
    - **facts**: Original extracted facts
    - **jurisdiction**: Legal jurisdiction (optional)
    - **max_operations**: Maximum operations to generate (default: 20)
    """
    try:
        result = await generate_redlines(request)
        # Store state for decision processing
        store_redline_state(result.document_hash, result.operations, request.draft, request.draft)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("redline_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Redline generation failed")


@app.post(
    "/redline/{document_id}/decisions",
    response_model=RedlineDecisionsResponse,
    status_code=status.HTTP_200_OK,
    tags=["Redlining"],
    summary="Accept or reject redline operations",
    description="""
    Apply user accept/reject decisions to redline operations.
    
    Validates:
    - Document hash matches (prevents stale edits)
    - No conflicting accepted operations
    - Operation IDs exist
    
    Returns updated draft with accepted changes applied.
    Re-runs review automatically if significant changes were made (not yet implemented in this phase).
    """,
)
async def redline_decisions_endpoint(document_id: str, request: RedlineDecisionsRequest) -> RedlineDecisionsResponse:
    """
    Accept or reject redline operations.
    
    - **document_id**: Document hash from redline response
    - **decisions**: List of accept/reject decisions per operation
    """
    try:
        if document_id != request.document_hash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document hash mismatch")
        return await apply_redline_decisions(request)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("redline_decisions_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Redline decisions failed")


@app.post(
    "/redline/{document_id}/preview",
    response_model=RedlinePreviewResponse,
    status_code=status.HTTP_200_OK,
    tags=["Redlining"],
    summary="Preview document with accepted redline changes",
    description="""
    Preview the document with accepted redline changes applied.
    
    Shows original draft, preview draft, and summary of changes.
    """,
)
async def redline_preview_endpoint(document_id: str, request: RedlinePreviewRequest) -> RedlinePreviewResponse:
    """
    Preview document with accepted redline changes.
    
    - **document_id**: Document hash from redline response
    """
    try:
        if document_id != request.document_hash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document hash mismatch")
        return await get_redline_preview(request)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("redline_preview_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Redline preview failed")


# Style Adaptation Endpoints
@app.post(
    "/style/extract",
    response_model=StyleExtractionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Style Adaptation"],
    summary="Extract style profile from a reference document",
    description="""
    Analyze an uploaded document and extract its style profile including:
    - Heading hierarchy and numbering
    - Paragraph and list formatting
    - Tone and sentence style
    - Terminology and defined-term conventions
    - Table formatting and signature blocks
    
    The profile can then be applied to other drafts using /style/apply.
    """,
)
async def style_extract_endpoint(request: StyleExtractionRequest) -> StyleExtractionResponse:
    """
    Extract style profile from a reference document.
    
    - **document_id**: ID of uploaded document to analyze
    - **profile_name**: Optional name for the profile
    """
    try:
        return await extract_style_profile(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("style_extraction_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Style extraction failed")


@app.post(
    "/style/apply",
    response_model=StyleApplicationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Style Adaptation"],
    summary="Apply a style profile to a draft document",
    description="""
    Apply an extracted style profile to a draft document.
    
    The style profile is applied to formatting only:
    - Heading hierarchy and numbering
    - Paragraph and list formatting
    - Terminology preferences (where legally safe)
    - Table formatting
    - Signature block format
    
    User content (facts, names, dates, amounts, legal conclusions) is preserved.
    Confidential information from the reference document is NOT copied.
    """,
)
async def style_apply_endpoint(request: StyleApplicationRequest) -> StyleApplicationResponse:
    """
    Apply a style profile to a draft document.
    
    - **draft**: Draft to restyle
    - **profile**: Style profile to apply
    - **preserve_content**: Preserve user content, only apply formatting (default: true)
    - **target_sections**: Specific sections to restyle (None = all)
    """
    try:
        return await apply_style_profile(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("style_application_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Style application failed")


# Document Export Endpoints
@app.post(
    "/export",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
    tags=["Export"],
    summary="Export a draft document to DOCX or PDF",
    description="""
    Export a draft document to DOCX or PDF format.
    
    - DOCX: Always available using python-docx
    - PDF: Requires LibreOffice installed (optional integration)
    
    If PDF conversion fails, returns DOCX with a warning.
    Exported files are temporarily stored and cleaned up after EXPORT_MAX_FILE_AGE_HOURS.
    """,
)
async def export_document_endpoint(request: ExportRequest) -> ExportResponse:
    """
    Export a draft document.
    
    - **draft**: Draft to export
    - **format**: Export format (docx or pdf)
    - **include_comments**: Include review comments in export
    - **include_changes_summary**: Include changes summary page
    - **filename**: Custom filename (without extension)
    """
    try:
        return await export_document(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("export_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Export failed")


@app.get(
    "/exports/download/{filename}",
    tags=["Export"],
    summary="Download an exported document",
    description="Download a previously exported document file.",
)
async def download_export(filename: str):
    """Download an exported document."""
    from fastapi.responses import FileResponse
    
    settings = get_settings()
    export_dir = Path(settings.export.output_dir)
    file_path = export_dir / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export file not found")
    
    # Security: prevent path traversal
    try:
        file_path.resolve().relative_to(export_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    
    media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if filename.endswith(".pdf"):
        media_type = "application/pdf"
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
    )


# Voice Agent Endpoints
@app.post(
    "/voice/command",
    response_model=VoiceCommandResponse,
    status_code=status.HTTP_200_OK,
    tags=["Voice Agent"],
    summary="Process a voice command about a legal document",
    description="""
    Process a transcribed voice command about a legal document.
    
    Supported commands:
    - Summarize the draft
    - Explain a clause in plain language
    - Revise a specified paragraph
    - Find contradictions or missing information
    - Suggest an edit
    
    All edits require explicit user confirmation before applying.
    Destructive/bulk edits require additional confirmation.
    """,
)
async def voice_command_endpoint(request: VoiceCommandRequest) -> VoiceCommandResponse:
    """
    Process a voice command.
    
    - **command_text**: Transcribed voice command
    - **draft**: Current draft context (optional)
    - **facts**: Original facts context (optional)
    - **document_ids**: Document IDs for context (optional)
    """
    try:
        return await process_voice_command(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("voice_command_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Voice command processing failed")


@app.post(
    "/voice/configure",
    response_model=VoiceProviderConfigResponse,
    status_code=status.HTTP_200_OK,
    tags=["Voice Agent"],
    summary="Configure voice provider settings",
    description="""
    Configure speech-to-text and text-to-speech providers.
    
    Providers: openai, google, azure, elevenlabs, local
    Local providers require appropriate packages installed (whisper, pyttsx3).
    """,
)
async def voice_configure_endpoint(request: VoiceProviderConfigRequest) -> VoiceProviderConfigResponse:
    """
    Configure voice providers.
    
    - **config**: Voice provider configuration with API keys and models
    """
    try:
        return await configure_voice_providers(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("voice_configure_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Voice configuration failed")


# External Document Review Endpoints
@app.post(
    "/review/external",
    response_model=ExternalReviewResponse,
    status_code=status.HTTP_200_OK,
    tags=["External Review"],
    summary="Review an uploaded legal document for issues",
    description="""
    Analyze an uploaded legal document for:
    - Ambiguous language and undefined terms
    - Contradictory facts, names, dates, or amounts
    - Missing information and unresolved placeholders
    - Inconsistent parties, dates, amounts, terminology, obligations
    - Unsupported factual claims
    - Potentially missing clauses (labeled as suggestions)
    - Structural inconsistencies and broken cross-references
    - Risky or one-sided clauses
    
    Each finding includes a stable ID, location, category, severity, explanation, suggested correction, evidence IDs, and uncertainty notes.
    """,
)
async def external_review_endpoint(request: ExternalReviewRequest) -> ExternalReviewResponse:
    """
    Review an uploaded legal document for issues.
    
    - **document_id**: ID of uploaded document to review
    - **facts**: Optional known facts for comparison
    - **jurisdiction**: Legal jurisdiction (optional)
    - **custom_checks**: Additional custom review criteria (optional)
    """
    try:
        return await review_external_document(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("external_review_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="External review failed")


# Citation Verification for External Documents
@app.post(
    "/citations/verify/external",
    response_model=CitationVerificationExternalResponse,
    status_code=status.HTTP_200_OK,
    tags=["Citation Verification"],
    summary="Verify citations in an uploaded document",
    description="""
    Extract and verify legal citations from an uploaded document.
    
    For each citation:
    - Normalizes the citation form
    - Checks authoritative sources (when configured)
    - Reports whether the source supports the stated proposition
    - Indicates whether current legal status was checked
    - Returns status: VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, NOT_CHECKED
    
    If no authoritative source integration is configured, returns NOT_CHECKED with a clear reason.
    Does not invent citations, URLs, or verification results.
    """,
)
async def citation_verification_external_endpoint(request: CitationVerificationExternalRequest) -> CitationVerificationExternalResponse:
    """
    Verify citations in an uploaded document.
    
    - **document_id**: ID of uploaded document to verify
    - **jurisdiction**: Legal jurisdiction for source selection (optional)
    - **citation_ids**: Optional specific citations to verify
    """
    try:
        # Reuse the existing citation verification logic with a document_id
        from app.features.citation_verification import verify_citations
        from app.features.document_management import get_document_chunks
        from app.schemas import DraftResponse, DraftSection
        
        # Get document chunks and build a draft response
        chunks = await get_document_chunks(request.document_id)
        if not chunks:
            raise HTTPException(status_code=404, detail="Document not found or not processed")
        
        document_text = "\n\n".join(chunk.text for chunk in chunks)
        draft = DraftResponse(
            document_type=DocumentType.FORMAL_LETTER,
            title=f"Document {request.document_id}",
            sections=[DraftSection(title="Full Document", content=document_text, order=0)],
            assumptions=[],
            warnings=[],
            placeholders=[],
            review_status="draft_needs_review",
            disclaimer="External document for citation verification",
        )
        
        request_obj = CitationVerificationRequest(
            draft=draft,
            jurisdiction=request.jurisdiction,
            citation_ids=request.citation_ids,
        )
        
        result = await verify_citations(request_obj)
        
        return CitationVerificationExternalResponse(
            document_id=request.document_id,
            results=result.results,
            summary=result.summary,
            sources_configured=result.sources_configured,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("citation_verification_external_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Citation verification failed")


# Document Summarization
@app.post(
    "/summarize",
    response_model=SummarizationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Document Intelligence"],
    summary="Generate a summary of an uploaded document",
    description="""
    Generate a concise or detailed summary of an uploaded legal document.
    
    Extracts:
    - Key facts, parties, and their roles
    - Important dates and deadlines
    - Key obligations and commitments
    - Potential risks and issues
    - Legal citations and authorities referenced
    - Unresolved placeholders or missing information
    """,
)
async def summarize_endpoint(request: SummarizationRequest) -> SummarizationResponse:
    """
    Generate a summary of an uploaded document.
    
    - **document_id**: ID of uploaded document to summarize
    - **detail_level**: brief, standard, or detailed
    - **focus_areas**: Specific areas to focus on (optional)
    """
    try:
        return await summarize_document(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("summarization_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Summarization failed")


# Document-Specific Q&A
@app.post(
    "/qa/document",
    response_model=DocumentQAResponse,
    status_code=status.HTTP_200_OK,
    tags=["Document Intelligence"],
    summary="Ask questions about an uploaded document",
    description="""
    Ask questions about an uploaded legal document using RAG.
    
    The system retrieves relevant passages from the document and generates
    an answer with source citations. If the document doesn't contain enough
    information, it explicitly states what's missing.
    """,
)
async def document_qa_endpoint(request: DocumentQARequest) -> DocumentQAResponse:
    """
    Ask a question about an uploaded document.
    
    - **document_id**: ID of uploaded document
    - **question**: Question about the document
    - **conversation_history**: Previous Q&A pairs for context (optional)
    - **include_sources**: Include source excerpts in response (default: true)
    """
    try:
        return await answer_document_question(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("document_qa_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Document Q&A failed")


# General Legal AI Assistant
@app.post(
    "/assistant/legal",
    response_model=LegalAssistantResponse,
    status_code=status.HTTP_200_OK,
    tags=["Legal Assistant"],
    summary="Ask a general legal question",
    description="""
    Ask a general legal question using authoritative legal sources.
    
    The assistant:
    - Retrieves relevant legal sources when configured
    - Distinguishes general principles from jurisdiction-specific rules
    - Asks for jurisdiction when it materially affects the answer
    - Clearly discloses uncertainty and limitations
    - Never invents citations or legal authorities
    - If no authoritative source integration is configured, returns NOT_CHECKED with a clear reason
    
    This is general legal information, NOT legal advice.
    """,
)
async def legal_assistant_endpoint(request: LegalAssistantRequest) -> LegalAssistantResponse:
    """
    Ask a general legal question.
    
    - **question**: Legal question to answer
    - **jurisdiction**: Legal jurisdiction (optional but recommended)
    - **conversation_history**: Previous Q&A pairs for context (optional)
    - **include_sources**: Include source citations in response (default: true)
    """
    try:
        return await answer_legal_question(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("legal_assistant_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Legal assistant failed")


# ============================================================
# CHUNK 6: Legal Argument Strategist Endpoints
# ============================================================

# Case Workspace Management
@app.post(
    "/cases",
    response_model=CaseWorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Case Workspace"],
    summary="Create a new legal case workspace",
)
async def create_case_workspace_endpoint(request: CaseWorkspaceCreateRequest) -> CaseWorkspaceResponse:
    """Create a new case workspace."""
    try:
        return await create_case_workspace(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("create_case_workspace_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create case workspace")


@app.get(
    "/cases",
    response_model=CaseWorkspaceListResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Workspace"],
    summary="List case workspaces",
)
async def list_case_workspaces_endpoint(
    limit: int = 20,
    offset: int = 0,
) -> CaseWorkspaceListResponse:
    """List case workspaces with pagination."""
    try:
        cases = await list_case_workspaces(limit=limit, offset=offset)
        return CaseWorkspaceListResponse(cases=cases, total=len(cases), limit=limit, offset=offset)
    except Exception as e:
        logger.error("list_case_workspaces_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list case workspaces")


@app.get(
    "/cases/{case_id}",
    response_model=CaseWorkspaceResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Workspace"],
    summary="Get case workspace by ID",
)
async def get_case_workspace_endpoint(case_id: str) -> CaseWorkspaceResponse:
    """Get details of a specific case workspace."""
    try:
        workspace = await get_case_workspace(case_id)
        if not workspace:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")
        return workspace
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_case_workspace_failed", case_id=case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get case workspace")


@app.delete(
    "/cases/{case_id}",
    status_code=status.HTTP_200_OK,
    tags=["Case Workspace"],
    summary="Delete case workspace",
)
async def delete_case_workspace_endpoint(case_id: str):
    """Delete a case workspace and its documents."""
    try:
        success = await delete_case_workspace(case_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")
        return {"success": True, "case_id": case_id, "message": "Case workspace deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_case_workspace_failed", case_id=case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete case workspace")


@app.post(
    "/cases/{case_id}/documents",
    response_model=CaseDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Case Workspace"],
    summary="Upload document to a case workspace",
)
async def upload_case_document_endpoint(
    case_id: str,
    file: UploadFile = File(...),
    category: str = Form("evidence"),
    document_type: str = Form("other"),
    party_side: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
) -> CaseDocumentUploadResponse:
    """Upload and index a document in the case workspace."""
    try:
        content = await file.read()
        return await upload_case_document(
            case_id=case_id,
            file_content=content,
            filename=file.filename or "document.txt",
            category=category,
            document_type=document_type,
            content_type=file.content_type,
            party_side=party_side,
            description=description,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("upload_case_document_failed", case_id=case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload case document")


@app.get(
    "/cases/{case_id}/documents",
    status_code=status.HTTP_200_OK,
    tags=["Case Workspace"],
    summary="List documents in case workspace",
)
async def list_case_documents_endpoint(
    case_id: str,
    limit: int = 100,
    offset: int = 0,
    category: Optional[str] = None,
):
    """List documents belonging to a case workspace."""
    try:
        from app.features.case_workspace import list_case_documents
        docs = await list_case_documents(case_id, limit=limit, offset=offset, category=category)
        return {
            "case_id": case_id,
            "documents": [
                {
                    "document_id": d.id,
                    "filename": d.filename,
                    "file_type": d.file_type,
                    "file_size": d.file_size,
                    "upload_timestamp": d.upload_timestamp.isoformat() if hasattr(d.upload_timestamp, "isoformat") else str(d.upload_timestamp),
                    "extraction_status": d.extraction_status,
                    "category": d.metadata.get("category"),
                    "document_type": d.metadata.get("document_type"),
                    "party_side": d.metadata.get("party_side"),
                    "description": d.metadata.get("description"),
                    "page_count": d.metadata.get("page_count"),
                    "chunk_count": d.chunk_count,
                }
                for d in docs
            ],
            "total": len(docs),
        }
    except Exception as e:
        logger.error("list_case_documents_failed", case_id=case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list case documents")


@app.delete(
    "/cases/{case_id}/documents/{document_id}",
    status_code=status.HTTP_200_OK,
    tags=["Case Workspace"],
    summary="Delete document from case workspace",
)
async def delete_case_document_endpoint(case_id: str, document_id: str):
    """Delete a document from a case workspace."""
    try:
        success = await delete_case_document(case_id, document_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {document_id} not found in case {case_id}")
        return {"success": True, "case_id": case_id, "document_id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_case_document_failed", case_id=case_id, document_id=document_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete case document")


# Case Understanding / Brief
@app.post(
    "/cases/brief",
    response_model=CaseBriefResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Analysis"],
    summary="Generate case brief and chronology",
)
@app.post(
    "/cases/{case_id}/brief",
    response_model=CaseBriefResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Analysis"],
    summary="Generate case brief and chronology",
)
async def case_brief_endpoint(request: CaseBriefRequest, case_id: Optional[str] = None) -> CaseBriefResponse:
    """Generate a comprehensive case brief and chronology."""
    try:
        if case_id:
            request.case_id = case_id
        return await generate_case_brief(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("case_brief_failed", case_id=request.case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Case brief generation failed: {str(e)}")


# Opposition Analysis
@app.post(
    "/cases/opposition",
    response_model=OppositionComparisonResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Analysis"],
    summary="Compare client and opposition documents",
)
@app.post(
    "/cases/{case_id}/opposition",
    response_model=OppositionComparisonResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Analysis"],
    summary="Compare client and opposition documents",
)
async def opposition_analysis_endpoint(request: OppositionComparisonRequest, case_id: Optional[str] = None) -> OppositionComparisonResponse:
    """Compare client and opposition positions."""
    try:
        if case_id:
            request.case_id = case_id
        return await compare_client_opposition(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("opposition_analysis_failed", case_id=request.case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Opposition analysis failed: {str(e)}")


# Legal Research
@app.post(
    "/cases/research",
    response_model=LegalResearchResponse,
    status_code=status.HTTP_200_OK,
    tags=["Legal Research"],
    summary="Conduct legal research on specific issues",
)
@app.post(
    "/cases/{case_id}/research",
    response_model=LegalResearchResponse,
    status_code=status.HTTP_200_OK,
    tags=["Legal Research"],
    summary="Conduct legal research for a case",
)
async def legal_research_endpoint(request: LegalResearchRequest, case_id: Optional[str] = None) -> LegalResearchResponse:
    """Conduct legal research on Indian law issues."""
    try:
        if case_id:
            request.case_id = case_id
        return await conduct_legal_research(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("legal_research_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Legal research failed: {str(e)}")


# Argument Builder
@app.post(
    "/cases/arguments",
    response_model=ArgumentBuilderResponse,
    status_code=status.HTTP_200_OK,
    tags=["Argument Strategy"],
    summary="Generate structured legal argument outlines",
)
@app.post(
    "/cases/{case_id}/arguments",
    response_model=ArgumentBuilderResponse,
    status_code=status.HTTP_200_OK,
    tags=["Argument Strategy"],
    summary="Generate structured legal argument outlines for a case",
)
async def argument_builder_endpoint(request: ArgumentBuilderRequest, case_id: Optional[str] = None) -> ArgumentBuilderResponse:
    """Generate structured legal arguments, counterarguments, and submission outlines."""
    try:
        if case_id:
            request.case_id = case_id
        return await generate_arguments(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("argument_builder_failed", case_id=request.case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Argument generation failed: {str(e)}")


# Scrutiny Checklist
@app.post(
    "/cases/scrutiny",
    response_model=ScrutinyChecklistResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Scrutiny"],
    summary="Run comprehensive case scrutiny checklist",
)
@app.post(
    "/cases/{case_id}/scrutiny",
    response_model=ScrutinyChecklistResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Scrutiny"],
    summary="Run comprehensive case scrutiny checklist for a case",
)
async def scrutiny_checklist_endpoint(request: ScrutinyChecklistRequest, case_id: Optional[str] = None) -> ScrutinyChecklistResponse:
    """Run comprehensive scrutiny checklist across factual, procedural, and evidentiary dimensions."""
    try:
        if case_id:
            request.case_id = case_id
        return await run_scrutiny_checklist(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("scrutiny_checklist_failed", case_id=request.case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Scrutiny checklist failed: {str(e)}")


# Citation Verification in Case
@app.post(
    "/cases/citations/verify",
    response_model=CitationVerificationCaseResponse,
    status_code=status.HTTP_200_OK,
    tags=["Citation Verification"],
    summary="Verify citations in case documents",
)
@app.post(
    "/cases/{case_id}/citations/verify",
    response_model=CitationVerificationCaseResponse,
    status_code=status.HTTP_200_OK,
    tags=["Citation Verification"],
    summary="Verify citations in case documents",
)
async def citation_verification_case_endpoint(request: CitationVerificationCaseRequest, case_id: Optional[str] = None) -> CitationVerificationCaseResponse:
    """Extract and verify legal citations in case documents."""
    try:
        if case_id:
            request.case_id = case_id
        return await verify_citations_in_case(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("citation_verification_case_failed", case_id=request.case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Citation verification failed: {str(e)}")


# Case Assistant
@app.post(
    "/cases/assistant",
    response_model=CaseAssistantResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Assistant"],
    summary="Case-specific AI legal assistant",
)
@app.post(
    "/cases/{case_id}/assistant",
    response_model=CaseAssistantResponse,
    status_code=status.HTTP_200_OK,
    tags=["Case Assistant"],
    summary="Case-specific AI legal assistant",
)
async def case_assistant_endpoint(request: CaseAssistantRequest, case_id: Optional[str] = None) -> CaseAssistantResponse:
    """Ask questions and get strategic guidance regarding a specific case."""
    try:
        if case_id:
            request.case_id = case_id
        return await process_case_command(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("case_assistant_failed", case_id=request.case_id, error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Case assistant processing failed: {str(e)}")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "DraftMate AI",
        "version": "1.0.0",
        "description": "AI-powered legal document drafting and litigation strategy service with document intelligence, RAG, review, citation verification, redlining, style adaptation, export, voice agent, external review, summarization, document Q&A, legal assistant, and case strategy",
        "endpoints": {
            "health": "/health",
            "llm_health": "/health/llm",
            "fact_extraction": "/facts",
            "draft_generation": "/draft",
            "evidence_grounded_draft": "/draft/evidence-grounded",
            "review": "/review",
            "citation_verification": "/citations/verify",
            "citation_verification_external": "/citations/verify/external",
            "redline": "/redline",
            "redline_decisions": "/redline/{id}/decisions",
            "redline_preview": "/redline/{id}/preview",
            "style_extract": "/style/extract",
            "style_apply": "/style/apply",
            "export": "/export",
            "export_download": "/exports/download/{filename}",
            "voice_command": "/voice/command",
            "voice_configure": "/voice/configure",
            "external_review": "/review/external",
            "summarize": "/summarize",
            "document_qa": "/qa/document",
            "legal_assistant": "/assistant/legal",
            "document_upload": "/documents/upload",
            "document_list": "/documents",
            "document_get": "/documents/{id}",
            "document_delete": "/documents/{id}",
            "retrieve": "/retrieve",
            "cases": "/cases",
            "case_brief": "/cases/brief",
            "case_opposition": "/cases/opposition",
            "case_research": "/cases/research",
            "case_arguments": "/cases/arguments",
            "case_scrutiny": "/cases/scrutiny",
            "case_citations": "/cases/citations/verify",
            "case_assistant": "/cases/assistant",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
    }


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.server.host,
        port=settings.server.port,
        log_level=settings.server.log_level.lower(),
        reload=False,
    )