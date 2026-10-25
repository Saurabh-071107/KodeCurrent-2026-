"""Tests for P6: Legal Argument Strategist for Indian Lawyers."""
import io
import json
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from app.main import app
from app.schemas import (
    CaseWorkspaceCreateRequest,
    CaseWorkspaceResponse,
    CaseBriefRequest,
    OppositionComparisonRequest,
    LegalResearchRequest,
    ArgumentBuilderRequest,
    ScrutinyChecklistRequest,
    CitationVerificationCaseRequest,
    CaseAssistantRequest,
    PartyInfo,
    PartyRole,
    FindingSeverity,
)
from app.core.storage import get_document_store
from app.features.chunking import get_chunk_store
from app.features.retriever_instance import get_retriever
from tests.conftest import mock_adapter, mock_router


@pytest.fixture(autouse=True)
async def clear_case_stores():
    """Clear document and chunk stores between tests."""
    doc_store = get_document_store()
    chunk_store = get_chunk_store()
    retriever = get_retriever()
    
    chunk_store.clear()
    docs = await doc_store.list(limit=1000)
    for doc in docs:
        await doc_store.delete(doc.id)
    retriever.build_index([])
    
    yield
    
    chunk_store.clear()
    docs = await doc_store.list(limit=1000)
    for doc in docs:
        await doc_store.delete(doc.id)
    retriever.build_index([])


class TestCaseWorkspaceLifecycle:
    """Test Case Workspace CRUD and document ingestion."""

    @pytest.mark.asyncio
    async def test_create_case_workspace(self):
        """Test creating a new legal case workspace."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "case_name": "Mehta v. Union of India",
                "case_number": "WP(C) 1234/2024",
                "court": "Delhi High Court",
                "jurisdiction": "Delhi High Court",
                "case_type": "Civil Writ Petition",
                "parties": [
                    {"name": "Rajesh Mehta", "role": "petitioner"},
                    {"name": "Union of India", "role": "respondent"}
                ],
                "description": "Writ petition challenging arbitrary cancellation of license"
            }
            resp = await client.post("/cases", json=payload)
            assert resp.status_code == 201
            data = resp.json()
            assert data["case_name"] == "Mehta v. Union of India"
            assert data["case_id"] is not None
            assert len(data["parties"]) == 2
            assert data["document_count"] == 0

    @pytest.mark.asyncio
    async def test_list_and_get_case_workspace(self):
        """Test listing and fetching workspaces."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Create two cases
            p1 = {"case_name": "Case A", "parties": [{"name": "A", "role": "plaintiff"}]}
            p2 = {"case_name": "Case B", "parties": [{"name": "B", "role": "plaintiff"}]}
            r1 = await client.post("/cases", json=p1)
            r2 = await client.post("/cases", json=p2)
            case_id_1 = r1.json()["case_id"]
            case_id_2 = r2.json()["case_id"]

            # List cases
            list_resp = await client.get("/cases")
            assert list_resp.status_code == 200
            data = list_resp.json()
            assert data["total"] >= 2
            case_ids = [c["case_id"] for c in data["cases"]]
            assert case_id_1 in case_ids
            assert case_id_2 in case_ids

            # Get single case
            get_resp = await client.get(f"/cases/{case_id_1}")
            assert get_resp.status_code == 200
            assert get_resp.json()["case_name"] == "Case A"

    @pytest.mark.asyncio
    async def test_case_document_upload_and_delete(self):
        """Test uploading a document into a case workspace and deleting it."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post("/cases", json={"case_name": "Doc Test Case"})
            case_id = create_resp.json()["case_id"]

            # Upload a text document
            file_content = b"The Petitioner Rajesh Mehta was granted a license under Section 4 of the Act on 12-05-2020."
            files = {"file": ("petition.txt", io.BytesIO(file_content), "text/plain")}
            data = {
                "category": "client_pleadings",
                "document_type": "plaint",
                "party_side": "client",
                "description": "Original Writ Petition"
            }
            up_resp = await client.post(f"/cases/{case_id}/documents", files=files, data=data)
            assert up_resp.status_code == 201
            doc_data = up_resp.json()
            assert doc_data["case_id"] == case_id
            doc_id = doc_data["document_id"]
            assert doc_data["extraction_status"] == "completed"
            assert doc_data["chunk_count"] > 0

            # List documents in case
            docs_resp = await client.get(f"/cases/{case_id}/documents")
            assert docs_resp.status_code == 200
            assert docs_resp.json()["total"] == 1

            # Delete the document
            del_resp = await client.delete(f"/cases/{case_id}/documents/{doc_id}")
            assert del_resp.status_code == 200

            # Verify deletion
            docs_resp_after = await client.get(f"/cases/{case_id}/documents")
            assert docs_resp_after.json()["total"] == 0

            # Delete case
            case_del = await client.delete(f"/cases/{case_id}")
            assert case_del.status_code == 200


class TestCaseUnderstanding:
    """Test Case Brief and Chronology extraction."""

    @pytest.mark.asyncio
    async def test_case_brief_generation(self, mock_router, mock_adapter):
        """Test case brief and timeline generation from uploaded case materials."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "case_name": "Mehta v. Union of India",
            "parties": [{"name": "Rajesh Mehta", "role": "petitioner", "confidence": 0.95}],
            "court": "Delhi High Court",
            "jurisdiction": "Delhi High Court",
            "case_type": "Civil Writ Petition",
            "claims": ["Arbitrary cancellation of commercial license without show cause notice"],
            "defences": ["License breached condition 4(b)"],
            "relief_sought": ["Quashing of cancellation order dated 10-01-2024"],
            "material_facts": ["License granted in 2020", "No notice issued before cancellation"],
            "disputed_facts": ["Whether inspection report was furnished to Petitioner"],
            "procedural_history": ["Writ petition filed on 15-02-2024"],
            "important_dates": [{"date": "2024-01-10", "description": "Cancellation order passed", "is_approximate": False}],
            "evidence_summary": ["Copy of license agreement", "Impugned cancellation order"],
            "admissions": ["Respondent admits notice was not served personally"],
            "denials": ["Respondent denies violation of natural justice"],
            "inconsistencies": ["Date in impugned order differs from dispatch ledger"],
            "missing_information": ["Proof of service of inspection report"],
            "timeline": [
                {"date": "2020-05-12", "event": "License granted", "source_doc": "doc_1", "page": 1},
                {"date": "2024-01-10", "event": "Cancellation order issued", "source_doc": "doc_2", "page": 2}
            ],
            "evidence_map": {"No show cause notice": ["chunk_1"]},
            "missing_documents": ["Original inspection report"],
            "confidence_assessment": "High confidence based on documentary evidence"
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Create workspace and upload doc
            case = await client.post("/cases", json={"case_name": "Mehta v. Union of India"})
            case_id = case.json()["case_id"]

            files = {"file": ("facts.txt", io.BytesIO(b"Petitioner was cancelled without notice on 10 Jan 2024."), "text/plain")}
            await client.post(f"/cases/{case_id}/documents", files=files, data={"category": "evidence", "document_type": "exhibit"})

            # Request brief
            resp = await client.post(f"/cases/{case_id}/brief", json={"case_id": case_id})
            assert resp.status_code == 200
            data = resp.json()
            assert data["case_name"] == "Mehta v. Union of India"
            assert len(data["timeline"]) == 2
            assert "Arbitrary cancellation" in data["claims"][0]
            assert len(data["important_dates"]) == 1


class TestOppositionAnalysis:
    """Test Opposition and Counterargument analysis."""

    @pytest.mark.asyncio
    async def test_opposition_comparison(self, mock_router, mock_adapter):
        """Test comparing client and opposition materials."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "client_arguments": ["Violation of principles of natural justice under Article 14"],
            "opposition_arguments": ["Show cause notice deemed served by postal dispatch"],
            "unsupported_allegations": ["Opposition asserts physical delivery occurred but provides no postal receipt"],
            "contradictions_in_opposition": ["Paragraph 4 states notice sent on 5 Jan, Annexure R-1 shows receipt dated 2 Jan"],
            "conflicts_pleadings_evidence": ["Affidavit claims oral hearing provided, but order records ex-parte decision"],
            "admitted_facts": ["Petitioner was in compliance with fee payments until Dec 2023"],
            "denied_facts": ["Delivery of show cause notice"],
            "disputed_facts": ["Validity of postal dispatch"],
            "evidentiary_weaknesses": ["Absence of track consignment report from India Post"],
            "unanswered_claims": ["Petitioner's claim of legitimate expectation not addressed in counter"],
            "client_weaknesses": ["Delay of 35 days in approaching High Court"],
            "possible_objections": ["Availability of alternative remedy before Appellate Authority"],
            "evidence_gaps": ["Postal tracking receipt missing on opposition side"],
            "confidence": "High"
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "Opposition Test"})
            case_id = case.json()["case_id"]

            files_c = {"file": ("client.txt", io.BytesIO(b"Client asserts no notice received."), "text/plain")}
            c_up = await client.post(f"/cases/{case_id}/documents", files=files_c, data={"category": "client_pleadings", "document_type": "plaint", "party_side": "client"})
            c_id = c_up.json()["document_id"]

            files_o = {"file": ("opp.txt", io.BytesIO(b"Opposition claims postal notice was dispatched."), "text/plain")}
            o_up = await client.post(f"/cases/{case_id}/documents", files=files_o, data={"category": "opposing_pleadings", "document_type": "reply", "party_side": "opposing"})
            o_id = o_up.json()["document_id"]

            req_body = {
                "case_id": case_id,
                "client_document_ids": [c_id],
                "opposition_document_ids": [o_id]
            }
            resp = await client.post(f"/cases/{case_id}/opposition", json=req_body)
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["unsupported_allegations"]) > 0
            assert "contradictions_in_opposition" in data
            assert len(data["evidentiary_weaknesses"]) > 0


class TestLegalResearch:
    """Test Indian Legal Research endpoint."""

    @pytest.mark.asyncio
    async def test_legal_research_endpoint(self, mock_router, mock_adapter):
        """Test legal research retrieving constitutional and statutory authorities."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "results": [
                {
                    "issue": "Breach of natural justice in administrative license cancellation",
                    "constitutional_provisions": [
                        {"article": "Article 14", "text": "Equality before law and protection against arbitrariness", "relevance": "Non-arbitrariness doctrine requires fair hearing"}
                    ],
                    "statutes": [
                        {"name": "General Clauses Act, 1897", "section": "Section 21", "text": "Power to make includes power to amend or rescind", "relevance": "Rescission must adhere to statutory procedure"}
                    ],
                    "rules_regulations": [],
                    "precedents": [
                        {"case_name": "Maneka Gandhi v. Union of India", "court": "Supreme Court of India", "year": "1978", "citation": "(1978) 1 SCC 248", "ratio": "Principles of natural justice are an integral facet of Article 14.", "relevance": "Directly supports quashing administrative order passed without hearing"}
                    ],
                    "binding_authorities": [
                        {"case_name": "Maneka Gandhi v. Union of India", "court": "Supreme Court of India", "year": "1978", "citation": "(1978) 1 SCC 248", "ratio": "Fair procedure is essential."}
                    ],
                    "persuasive_authorities": [],
                    "ratio_decidendi": ["Any state action adversely impacting civil rights must adhere to audi alteram partem."],
                    "factual_distinctions": ["The statute did not contain an express exclusion of hearing."],
                    "subsequent_treatment": ["Affirmed in Swadeshi Cotton Mills (1981)"],
                    "legal_position_summary": "Administrative orders passed without opportunity of hearing violate Article 14.",
                    "research_gaps": ["Check whether relevant state statute has special appeal tribunal."],
                    "sources": [
                        {"title": "Constitution of India", "url": "https://legislative.gov.in/constitution-of-india", "excerpt": "Article 14", "jurisdiction": "India"}
                    ],
                    "confidence": 0.95
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "issues": ["Breach of natural justice in administrative license cancellation"],
                "jurisdiction": "India",
                "include_constitutional": True,
                "include_statutes": True,
                "include_precedents": True
            }
            resp = await client.post("/cases/research", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["total_issues"] == 1
            result = data["results"][0]
            assert result["constitutional_provisions"][0]["article"] == "Article 14"
            assert "Maneka Gandhi" in result["precedents"][0]["case_name"]
            assert data["disclaimer"] is not None


class TestArgumentBuilder:
    """Test Argument Strategy & Generation."""

    @pytest.mark.asyncio
    async def test_generate_arguments(self, mock_router, mock_adapter):
        """Test generating primary, alternative, and rebuttal argument outlines."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "arguments": [
                {
                    "argument_id": "arg_001",
                    "issue": "Whether cancellation without prior show cause notice violates natural justice under Article 14",
                    "material_facts": ["License granted 2020", "Order passed 10-01-2024 with no prior notice"],
                    "supporting_evidence": ["Exhibit P-1 License copy", "Exhibit P-2 Impugned Order"],
                    "legal_provisions": ["Article 14 of the Constitution of India"],
                    "supporting_authorities": [
                        {"case_name": "Maneka Gandhi v. Union of India", "court": "Supreme Court of India", "citation": "(1978) 1 SCC 248", "ratio": "Natural justice applies to administrative actions", "relevance": "Direct authority"}
                    ],
                    "legal_reasoning": "The impugned order deprives Petitioner of livelihood without affording opportunity to be heard.",
                    "proposed_argument": "The Respondent failed to serve any notice to show cause prior to cancellation, rendering the order void ab initio.",
                    "expected_counterargument": "Respondent claims urgency precluded prior notice.",
                    "rebuttal": "No emergency or public health hazard was demonstrated on the record.",
                    "weaknesses": ["Availability of alternative appellate remedy"],
                    "additional_documents_needed": ["Certified copy of dispatch register"],
                    "proposed_relief": "Issue writ of certiorari quashing impugned order",
                    "priority": 1,
                    "argument_type": "primary",
                    "confidence": 0.92
                }
            ],
            "alternative_arguments": [
                {
                    "argument_id": "arg_alt_001",
                    "issue": "Doctrine of Proportionality",
                    "material_facts": ["Minor defect in premises easily curable"],
                    "supporting_evidence": ["Rectification report"],
                    "legal_provisions": ["Wednesbury unreasonableness and proportionality"],
                    "supporting_authorities": [],
                    "legal_reasoning": "Even assuming minor irregularity, total cancellation is disproportionate.",
                    "proposed_argument": "Total cancellation is disproportionate when rectification was feasible.",
                    "expected_counterargument": "Strict compliance clause mandatory.",
                    "rebuttal": "Disproportionality violates Article 14.",
                    "weaknesses": [],
                    "additional_documents_needed": [],
                    "proposed_relief": "Order suspension instead of cancellation",
                    "priority": 2,
                    "argument_type": "alternative",
                    "confidence": 0.85
                }
            ],
            "rebuttals": [],
            "constitutional_arguments": [],
            "argument_outline": "I. Primary Submission: Violation of Audi Alteram Partem\nII. Alternative Submission: Disproportionality",
            "oral_submission_outline": "1. Urge Article 14 non-hearing. 2. Urge disproportionality.",
            "weaknesses_summary": ["Alternate statutory appeal available"],
            "additional_documents_needed": ["Certified order sheet"],
            "research_gaps": ["High Court precedents on bypassing alternate remedy where natural justice breached"]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "Argument Test Case"})
            case_id = case.json()["case_id"]

            payload = {
                "case_id": case_id,
                "argument_type": "client",
                "jurisdiction": "India",
                "max_arguments": 3
            }
            resp = await client.post(f"/cases/{case_id}/arguments", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["arguments"]) == 1
            assert data["arguments"][0]["argument_type"] == "primary"
            assert len(data["alternative_arguments"]) == 1
            assert "Proportionality" in data["alternative_arguments"][0]["issue"]
            assert data["argument_outline"] != ""
            assert data["oral_submission_outline"] != ""


class TestScrutinyChecklist:
    """Test comprehensive Case Scrutiny Checklist."""

    @pytest.mark.asyncio
    async def test_scrutiny_checklist_execution(self, mock_router, mock_adapter):
        """Test running category A-F scrutiny checklist."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "items": [
                {
                    "item_id": "scrutiny_a1",
                    "category": "A",
                    "sub_category": "A.1",
                    "description": "Conflicting facts, dates, names, amounts",
                    "status": "ISSUE_FOUND",
                    "explanation": "Date of cancellation stated as 10 Jan in petition but 12 Jan in Exhibit P-2",
                    "evidence_reference": "Petition para 3 vs Exhibit P-2 header",
                    "severity": "medium"
                },
                {
                    "item_id": "scrutiny_b1",
                    "category": "B",
                    "sub_category": "B.1",
                    "description": "Unsupported factual assertions",
                    "status": "PASS",
                    "explanation": "All factual assertions supported by annexed exhibits",
                    "evidence_reference": "Exhibits P-1 to P-5",
                    "severity": "low"
                },
                {
                    "item_id": "scrutiny_d1",
                    "category": "D",
                    "sub_category": "D.1",
                    "description": "Jurisdiction and maintainability",
                    "status": "NEEDS_REVIEW",
                    "explanation": "Statutory appellate remedy available under Section 18 of the Act",
                    "evidence_reference": "Section 18 Act text",
                    "severity": "high"
                }
            ]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "Scrutiny Test Case"})
            case_id = case.json()["case_id"]

            resp = await client.post(f"/cases/{case_id}/scrutiny", json={"case_id": case_id})
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["items"]) == 3
            assert data["overall_status"] in ["ISSUES_FOUND", "NEEDS_REVIEW"]
            assert data["summary"]["total_items"] == 3
            assert data["document_hash"] != ""


class TestCitationVerificationCase:
    """Test Citation extraction and verification in a case workspace."""

    @pytest.mark.asyncio
    async def test_citation_verification_labels_unverified(self):
        """Test that authorities without configured integrations are strictly labeled not_checked/unverified."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "Citation Test Case"})
            case_id = case.json()["case_id"]

            # Upload document containing Indian legal citations
            doc_text = (
                b"Pursuant to Article 21 and Article 14 of the Constitution of India, "
                b"and Section 9 of the Code of Civil Procedure, 1908, "
                b"the Supreme Court held in Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225 that basic structure is inviolable."
            )
            files = {"file": ("citations.txt", io.BytesIO(doc_text), "text/plain")}
            await client.post(f"/cases/{case_id}/documents", files=files, data={"category": "evidence", "document_type": "other"})

            resp = await client.post(f"/cases/{case_id}/citations/verify", json={"case_id": case_id, "verify_all": True})
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["results"]) > 0
            # Ensure none of the citations falsely claim to be verified without source integration
            for res in data["results"]:
                assert res["status"] in ["not_checked", "unverified", "partially_verified"]
                assert res["current_status_checked"] is False
                assert "No authoritative legal source integration" in res["notes"]


class TestCaseAssistant:
    """Test conversational case assistant."""

    @pytest.mark.asyncio
    async def test_case_assistant_query_and_redlines(self, mock_router, mock_adapter):
        """Test case assistant answering legal questions and proposing structured redlines."""
        mock_response = AsyncMock()
        mock_response.content = json.dumps({
            "command_type": "suggest_edit",
            "response_text": "I reviewed the cancellation paragraph and suggest clarifying the lack of personal service.",
            "action_required": True,
            "proposed_changes": [
                {
                    "operation_id": "op_case_01",
                    "operation_type": "replace",
                    "target_location": "Paragraph 4",
                    "original_text": "The notice was not received.",
                    "proposed_text": "No notice to show cause was ever served upon the Petitioner, either personally or through registered post.",
                    "explanation": "Strengthen the pleading by affirmatively denying both modes of service.",
                    "risk_level": "low",
                    "related_finding_ids": [],
                    "evidence_ids": [],
                    "depends_on": []
                }
            ],
            "target_location": "Paragraph 4",
            "explanation": "Replaces vague denial with legally specific averment",
            "requires_confirmation": True,
            "follow_up_suggestions": [
                "Would you like me to draft a supporting ground under Article 14?",
                "Should we verify whether an affidavit of service was filed?"
            ]
        })
        mock_adapter.chat.return_value = mock_response

        import app.core.model_router as mr
        mr._router = mock_router

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "Assistant Case"})
            case_id = case.json()["case_id"]

            req_body = {
                "case_id": case_id,
                "question": "How can I improve the notice denial in paragraph 4?",
                "conversation_history": [
                    {"question": "What is the primary ground?", "answer": "Violation of natural justice."}
                ]
            }
            resp = await client.post(f"/cases/{case_id}/assistant", json=req_body)
            assert resp.status_code == 200
            data = resp.json()
            assert data["action_required"] is True
            assert len(data["proposed_edits"]) == 1
            assert data["proposed_edits"][0]["operation_type"] == "replace"
            assert len(data["follow_up_suggestions"]) == 2


class TestReliabilityAndEdgeCases:
    """Test error handling, security, and edge cases."""

    @pytest.mark.asyncio
    async def test_nonexistent_case_brief(self):
        """Test generating brief on nonexistent case returns 400 or 404."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            fake_id = str(uuid.uuid4())
            resp = await client.post(f"/cases/{fake_id}/brief", json={"case_id": fake_id})
            assert resp.status_code in [400, 404, 500]

    @pytest.mark.asyncio
    async def test_empty_case_documents_brief(self):
        """Test brief generation on case with zero documents."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "Empty Case"})
            case_id = case.json()["case_id"]
            resp = await client.post(f"/cases/{case_id}/brief", json={"case_id": case_id})
            assert resp.status_code == 400
            err_msg = resp.json().get("detail") or resp.json().get("message") or ""
            assert "No processed documents found" in err_msg

    @pytest.mark.asyncio
    async def test_unsupported_file_upload(self):
        """Test uploading executable or unsupported file extension to case."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            case = await client.post("/cases", json={"case_name": "File Test"})
            case_id = case.json()["case_id"]
            files = {"file": ("malicious.exe", io.BytesIO(b"MZ..."), "application/octet-stream")}
            resp = await client.post(f"/cases/{case_id}/documents", files=files, data={"category": "evidence", "document_type": "other"})
            assert resp.status_code == 400
            err_msg = resp.json().get("detail") or resp.json().get("message") or ""
            assert "not allowed" in err_msg
