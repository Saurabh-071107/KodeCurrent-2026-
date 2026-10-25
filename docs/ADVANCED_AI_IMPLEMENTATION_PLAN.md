# DraftMate AI — Advanced AI & Voice Integration Specification

**Document Reference:** `docs/ADVANCED_AI_IMPLEMENTATION_PLAN.md`  
**Target Hardware:** NVIDIA GeForce RTX 5060 Laptop GPU (8.15 GB VRAM, CUDA 13.2)  
**Integrated Stacks:** VoxCPM2, OpenWhispr, Headroom, Claude for Legal, Awesome Legal Skills, Microsoft MarkItDown  
**Status:** Approved Implementation Blueprint  

---

## 1. System Integration Overview

This blueprint incorporates 6 industry-leading AI references into DraftMate AI:

1. **Microsoft MarkItDown (`markitdown`):** Standardizes document parsing. Converts litigation briefs, FIRs, contracts, and court orders into clean, structural Markdown with table preservation.
2. **Headroom (`headroomlabs-ai/headroom`):** Token optimization and semantic context pruning. Prunes repetitive legal recitals and boilerplate before prompt dispatch, slashing LLM token costs by 40%–70%.
3. **Claude for Legal (`claude-for-legal`):** Modular legal task plugins for Bail petitions, Section 138 NI Act notices, and contract due diligence.
4. **Awesome Legal Skills (`awesome-legal-skills`):** Standardized legal reasoning skill definitions (IRAC analysis, statutory cross-referencing, citation validation).
5. **VoxCPM2 (`openbmb/VoxCPM2`):** Local neural multilingual speech generation on the user's RTX 5060 GPU (~8 GB VRAM), powering the Moot Court Judge and Citizen audio assistant in Hindi, English, Marathi, Gujarati, and Telugu without cloud API costs.
6. **OpenWhispr (`openwhispr`):** Hands-free speech-to-text dictation pipeline for advocates drafting petitions and submitting oral arguments.

---

## 2. Phased Task List

- [ ] **Task 1: Document Parsing with Microsoft MarkItDown**
  - Install `markitdown` in the Python AI environment.
  - Implement `MarkItDownParser` in `draftmate-ai/app/features/document_parsing.py`.
  - Validate clean markdown output on legal PDFs, tables, and court orders.

- [ ] **Task 2: Context Compression & Token Optimization with Headroom**
  - Integrate `headroom` pruning algorithms in `draftmate-ai/app/core/context_optimizer.py`.
  - Configure retention thresholds for legal entities, statutory provisions, and factual averments.
  - Pipe pruned contexts to `POST /facts` and `POST /draft/evidence-grounded`.

- [ ] **Task 3: Legal Plugins & Skill Catalog (Claude for Legal & Awesome Legal Skills)**
  - Add modular plugins in `draftmate-ai/app/plugins/legal_workflows/`:
    - `bail_petition_plugin.py` (BNSS Sections 480/483)
    - `cheque_bounce_notice_plugin.py` (NI Act Section 138)
    - `contract_risk_plugin.py`
  - Implement skills in `draftmate-ai/app/skills/`:
    - `irac_issue_spotter`
    - `statutory_cross_referencer`
    - `ratio_decidendi_extractor`

- [ ] **Task 4: Local Neural Speech with VoxCPM2 on RTX 5060 GPU**
  - Install `voxcpm`, `torch >= 2.5`, `soundfile`.
  - Implement `VoxCPMService` in `draftmate-ai/app/voice/voxcpm_service.py` with `load_denoiser=False` to operate comfortably within the 8 GB VRAM budget.
  - Create endpoint `POST /api/v1/voice/synthesize` for streaming audio to the frontend.
  - Connect to Moot Court courtroom turn responses and Citizen audio guidance.

- [ ] **Task 5: Voice-to-Text Dictation with OpenWhispr**
  - Add frontend microphone dictation widget in `Frontend/Website/components/voice/VoiceDictation.tsx`.
  - Connect audio streams to transcription endpoint for live drafting and oral argument input.

- [ ] **Task 6: Verification & Benchmarks**
  - Monitor GPU memory on RTX 5060 under CUDA 13.2 to confirm stability under peak load.
  - Validate token reduction metrics with Headroom.
  - Run regression tests and confirm zero errors.
