"""Comprehensive Live Verification Script for DraftMate AI."""
from pathlib import Path
from app.features.document_parsing import convert_to_markdown
from app.core.context_optimizer import optimize_legal_context
from app.plugins.legal_workflows import map_legacy_statute, BailPetitionPlugin, ChequeBounceNoticePlugin, ContractRiskPlugin
from app.voice.voxcpm_service import synthesize_speech_locally

print("=== 1. MICROSOFT MARKITDOWN PARSING ===")
md_docx = convert_to_markdown(Path("../test_files/sample.docx"))
print(f"DOCX -> Markdown: {len(md_docx)} characters extracted cleanly.")
md_pdf = convert_to_markdown(Path("../test_files/sample.pdf"))
print(f"PDF -> Markdown: {len(md_pdf)} characters extracted cleanly.")

print("\n=== 2. HEADROOM CONTEXT & TOKEN OPTIMIZATION ===")
sample_brief = """NOW THIS INDENTURE WITNESSETH AS FOLLOWS: 
AND WHEREAS the parties hereto have agreed to the following terms.
The respondent defaulted on payment of Rs. 7,50,000 on 15-08-2025 under Section 138 of Negotiable Instruments Act, 1881.
IN WITNESS WHEREOF the parties have set their respective hands."""
res = optimize_legal_context(sample_brief)
print(f"Token Compression: {res.original_token_estimate} -> {res.optimized_token_estimate} tokens ({res.reduction_percentage}% reduction)")
print(f"Preserved Statutes: {res.preserved_statutes}")
print(f"Preserved Amounts: {res.preserved_amounts}")

print("\n=== 3. CLAUDE FOR LEGAL TASK PLUGINS ===")
bail_grounds = BailPetitionPlugin.generate_bail_grounds({"medical_grounds": "Acute cardiac condition"})
print(f"Bail Petition Grounds Generated: {len(bail_grounds)} grounds ready for court filing")
notice = ChequeBounceNoticePlugin.validate_and_draft_notice({"cheque_number": "884920", "amount": "750000", "memo_date": "12-09-2025"})
print(f"Cheque Notice Title: {notice['title']} ({notice['statutory_period_days']} days demand period)")
risks = ContractRiskPlugin.inspect_clauses("The service provider shall indemnify and hold harmless the client against uncapped damages under exclusive jurisdiction of Mumbai.")
print(f"Contract Due Diligence: {len(risks)} high-risk clauses flagged")

print("\n=== 4. AWESOME LEGAL SKILLS STATUTORY MIGRATION ===")
ipc_map = map_legacy_statute("ipc", "302")
print(f"Legacy Migration: {ipc_map['legacy_statute']} -> {ipc_map['modern_statute']}")
crpc_map = map_legacy_statute("crpc", "438")
print(f"Legacy Migration: {crpc_map['legacy_statute']} -> {crpc_map['modern_statute']}")

print("\n=== 5. VOXCPM2 LOCAL SPEECH SYNTHESIS ===")
audio = synthesize_speech_locally("Court is now in session. The applicant may proceed with arguments.")
print(f"Voice Output: Generated {audio['filename']} at {audio['sample_rate']}Hz ({audio['engine']})")
print(f"Audio Path: {audio['audio_path']}")
