# Frontend Plan: Legal Drafting Studio

Kodekurrent Season 2 · DraftMate AI Legal Drafting Studio

Stack: Next.js (App Router) + TypeScript + Tailwind CSS, talking to an Express backend.

---

## 1. Goals

- One clean, professional workspace: a central drafting area, a separate verification panel, accessible skills, upload, voice controls.
- The UI changes by role (student, advocate, firm admin, citizen). Users only see modules that apply to them.
- Human review stays central: every AI output is shown with its sources and verification status.
- Demo target (golden path): upload a reference document, pick a skill, answer pre-draft questions, see the draft, review citations, translate to Hindi or Gujarati, export.

---

## 2. Recommended libraries

| Need | Choice | Notes |
|---|---|---|
| UI components | shadcn/ui (Radix + Tailwind) | Fast, accessible, easy to restyle |
| Data fetching | TanStack Query | Caching, retries, loading and error states |
| Client state | Zustand | Small stores: session, active document, voice state |
| Forms | react-hook-form + zod | Share zod schemas with the backend if you can |
| Rich-text editor | Tiptap | Needed for the live document with tracked suggestions |
| Streaming | `fetch` + `ReadableStream` | `EventSource` cannot send POST bodies |
| Icons | lucide-react | |
| Fonts | Inter (UI) + Noto Sans Devanagari + Noto Sans Gujarati | Required so Hindi and Gujarati render correctly |

Keep the list short. Add a library only when a screen needs it.

---

## 3. Folder structure

```
apps/web/
  app/
    (auth)/login/
    (app)/
      layout.tsx            # app shell: sidebar, topbar, voice bar
      dashboard/            # role-based dashboard
      studio/               # drafting workspace + verify panel
      research/             # research chat + procedure planner
      translate/
      student/              # student centre, practice, AI courtroom
      tracker/              # case tracker
      library/
      tools/
      templates/
      team/                 # firm admin only
  components/
    shell/                  # Sidebar, Topbar, RoleGate, ConfirmDialog
    studio/                 # ChatPane, DocEditor, SkillPicker, PreCheckForm
    verify/                 # VerifyPanel, CitationRow, StatusBadge, LegacyFlag
    research/               # ChatThread, SourceCard, ProcedureRoadmap
    translate/              # LangSwitch, SideBySide, AskBox
    student/                # PracticeCard, CourtroomTurn, Scorecard
    tracker/                # CaseSearch, HearingTimeline
    voice/                  # VoiceBar, TranscriptToast
    ui/                     # shadcn components
  lib/
    api.ts                  # typed fetch client
    stream.ts               # SSE/stream helper
    roles.ts                # role -> modules map (mirror of backend)
    types.ts                # shared types (verification result, etc.)
  stores/                   # zustand stores
  styles/
```

---

## 4. Routes and role access

| Route | Student | Advocate | Firm admin | Citizen |
|---|---|---|---|---|
| `/dashboard` | yes | yes | yes | yes |
| `/studio` | practice only | yes | yes | notices only |
| `/research` | yes | yes (with planner) | yes (with planner) | no |
| `/translate` | yes | yes | yes | yes |
| `/student` | yes | no | no | no |
| `/tracker` | followed cases | yes | yes | yes |
| `/library` | yes | yes | yes | no |
| `/tools` | some | yes | yes | no |
| `/templates` | no | yes | yes | no |
| `/team` | no | no | yes | no |

- The backend is the source of truth for permissions. The frontend `roles.ts` map only decides what to show.
- Wrap each route in a `RoleGate` that redirects to `/dashboard` if the role lacks access.
- During the hackathon the role can come from a simple login; replace the demo `x-role` header with real auth.

---

## 5. App shell

- **Sidebar:** only the modules for the current role. Collapsible on small screens.
- **Topbar:** current role, language switch, and a notice that free-tier AI may use prompts for training (sample documents only).
- **Voice bar:** a persistent microphone control with status text.
- **Global states:**
  - loading skeletons for every data screen
  - an error banner with retry
  - a "queued" state for AI calls waiting on the rate limiter, so a slow call never looks like a failure

---

## 6. Screens

### 6.1 Role-based dashboard
- Block layout by role (see the student layout below).
- **Student:** resume last work, four quick actions (ask, practise drafting, summarise a judgment, translate), practice drafting card, accuracy summary, saved library items, followed cases, upcoming dates.
- **Advocate:** active matters, next hearings, recent drafts, quick start for a skill.
- **Firm admin:** advocate view plus shared templates and team activity.
- **Citizen:** plain-language explainer, case status, notice templates.

### 6.2 Drafting Studio (core screen)
Three areas side by side:
- **Left, chat pane:** conversation with the drafting agent, skill picker above the input.
- **Centre, document editor (Tiptap):** the live draft. AI edits appear as suggestions the user accepts or rejects.
- **Right, verification panel:** separate and collapsible (see 6.3).

Flow:
1. Pick a skill (library or natural-language request).
2. Upload or pick a template and, optionally, a reference document (style source).
3. **Pre-draft check:** show the missing fields as a short form. The user answers before anything is generated.
4. Generate (streamed into the editor).
5. Review suggestions, run verification, export.

Details:
- Show `[MISSING]` and `[CITATION NEEDED]` markers visibly (highlighted) so nothing is silently invented.
- Show the learned style profile as a small, editable summary the user can correct.
- Confirm before overwriting an existing document.

### 6.3 Verification panel
- One row per citation or statute: status badge (verified, partial, unverified), the text, a source link when available, and a short note.
- Colours plus icons, never colour alone.
- **Legacy flag:** if a draft cites IPC, CrPC or the Evidence Act, show the suggested BNS, BNSS or BSA equivalent with a "confirm which applies" note.
- Click a row to jump to that place in the editor.
- Summary counts at the top (for example 8 verified, 2 partial, 1 unverified).

### 6.4 Research and Procedure Planner
- **Research chat:** every answer shows source cards with links.
- **Procedure Planner:** the user enters facts, forum and stage. Output is a roadmap: forum and jurisdiction, limitation, filings, hearing stages, interim relief, timeline.
  - Each step links to its rule or precedent, and uncertain steps are flagged.
  - Show retrieved similar proceedings first, then the roadmap.

### 6.5 Translation
- Language switch: Hindi, Gujarati (and English as the source or target).
- Side-by-side original and translation, with section numbers and citations left unchanged.
- Ask box: ask a question about the document and get the answer in the chosen language, as text and optionally spoken.
- Show a back-translation check result so the user can spot meaning drift.

### 6.6 Student Centre
- Practice drafting: one exercise at a time, then feedback from the verification layer.
- **AI live courtroom:** turn-based. The student types or speaks an argument and the AI replies as judge or opposing counsel. Show the case file in a side panel, the turn history, and a scorecard at the end (structure, use of authority, responsiveness, what to improve).
- Exam and moot mode: a question, the student's answer, and graded feedback.
- Accuracy summary: counts of verified, partial and unverified citations across the student's work, plus common mistakes.

### 6.7 Case tracker
- Search by CNR number.
- Case card: parties, court, status, next hearing.
- Timeline of hearings and orders, plus an AI summary of the latest order.
- Follow a case to add it to the dashboard.
- Works with cached demo data when the live source is unavailable; do not label demo data as live.

### 6.8 Library, Tools, Templates, Team
- **Library:** search Acts and judgments, section viewer, bookmarks, "ask about this" and "use in a draft" actions, and the old-to-new code mapper (IPC to BNS and so on).
- **Tools:** only the few that will be shown (for example document compare, limitation calculator, court-fee estimate).
- **Templates:** upload, preview and list templates.
- **Team (firm admin):** shared matters and templates.

---

## 7. Voice bar

- The voice agent runs through another gateway, so the frontend only needs to:
  1. Start and stop recording (or use the gateway's widget).
  2. Show live status: listening, transcribing, understanding, running.
  3. Show the recognised text in a toast so the user sees what was heard.
  4. Handle `needsConfirm`: for overwrite, delete and export, show a confirm dialog with a plain-language summary. Send the confirmation token back only after the user approves.
- Text-to-speech for translation answers can use the browser's speech output. Test that Hindi and Gujarati voices exist on the demo device, since availability varies.

---

## 8. Calling the backend

- One typed client in `lib/api.ts`. Types for requests and responses live in `lib/types.ts`.
- **Streaming:** use `fetch` with a `ReadableStream` reader for drafting and research. Append chunks to the editor or chat and handle cancellation.
- **Shared result shapes:**
  - Verification result: `status` (verified | partial | unverified), `raw`, `sourceUrl?`, `note?`
  - Pre-check result: `ready`, `missing[]` (field and question), `warnings[]`
  - Voice command: `action`, `target?`, `params`, `summary`, `needsConfirm?`, `token?`
- Handle HTTP 429 and the "daily budget used up" error with a friendly message, not a crash. The free Gemini tier is limited (about 10 requests per minute and 500 per day, so confirm the real numbers in the console).

---

## 9. Design system

- Minimal and professional: neutral background, one accent colour, plenty of white space.
- A restrained status palette: green (verified), amber (partial), red (unverified), plus icons for each.
- Typography: Inter for UI, Noto Sans Devanagari and Noto Sans Gujarati for translated text. Set explicit line height so Indic scripts do not clip.
- Dark mode is optional; skip it unless time remains.
- Responsive: desktop first (three-pane studio), with the verification panel as a slide-over on tablets and a tab on mobile.

---

## 10. Accessibility and quality

- Keyboard navigation for the editor, panel rows and dialogs.
- Status never conveyed by colour alone.
- Visible focus states and proper labels on every form field.
- Every screen has loading, empty and error states.
- A visible note on the upload screen: free-tier AI may use prompts for training, so use sample documents only.

---

## 11. Build order

1. Project setup, design tokens, app shell, login, `RoleGate`, typed API client
2. Drafting Studio: template upload, pre-draft form, streamed draft in the editor, export
3. Verification panel wired to the shared verification result
4. Translation screen (Hindi, Gujarati)
5. Role-based dashboard
6. Case tracker and library
7. Student Centre, AI courtroom, Procedure Planner screens
8. Voice bar and confirmation dialog, then polish

Do not start step 7 until the golden path in steps 1 to 4 works end to end.

---

## 12. Demo checklist

- [ ] Log in as a role and see only that role's modules
- [ ] Upload a reference document and a template
- [ ] Answer the pre-draft questions
- [ ] Watch the draft stream into the editor
- [ ] Review the verification panel, including one legacy IPC flag
- [ ] Translate to Hindi and Gujarati and ask a question in the chosen language
- [ ] Export the document
- [ ] Show the case tracker and the student courtroom if time allows

---

## 13. Open questions

- Who owns the dashboard, library and tools content: you alone, or do others contribute?
- What is the exact request and response shape for each AI endpoint? Agree it with the AI engineers before building screens against it.
- Which voice gateway is used, and does it provide its own UI widget or only an API?
- Which legal data source backs the library and the planner's case retrieval?
