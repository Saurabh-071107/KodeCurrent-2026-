import { describe, it } from 'node:test';
import assert from 'node:assert';
import { aiOrchestrator } from '../src/services/aiOrchestrator.service';

describe('AI Orchestrator Service Integration Tests', () => {

  // 1. NEXORA AI: Litigation Assistant
  it('NEXORA_ASSISTANT should return structured litigation strategy and grounds', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'NEXORA_ASSISTANT',
      query: 'How to seek quashing of FIR under Section 482 CrPC / 528 BNSS when dispute is purely civil and contractual?',
      context: 'Commercial contract for supply of goods where invoice payment was delayed.',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'NEXORA AI');
    assert.ok(res.data);
    assert.ok(res.data.summary || typeof res.data === 'string');
    assert.ok(Array.isArray(res.sourceReferences));
  });

  // 2. NEXORA AI: Live Courtroom Simulation
  it('NEXORA_COURTROOM_SIMULATION should return dual-compatible turn and evaluation schema', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'NEXORA_COURTROOM_SIMULATION',
      payload: {
        argument: 'My Lord, the applicant has fully cooperated with investigation and all documents are in custody of the IO.',
        scenario: {
          title: 'State v. Rohan Mehta',
          category: 'Criminal Law',
          actSection: 'Section 482 BNSS / 438 CrPC',
          facts: ['FIR registered under Section 307 IPC', 'No recovery pending from applicant']
        },
        court: 'High Court',
        difficulty: 'Realistic Cross-Bench',
        appearanceRole: 'Counsel for Applicant'
      }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'NEXORA AI');
    assert.ok(res.data.judgeResponse);
    assert.ok(res.data.turn && res.data.turn.message);
    assert.strictEqual(res.data.turn.sender, 'Judge');
    assert.ok(res.data.score && typeof res.data.score.clarity === 'number');
    assert.ok(Array.isArray(res.data.strengths));
    assert.ok(Array.isArray(res.data.critique));
  });

  // 3. BAR AI: Statutory Search
  it('BAR_STATUTE_SEARCH should retrieve statutory provisions for Section 138 NI Act', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'BAR_STATUTE_SEARCH',
      query: 'Section 138 Negotiable Instruments Act cheque dishonour',
      payload: { searchTerm: 'Section 138' }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'BAR AI');
    assert.ok(res.data);
    assert.ok(res.data.sectionAnalysis || res.data.acts);
  });

  // 4. BAR AI: Case Law Precedent Research
  it('BAR_CASE_RESEARCH should return authoritative citations and statutory references', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'BAR_CASE_RESEARCH',
      query: 'anticipatory bail guidelines and conditions precedent',
      context: 'Applicant apprehending arrest in non-bailable case'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'BAR AI');
    assert.ok(res.data.answer);
    assert.ok(Array.isArray(res.data.citations));
    assert.ok(Array.isArray(res.data.statutes));
  });

  // 5. BAR AI: Citation Verification
  it('BAR_CITATION_VERIFY should cross-verify statutory and judicial references', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'BAR_CITATION_VERIFY',
      payload: {
        text: 'The petition is filed under Section 482 of the Code of Criminal Procedure, 1973 in terms of State of Haryana v. Bhajan Lal.',
        citations: ['State of Haryana v. Bhajan Lal']
      }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'BAR AI');
    assert.ok(res.data.results);
    assert.ok(res.data.summary);
  });

  // 6. NEXORA AI: Deterministic Exam Evaluation
  it('NEXORA_EXAM_EVAL should grade multiple-choice answers deterministically', async () => {
    const questions = [
      {
        id: 1,
        question: 'Under which provision of BNSS 2023 has anticipatory bail been codified?',
        options: ['Section 480 BNSS', 'Section 482 BNSS', 'Section 484 BNSS', 'Section 490 BNSS'],
        correctIndex: 1
      },
      {
        id: 2,
        question: 'What is the limitation period for filing Written Statement under Order VIII Rule 1 CPC?',
        options: ['15 days', '30 days, extendable to 90 days', '60 days', '120 days'],
        correctIndex: 1
      }
    ];

    const answers = {
      1: 1, // Correct
      2: 0  // Incorrect
    };

    const res = await aiOrchestrator.executeTask({
      taskType: 'NEXORA_EXAM_EVAL',
      payload: {
        testId: 'test-demo-1',
        answers,
        questions
      }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'NEXORA AI');
    assert.strictEqual(res.data.isDeterministic, true);
    assert.strictEqual(res.data.totalScore, 1);
    assert.strictEqual(res.data.maxScore, 2);
    assert.strictEqual(res.data.percentage, 50);
  });

  // 7. Combined Workflow: BAR AI + NEXORA AI Moot Memorial
  it('COMBINED_MOOT_WORKFLOW should retrieve legal sources and formulate memorial grounds', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'COMBINED_MOOT_WORKFLOW',
      payload: {
        topic: 'Maintainability of Writ Petition under Article 32 regarding Environmental Rights',
        facts: 'Municipal corporation cleared notified urban green belt without statutory approvals.',
        side: 'petitioner',
        jurisdictionName: 'Supreme Court of India'
      }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.aiSystem, 'NEXORA AI + BAR AI');
    assert.ok(res.data.memorial);
    assert.ok(res.data.memorial.statementOfJurisdiction);
    assert.ok(res.data.memorial.argumentsAdvanced);
    assert.ok(res.data.memorial.prayer);
    assert.ok(Array.isArray(res.sourceReferences));
  });

});
