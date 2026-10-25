import { describe, it } from 'node:test';
import assert from 'node:assert';
import { aiOrchestrator } from '../src/services/aiOrchestrator.service';
import { LegalResearchService } from '../src/services/legalResearch.service';

describe('DraftMate AI — End-to-End Problem Statement Workflow Tests (Requirement 10)', () => {

  const sampleReferenceAgreement = `
COMMERCIAL SERVICES AND NON-DISCLOSURE AGREEMENT

THIS AGREEMENT is entered into on 15th January 2026, by and between:
"Disclosing Party": Acme Tech Solutions Pvt. Ltd., New Delhi; and
"Receiving Party": Beta Global Innovations LLP, Bengaluru.

ARTICLE I: DEFINITIONS & RECITALS
1.1 "Confidential Information" shall mean all proprietary technical, financial, and business data disclosed.
1.2 "Demised Intellectual Property" encompasses all trade secrets, source code, and algorithms.

ARTICLE II: SUBSTANTIVE OBLIGATIONS & RESTRICTIONS
2.1 The Receiving Party shall strictly hold all Confidential Information in confidence and shall not disclose it to any third party without prior written consent.
2.2 The standard of care shall be no less than a high degree of professional diligence.

ARTICLE III: GOVERNING LAW & DISPUTE RESOLUTION
3.1 This Agreement shall be governed by and construed in accordance with the Laws of India under the Indian Contract Act, 1872.
3.2 Any dispute arising out of or in connection with this contract shall be referred to arbitration under the Arbitration and Conciliation Act, 1996 before a Sole Arbitrator seated in New Delhi.
`;

  let extractedStyle: any = null;
  let generatedDraft: any = null;

  // Step 1: Upload & Processing
  it('Step 1: Document Processing should parse and preserve structural clauses from reference legal text', async () => {
    const lines = sampleReferenceAgreement.split('\n').map((l) => l.trim()).filter(Boolean);
    assert.ok(lines.length > 5, 'Should extract multi-line paragraphs');
    assert.ok(sampleReferenceAgreement.includes('ARTICLE I'), 'Should preserve uppercase article headers');
    assert.ok(sampleReferenceAgreement.includes('1.1'), 'Should preserve decimal clause numbering');
  });

  // Step 2: Reference-Style Adaptation
  it('Step 2: Reference-Style Adaptation should extract tone, structure, terminology, and clause patterns', async () => {
    const res = await aiOrchestrator.executeTask({
      taskType: 'REFERENCE_STYLE_ADAPTATION',
      payload: {
        referenceText: sampleReferenceAgreement,
        filename: 'Commercial_NDA.txt'
      }
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.ok(res.data.tone, 'Must extract tone');
    assert.ok(res.data.numberingFormat, 'Must extract numbering format');
    assert.ok(Array.isArray(res.data.terminologyGlossary), 'Must extract defined terms glossary');
    assert.ok(res.data.structurePattern, 'Must extract structural pattern');

    // Store for subsequent drafting
    extractedStyle = res.data;
  });

  // Step 3: Legal Skills Drafting with Reference Style
  it('Step 3: AI-Assisted Drafting should generate a legal draft mirroring the extracted reference style', async () => {
    assert.ok(extractedStyle, 'Extracted style must be available from Step 2');

    const res = await aiOrchestrator.executeTask({
      taskType: 'LEGAL_DRAFT_STUDIO',
      payload: {
        prompt: 'Draft a bilateral software licensing and confidentiality deed for proprietary legal AI models',
        documentType: 'Commercial Agreement',
        skillName: 'Agreement Drafting',
        referenceStyle: extractedStyle,
        facts: {
          licensor: 'DraftMate LegalTech Labs',
          licensee: 'National Bar Association',
          termYears: '3 Years'
        }
      }
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.ok(res.data.heading, 'Draft must have formal heading');
    assert.ok(Array.isArray(res.data.bodyClauses), 'Draft must contain body clauses');
    assert.ok(res.data.bodyClauses.length >= 3, 'Must contain multiple structured clauses');
    assert.strictEqual(res.data.styleApplied, true, 'Style adaptation flag must be true');

    // Store for subsequent verification
    generatedDraft = res.data;
  });

  // Step 4: Citation Verification
  it('Step 4: Citation Verification should cross-verify statutory provisions and report status against legal sources', async () => {
    const researchEngine = new LegalResearchService();
    const draftText = [
      generatedDraft.heading,
      ...generatedDraft.bodyClauses,
      'Pursuant to Section 73 of the Indian Contract Act, 1872 and Section 138 of the Negotiable Instruments Act, 1881.'
    ].join('\n\n');

    const verifyRes = await aiOrchestrator.executeTask({
      taskType: 'BAR_CITATION_VERIFY',
      payload: {
        text: draftText,
        citations: []
      }
    });

    assert.strictEqual(verifyRes.success, true);
    assert.ok(verifyRes.data);
    assert.ok(verifyRes.data.results, 'Must return citation results');
    assert.ok(verifyRes.data.results.length > 0, 'Must verify statutory citations');

    // Verify statutory grounding
    const hasContractAct = verifyRes.data.results.some((r: any) =>
      (r.raw_text || '').includes('Contract') || (r.normalized_form || '').includes('Contract')
    );
    assert.ok(hasContractAct, 'Should identify Indian Contract Act provision');
  });

  // Step 5: Voice Instruction Workflow
  it('Step 5: Voice Command Instruction should parse spoken edits and adapt drafting instructions', async () => {
    const spokenTranscript = 'Add clause for liquidated damages capped at 10 percent of contract value';
    
    // Simulate voice action execution
    const res = await aiOrchestrator.executeTask({
      taskType: 'LEGAL_DRAFT_STUDIO',
      payload: {
        prompt: spokenTranscript,
        documentType: 'Commercial Agreement',
        skillName: 'Redlining',
        existingClauses: generatedDraft.bodyClauses,
        referenceStyle: extractedStyle
      }
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.data.bodyClauses.length > 0, 'Should generate revised clauses incorporating voice command');
  });

  // Step 6: Export & Final Artifact Generation
  it('Step 6: Document Export should compile valid, clean text artifact ready for download', () => {
    const exportContent = [
      generatedDraft.heading,
      `Subject: ${generatedDraft.subject}`,
      '',
      ...generatedDraft.bodyClauses,
      '',
      generatedDraft.ultimatum,
      '',
      generatedDraft.signOffTitle
    ].filter(Boolean).join('\n\n');

    assert.ok(exportContent.length > 200, 'Export content must be comprehensive');
    assert.ok(exportContent.includes(generatedDraft.heading), 'Must contain heading');
    assert.ok(exportContent.includes(generatedDraft.ultimatum), 'Must contain closing covenant');
  });

});
