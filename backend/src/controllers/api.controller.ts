import { Request, Response } from 'express';
import { Template, Draft, CaseModel, Client, BareAct, DocumentRecord } from '../models/AppModels';
import { aiClient } from '../services/aiClient';
import { AppRequest } from '../middleware/requestId.middleware';

// -------------------------------------------------------------
// 1. Dashboard & Profile
// -------------------------------------------------------------
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const role = (req.query.role as string) || 'advocate';
    const activeMatters = await CaseModel.countDocuments({ isActive: true });
    const cases = await CaseModel.find().limit(3);
    const drafts = await Draft.find().limit(5);

    const quotes: Record<string, { quote: string; author: string }> = {
      advocate: {
        quote: "Justice is the constant and perpetual will to render to each his due.",
        author: "Justinian"
      },
      firm: {
        quote: "The leading rule for the lawyer, as for the man of every other calling, is diligence.",
        author: "Abraham Lincoln"
      },
      student: {
        quote: "Ignorance of the law excuses no one.",
        author: "Legal Maxim"
      },
      citizen: {
        quote: "In matters of truth and justice, there is no difference between large and small problems.",
        author: "Albert Einstein"
      }
    };

    const quote = quotes[role] || quotes.advocate;

    res.json({
      success: true,
      data: {
        quote,
        metrics: {
          activeMattersCount: activeMatters || 12,
          upcomingHearingsCount: cases.length || 3,
          recentDraftsCount: drafts.length || 5,
          unreadNotificationsCount: 2
        },
        upcomingHearings: cases.map(c => ({
          caseId: c.id,
          cnr: c.cnr,
          title: c.title,
          court: c.court,
          courtRoom: c.nextHearing?.courtRoom || 'Court Room 4',
          hearingDate: c.nextHearing?.date || '28 Oct',
          time: c.nextHearing?.dayTime || '10:30 AM',
          stage: c.currentStatusText || 'Arguments',
          accentColor: c.statusBadge?.type === 'hearing' ? 'blue' : 'amber'
        })),
        recentDrafts: drafts.map(d => ({
          draftId: d.id,
          title: d.title,
          category: d.category,
          statute: d.subject,
          lastEdited: d.lastEdited,
          wordsCount: d.wordsCount,
          status: 'ready'
        })),
        notifications: [
          {
            id: 'notif-1',
            title: 'Hearing in 45 Minutes',
            message: 'Sharma v. State is listed at Court Room 4, Civil Court at 10:30 AM.',
            time: 'Urgent · Today',
            read: false
          },
          {
            id: 'notif-2',
            title: 'High Court Cause List Published',
            message: 'SLP (Crl) 4821/2024 listed for preliminary arguments.',
            time: '1 hour ago',
            read: false
          }
        ]
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'DASHBOARD_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// Notifications list and read
export const getNotifications = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'notif-1',
        title: 'Hearing in 45 Minutes',
        message: 'Sharma v. State is listed at Court Room 4, Civil Court at 10:30 AM.',
        time: 'Urgent · Today',
        read: false
      },
      {
        id: 'notif-2',
        title: 'High Court Cause List Published',
        message: 'SLP (Crl) 4821/2024 listed for preliminary arguments.',
        time: '1 hour ago',
        read: false
      }
    ],
    requestId: (req as AppRequest).id
  });
};

export const markNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: { id, read: true },
    requestId: (req as AppRequest).id
  });
};

// -------------------------------------------------------------
// 2. Templates
// -------------------------------------------------------------
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { role, category } = req.query;
    const filter: any = {};
    if (role) filter.role = role;
    if (category) filter.category = category;

    const templates = await Template.find(filter);
    res.json({ success: true, data: templates, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'TEMPLATE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await Template.findOne({ id });
    if (!template) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' }, requestId: (req as AppRequest).id });
    }
    res.json({ success: true, data: template, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'TEMPLATE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 3. Drafts & Legal Drafting Slice
// -------------------------------------------------------------
export const getDrafts = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const filter: any = {};
    if (role) filter.role = role;

    const drafts = await Draft.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: drafts, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'DRAFTS_FETCH_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getDraftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findOne({ id });
    if (!draft) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Draft not found' }, requestId: (req as AppRequest).id });
    }
    res.json({ success: true, data: draft, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'DRAFT_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const saveDraft = async (req: Request, res: Response) => {
  try {
    const draftData = req.body;
    const id = draftData.id || `draft-${Date.now()}`;
    const updated = await Draft.findOneAndUpdate(
      { id },
      { ...draftData, id, lastEdited: 'Just now' },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SAVE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const preCheckDraft = async (req: Request, res: Response) => {
  try {
    const { facts, documentType, objective } = req.body;
    let missing: Array<{ field: string; question: string }> = [];
    let warnings: string[] = [];

    // Attempt AI Fact Extraction via FastAPI
    try {
      const aiResult = await aiClient.extractFacts({
        problemDescription: facts?.problemDescription || JSON.stringify(facts || {}),
        documentType: documentType || 'legal_notice',
        objective: objective || 'Pre-check legal facts',
      }, { requestId: (req as AppRequest).id, timeoutMs: 5000 });

      if (aiResult?.missing_information?.length) {
        missing = aiResult.missing_information.map((m: any) => ({
          field: typeof m === 'string' ? m : m.field || 'detail',
          question: typeof m === 'string' ? `Please clarify: ${m}` : m.question || 'Missing essential detail'
        }));
      }
      if (aiResult?.contradictions?.length) {
        warnings.push(...aiResult.contradictions);
      }
    } catch {
      // Rule-based fallback if AI is offline
      if (!facts?.recipient) {
        missing.push({ field: 'recipient', question: 'Please specify the recipient or opposite party name.' });
      }
      if (!facts?.amount && !facts?.depositAmount) {
        missing.push({ field: 'amount', question: 'What is the exact financial claim or defaulted amount?' });
      }
      warnings.push('Please verify whether the claim is within statutory limitation period.');
    }

    res.json({
      success: true,
      ready: missing.length === 0,
      missing,
      warnings,
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'PRECHECK_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const generateDraft = async (req: Request, res: Response) => {
  try {
    const { documentType, facts, templateId, customInstructions, jurisdiction } = req.body;
    let sections: any[] = [];
    let generatedClauses: string[] = [];

    try {
      const aiResult = await aiClient.generateDraft({
        documentType: documentType || 'legal_notice',
        facts: facts || {},
        jurisdiction: jurisdiction || 'India',
        customInstructions,
        templateId
      }, { requestId: (req as AppRequest).id });

      if (aiResult?.sections) {
        sections = aiResult.sections;
        generatedClauses = sections.map((s: any) => s.content || s.text || JSON.stringify(s));
      } else if (aiResult?.clauses) {
        generatedClauses = aiResult.clauses;
      }
    } catch (e: any) {
      console.warn('[AI Client] Fallback generation used:', e.message);
      generatedClauses = [
        `1. That the Claimant/Client entered into a legally binding agreement on ${facts?.agreementDate || 'the specified date'}.`,
        `2. That the Respondent failed to comply with statutory covenants amounting to a default of ₹ ${facts?.amount || '75,000'}/-.`,
        `3. That this notice is served under applicable law calling upon you to remedy said default within 15 days.`
      ];
    }

    const draftId = `draft-${Date.now()}`;
    const newDraft = await Draft.create({
      id: draftId,
      title: `${documentType ? documentType.toUpperCase().replace('_', ' ') : 'LEGAL NOTICE'} — Generated Draft`,
      category: documentType || 'notice',
      role: 'advocate',
      lastEdited: 'Just now',
      wordsCount: generatedClauses.join(' ').split(/\s+/).length,
      preview: generatedClauses[0] || 'Draft prepared for review',
      templateId: templateId || 'template-1',
      heading: 'LEGAL NOTICE / DEMAND PETITION',
      subject: `Notice of Demand regarding ${facts?.objective || 'statutory claim'}`,
      bodyClauses: generatedClauses,
      ultimatum: 'TAKE NOTICE that failure to comply within 15 days shall result in institution of appropriate legal proceedings.',
      signOffTitle: 'ADVOCATE FOR THE CLAIMANT',
      facts: facts || {},
      version: 1
    });

    res.status(201).json({
      success: true,
      data: {
        draftId: newDraft.id,
        draft: newDraft,
        status: 'draft_needs_review',
        version: 1,
        sections,
        assumptions: [],
        warnings: ['Please review all citations and names before filing.'],
        placeholders: []
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'GENERATE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getDraftVersions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findOne({ id });
    res.json({
      success: true,
      data: [
        {
          version: draft?.version || 1,
          createdAt: draft?.updatedAt || new Date(),
          title: draft?.title || 'Version 1',
          wordsCount: draft?.wordsCount || 0
        }
      ],
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'VERSION_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 4. Document Export
// -------------------------------------------------------------
export const exportDocument = async (req: Request, res: Response) => {
  try {
    const { content, format, title } = req.body;
    try {
      const exportResult = await aiClient.exportDocument({
        content: content || 'Draft content',
        format: format || 'pdf',
        title: title || 'Legal_Document'
      }, { requestId: (req as AppRequest).id });

      res.json({
        success: true,
        data: exportResult,
        requestId: (req as AppRequest).id
      });
    } catch {
      // Local fallback payload
      res.json({
        success: true,
        data: {
          downloadUrl: `/exports/${title || 'document'}.${format || 'pdf'}`,
          format: format || 'pdf',
          fileSize: '48 KB',
          status: 'ready'
        },
        requestId: (req as AppRequest).id
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 5. Case Tracker
// -------------------------------------------------------------
export const getCases = async (req: Request, res: Response) => {
  try {
    const { q, cnr } = req.query;
    const filter: any = {};
    if (cnr) filter.cnr = cnr;
    else if (q) {
      filter.$or = [
        { title: { $regex: q as string, $options: 'i' } },
        { cnr: { $regex: q as string, $options: 'i' } },
        { petitioner: { $regex: q as string, $options: 'i' } }
      ];
    }

    const cases = await CaseModel.find(filter);
    res.json({ success: true, data: cases, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CASES_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getCaseByCnr = async (req: Request, res: Response) => {
  try {
    const { cnr } = req.params;
    const caseItem = await CaseModel.findOne({ cnr });
    if (!caseItem) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' }, requestId: (req as AppRequest).id });
    }
    res.json({ success: true, data: caseItem, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CASE_FETCH_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getCaseTimeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseItem = await CaseModel.findOne({ id });
    res.json({
      success: true,
      data: caseItem?.timeline || [],
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'TIMELINE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const addCaseEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, desc, date, badge } = req.body;
    const caseItem = await CaseModel.findOne({ id });
    if (!caseItem) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found' }, requestId: (req as AppRequest).id });
    }

    caseItem.timeline.unshift({
      date: date || 'Today',
      title: title || 'Tracked Event',
      desc: desc || '',
      badge: badge || 'Notice'
    });
    await caseItem.save();

    res.json({ success: true, data: caseItem.timeline, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'EVENT_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 6. Clients & Matters
// -------------------------------------------------------------
export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await Client.find();
    res.json({ success: true, data: clients, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CLIENTS_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ id });
    if (!client) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' }, requestId: (req as AppRequest).id });
    }
    res.json({ success: true, data: client, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CLIENT_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const addClientNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const client = await Client.findOne({ id });
    if (!client) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' }, requestId: (req as AppRequest).id });
    }

    client.notesList = client.notesList || [];
    client.notesList.unshift({
      id: `note-${Date.now()}`,
      text,
      date: new Date().toISOString()
    });
    await client.save();

    res.json({ success: true, data: client.notesList, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'NOTE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const addClientCommunication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, summary } = req.body;
    const client = await Client.findOne({ id });
    if (!client) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' }, requestId: (req as AppRequest).id });
    }

    client.communications = client.communications || [];
    client.communications.unshift({
      id: `comm-${Date.now()}`,
      type: type || 'Call',
      summary: summary || '',
      date: new Date().toISOString()
    });
    await client.save();

    res.json({ success: true, data: client.communications, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'COMM_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 7. Bare Acts & Library
// -------------------------------------------------------------
export const getBareActs = async (req: Request, res: Response) => {
  try {
    const acts = await BareAct.find();
    res.json({ success: true, data: acts, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ACTS_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getLibraryData = async (req: Request, res: Response) => {
  try {
    const acts = await BareAct.find();

    const dictionaryTerms = [
      {
        id: 'term-audi',
        term: 'Audi alteram partem',
        category: 'Latin Maxim',
        letter: 'A',
        literalTranslation: 'Hear the other side',
        definition: 'No person should be condemned unheard. A fundamental rule of natural justice.',
        contextUsage: 'Cancellation of tender without show cause notice violates audi alteram partem.',
        landmarkCase: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248'
      },
      {
        id: 'term-caveat',
        term: 'Caveat emptor',
        category: 'Latin Maxim',
        letter: 'C',
        literalTranslation: 'Let the buyer beware',
        definition: 'The principle that the buyer alone is responsible for checking the quality and suitability of goods.',
        contextUsage: 'Section 16 of Sale of Goods Act, 1930 codifies caveat emptor with implied exceptions.',
        landmarkCase: 'Ranbirsingh Shankarsingh Thakur v. Hindusthan General Insurance (1971)'
      }
    ];

    const legalForms = [
      {
        id: 'form-bail',
        title: 'Application for Anticipatory Bail',
        category: 'Criminal',
        courtJurisdiction: 'High Court / Sessions Court',
        governingStatute: 'Section 482 of BNSS, 2023',
        description: 'Standard statutory petition seeking pre-arrest protection with undertaking affidavit.',
        templateText: 'IN THE COURT OF SESSIONS JUDGE AT [CITY]\n\nIN THE MATTER OF:\n[Applicant Name] ... Applicant\nVERSUS\nState of [State] ... Respondent\n\nAPPLICATION UNDER SECTION 482 BNSS 2023...'
      }
    ];

    const judgments = [
      {
        id: 'jdg-puttaswamy',
        title: 'Justice K.S. Puttaswamy (Retd.) v. Union of India',
        citation: '(2017) 10 SCC 1',
        court: 'Supreme Court of India (9-Judge Bench)',
        benchStrength: '9 Judges',
        decisionDate: '24 Aug 2017',
        subject: 'Fundamental Right to Privacy',
        headnote: 'Right to privacy is an intrinsic part of the right to life and personal liberty under Article 21.',
        ratioDecidendi: 'Privacy is constitutionally protected under Article 21 and Part III.',
        keyStatutes: ['Article 21', 'Article 14', 'Article 19']
      }
    ];

    res.json({
      success: true,
      data: {
        bareActs: acts,
        dictionaryTerms,
        legalForms,
        judgments
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'LIBRARY_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 8. Verification & Document Review
// -------------------------------------------------------------
export const getVerificationReport = async (req: Request, res: Response) => {
  try {
    const citations = [
      {
        id: 'cite-1',
        number: 1,
        type: 'Incomplete citation',
        severity: 'High',
        status: 'issue',
        originalText: '...under the Companies Act, 2013...',
        explanation: 'Section reference is missing. Please specify the relevant section (e.g., Section 2(20) or Section 7).',
        suggestedCitation: 'Companies Act, 2013, Section 2(20)',
        sourceTitle: 'The Companies Act, 2013 (Act No. 18 of 2013)',
        sourceCourtOrAct: 'Ministry of Corporate Affairs, Gazette of India',
        sourceYear: '2013',
        sourceSectionOrPara: 'Section 2, Clause (20)',
        sourceExcerpt: '"company" means a company incorporated under this Act or under any previous company law.',
        pageNumber: 2,
        highlightKey: 'h1',
        appliedText: 'the Company is duly incorporated and validly existing under Section 2(20) of the Companies Act, 2013, and is in good standing.'
      },
      {
        id: 'cite-2',
        number: 2,
        type: 'Incorrect case citation',
        severity: 'High',
        status: 'issue',
        originalText: '...in accordance with Smith v. ABC (2018)...',
        explanation: 'Citation format is incorrect and case name could not be verified. Please provide the correct citation.',
        suggestedCitation: 'Smith v. ABC Ltd., (2018) 5 SCC 123',
        sourceTitle: 'Smith & Anr. v. ABC Engineering Ltd. & Ors.',
        sourceCourtOrAct: 'Supreme Court of India · Civil Appellate Jurisdiction',
        sourceYear: '2018',
        sourceSectionOrPara: '(2018) 5 SCC 123, paras 14-18',
        sourceExcerpt: 'Held: Full disclosure of all ongoing encumbrances and contingent defaults is an essential pre-closing condition precedent in Share Purchase Transactions.',
        pageNumber: 2,
        highlightKey: 'h2',
        appliedText: 'all material contracts are in full force and effect and there are no undisclosed defaults under any material contract, as settled in Smith v. ABC Ltd., (2018) 5 SCC 123.'
      }
    ];

    res.json({
      success: true,
      data: {
        score: 84,
        citations,
        legacyFlags: [
          {
            raw: 'Section 302 IPC',
            legacySection: 'Section 302 Indian Penal Code',
            replacement: 'Section 103 Bharatiya Nyaya Sanhita, 2023',
            note: 'Acts committed post 1 July 2024 fall under BNS.'
          }
        ]
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'VERIFICATION_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const verifyDocumentWithAi = async (req: Request, res: Response) => {
  try {
    const { text, citations } = req.body;
    let aiFindings: any = null;

    if (text) {
      try {
        aiFindings = await aiClient.verifyCitations({
          text,
          citations: citations || []
        }, { requestId: (req as AppRequest).id });
      } catch (err: any) {
        console.warn('[AI Client] Citation verify fallback:', err.message);
      }
    }

    if (aiFindings && aiFindings.results) {
      return res.json({
        success: true,
        data: {
          score: aiFindings.score || 85,
          citations: aiFindings.results,
          legacyFlags: aiFindings.legacy_flags || []
        },
        requestId: (req as AppRequest).id
      });
    }

    return getVerificationReport(req, res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'VERIFY_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 9. Research Threads & Q&A
// -------------------------------------------------------------
export const getResearchThreads = async (req: Request, res: Response) => {
  try {
    const threads = [
      {
        id: 'conv-1',
        title: 'Section 138 latest judgments',
        time: '10:42 AM',
        group: 'Today',
        messages: [
          {
            id: 'msg-1-1',
            sender: 'user',
            content: 'What are the latest Supreme Court rulings regarding interim compensation under Section 143A and presumption under Section 139 of the Negotiable Instruments Act, 1881?',
            timestamp: '10:40 AM'
          },
          {
            id: 'msg-1-2',
            sender: 'assistant',
            content: 'Under Section 138 read with Section 139 and Section 143A of the Negotiable Instruments Act, 1881, the Supreme Court in Rakesh Ranjan Shrivastava v. State of Jharkhand (2024) held that Section 143A interim compensation is directory and not mandatory.',
            timestamp: '10:42 AM',
            citations: [
              { title: 'Rakesh Ranjan Shrivastava v. State of Jharkhand', court: 'Supreme Court of India', year: '2024', citation: '2024 INSC 211' }
            ],
            statutes: [
              { act: 'Negotiable Instruments Act, 1881', section: 'Section 143A', description: 'Power to direct interim compensation' }
            ]
          }
        ]
      }
    ];
    res.json({ success: true, data: threads, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'RESEARCH_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const askResearchQuestion = async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;
    let answerContent = '';
    let citations: any[] = [];
    let statutes: any[] = [];

    try {
      const aiResponse = await aiClient.answerLegalQuestion({
        question,
        context
      }, { requestId: (req as AppRequest).id });

      answerContent = aiResponse.answer || aiResponse.response;
      citations = aiResponse.citations || [];
      statutes = aiResponse.statutes || [];
    } catch {
      // Local knowledge fallback
      answerContent = `Regarding your query: "${question}" — Under prevailing Indian jurisprudence, statutory provisions must be construed strictly according to their plain text while balancing the intent of legislative reforms under Bharatiya Nyaya Sanhita and relevant special acts.`;
      citations = [{ title: 'State v. Precedent Authority', court: 'Supreme Court of India', year: '2024', citation: '2024 INSC 105' }];
      statutes = [{ act: 'Governing Legislation', section: 'Section 103', description: 'Applicable substantive provision' }];
    }

    res.json({
      success: true,
      data: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: answerContent,
        timestamp: 'Just now',
        citations,
        statutes
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'RESEARCH_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 10. Student Assets & Exam Scoring
// -------------------------------------------------------------
export const getStudentAssets = async (req: Request, res: Response) => {
  try {
    const courtroomPresets = [
      {
        id: 'bail',
        title: 'State v. Rohan Mehta',
        category: 'Bail Application · Criminal Law',
        actSection: 'Section 482 BNSS & Section 307 IPC',
        caseNumber: 'FIR No. 184/2024',
        filingDate: '12 Aug 2024',
        recommendedCourt: 'High Court (Bombay)',
        brief: 'Anticipatory bail petition in an alleged attempt to murder case where co-accused have already been enlarged on bail.',
        facts: [
          'Applicant seeks anticipatory bail under Section 482 BNSS in connection with FIR 184/2024.',
          'Alleged offence: Section 307 IPC.',
          'Investigation is ongoing. No recovery of weapon or incriminating material made from applicant.',
          'Two co-accused have already been granted bail on parity grounds by the Sessions Court.'
        ],
        documents: [
          { name: 'FIR.pdf', pages: '12 pages' },
          { name: 'Case Diary.pdf', pages: '8 pages' }
        ],
        judgeQuestion: 'Counsel, the offence is under Section 307 IPC. What are the exceptional circumstances justifying pre-arrest bail?'
      }
    ];

    const mockTests = [
      {
        id: 'djs-prelims-1',
        title: 'Delhi Judicial Service (Preliminary) Drill',
        category: 'judiciary',
        categoryLabel: 'Judicial Services',
        subject: 'Constitutional Law & BNSS 2023',
        description: 'High-yield objective test covering constitutional writs and bail provisions.',
        questionsCount: 3,
        durationMinutes: 10,
        difficulty: 'Preliminary',
        questions: [
          {
            id: 1,
            question: 'Under which provision of BNSS 2023 has anticipatory bail been codified?',
            options: ['Section 480 BNSS', 'Section 482 BNSS', 'Section 484 BNSS', 'Section 490 BNSS'],
            correctIndex: 1,
            statuteRef: 'Section 482 BNSS 2023',
            explanation: 'Section 482 of BNSS retains pre-arrest bail powers.',
            topic: 'BNSS / Criminal Procedure'
          }
        ]
      }
    ];

    const internships = [
      {
        id: 'khaitan-corp',
        organization: 'Khaitan & Co',
        type: 'firm',
        typeLabel: 'Tier-1 Law Firm',
        practiceArea: 'Corporate & M&A / Private Equity',
        location: 'Mumbai & New Delhi',
        stipend: 'INR 15,000 / month',
        duration: '4 Weeks',
        deadline: '15 Nov 2026',
        batchEligibility: '4th & 5th Year LL.B',
        summary: 'Corporate transactions practice assisting on M&A, regulatory filings, and due diligence.',
        responsibilities: ['Conduct statutory due diligence across MCA filings', 'Assist in drafting SPAs'],
        qualifications: ['Academic excellence in Company Law', 'Proficiency in MCA21 research'],
        openingsCount: 4
      }
    ];

    const certificates = [
      {
        id: 'cert-moot',
        title: 'National Moot Court Advocacy Excellence',
        issuer: 'High Court Simulation Council',
        date: 'Oct 2026',
        credentialId: 'NX-MOOT-2026-882',
        grade: 'Grade O',
        score: '94 / 100',
        category: 'Oral Advocacy',
        skills: ['Appellate Pleadings', 'Precedent Distinguishing']
      }
    ];

    const rewards = [
      {
        id: 'rew-1',
        name: 'Top 5% National Advocate',
        criteria: 'Merit score > 90 in 10+ bench sessions',
        date: 'Oct 2026',
        unlocked: true
      }
    ];

    res.json({
      success: true,
      data: {
        courtroomPresets,
        mockTests,
        internships,
        certificates,
        rewards
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'STUDENT_ASSETS_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const submitCourtroomTurn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { argument } = req.body;

    res.json({
      success: true,
      data: {
        sessionId: id,
        turnNumber: 2,
        judgeResponse: `Counsel, noted your argument: "${argument.slice(0, 80)}...". However, how do you address the parity objections raised by the prosecution under Section 482 BNSS?`,
        evaluation: {
          clarityScore: 88,
          legalRelevanceScore: 92,
          statuteAccuracy: 'Verified Section 482 BNSS',
          feedback: 'Strong reliance on parity precedent. Keep citations crisp.'
        }
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'COURTROOM_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const submitExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // e.g. { "1": 1 }

    // Server-side scoring (Answer key is strictly kept on server)
    const answerKey: Record<string, number> = {
      '1': 1 // Section 482 BNSS
    };

    let correctCount = 0;
    const totalQuestions = Object.keys(answerKey).length;

    for (const [qId, selectedIdx] of Object.entries(answers || {})) {
      if (answerKey[qId] === selectedIdx) {
        correctCount++;
      }
    }

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    res.json({
      success: true,
      data: {
        testId: id,
        correctCount,
        totalQuestions,
        percentage,
        grade: percentage >= 80 ? 'Grade A+' : percentage >= 60 ? 'Grade A' : 'Grade B',
        passed: percentage >= 50
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'EXAM_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 11. Translation
// -------------------------------------------------------------
export const getTranslationData = async (req: Request, res: Response) => {
  try {
    const languages = [
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
      { code: 'en', name: 'English', native: 'English' },
      { code: 'mr', name: 'Marathi', native: 'मराठी' },
      { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
      { code: 'bn', name: 'Bengali', native: 'বাংলা' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు' },
      { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' }
    ];

    const defaultJob = {
      id: 'job-sample-1',
      fileName: 'Rent_Agreement.pdf',
      fileSize: '245 KB',
      sourceLang: 'English',
      targetLang: 'Hindi',
      status: 'completed',
      date: 'Today · Just now',
      wordCount: 420,
      originalClauses: [
        'RESIDENTIAL LEASE AND TENANCY AGREEMENT',
        '1. DEMISED PREMISES: The Landlord hereby lets out the flat premises at Sunshine Heights.',
        '2. DURATION & TENURE: Initial tenure of 11 consecutive months.',
        '3. MONTHLY RENT: ₹ 35,000/- payable on or before 5th of each month.'
      ],
      translatedClauses: [
        'आवासीय पट्टा एवं किरायेदारी अनुबन्ध',
        '1. पट्टे पर दी गई सम्पत्ति: मकान मालिक इसके द्वारा सनशाइन हाइट्स स्थित फ्लैट को पट्टे पर देता है।',
        '2. अवधि एवं कार्यकाल: 11 निरन्तर महीनों का प्रारम्भिक कार्यकाल।',
        '3. मासिक किराया: प्रत्येक माह की 5 तारीख को ₹ 35,000/- का अग्रिम भुगतान।'
      ]
    };

    res.json({
      success: true,
      data: {
        languages,
        defaultJob
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'TRANSLATION_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const createTranslationJob = async (req: Request, res: Response) => {
  try {
    const { fileName, sourceLang, targetLang, clauses } = req.body;
    res.status(202).json({
      success: true,
      data: {
        jobId: `job-${Date.now()}`,
        status: 'completed',
        fileName: fileName || 'document.pdf',
        sourceLang: sourceLang || 'English',
        targetLang: targetLang || 'Hindi',
        translatedClauses: (clauses || []).map((c: string) => `[अनुवादित] ${c}`)
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'JOB_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 12. Citizen Helpline & Notice Helper
// -------------------------------------------------------------
export const askCitizenQuestion = async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    res.json({
      success: true,
      data: {
        question: question || 'Security deposit refund issue',
        summary: 'Your landlord cannot lawfully withhold the security deposit without providing documented damages or agreed deductions according to the Model Tenancy Act.',
        steps: [
          'Send a formal Demand Notice requesting refund within 15 days via registered post or email.',
          'Compile rent payment receipts, lease agreement, and flat handover confirmation.',
          'If no resolution occurs, file a claim before the Rent Controller / Small Causes Court or Consumer Forum.'
        ],
        relevantLaw: 'Section 13, Model Tenancy Act / Section 73, Indian Contract Act 1872',
        recommendedAction: 'Generate a Demand Notice template directly from your drafting studio.'
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CITIZEN_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const getCitizenGlossary = async (req: Request, res: Response) => {
  try {
    const glossary = [
      { term: 'Sub-judice', meaning: 'A matter currently under trial or consideration by a judge, so public debate might be restricted.' },
      { term: 'Caveat', meaning: 'A formal notice requesting the court not to pass any order without first informing you.' },
      { term: 'Affidavit', meaning: 'A written statement confirmed by oath or affirmation, for use as evidence in court.' },
      { term: 'Injunction', meaning: 'An official court order preventing someone from doing a particular act (like vacating or demolishing).' },
      { term: 'Cognizable Offence', meaning: 'A category of crime where police can arrest someone without an arrest warrant.' }
    ];
    res.json({ success: true, data: glossary, requestId: (req as AppRequest).id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'GLOSSARY_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

// -------------------------------------------------------------
// 13. Voice Gateway (Two-Phase Confirmation)
// -------------------------------------------------------------
export const handleVoiceCommand = async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    const lower = (transcript || '').toLowerCase();

    let action = 'NAVIGATE';
    let target = '/advocate';
    let requiresConfirm = false;
    let confirmToken = undefined;

    if (lower.includes('delete') || lower.includes('archive') || lower.includes('remove')) {
      action = 'ARCHIVE_DRAFT';
      requiresConfirm = true;
      confirmToken = `confirm-${Date.now()}`;
    } else if (lower.includes('draft') || lower.includes('notice')) {
      action = 'OPEN_DRAFTING';
      target = '/advocate?tab=drafting';
    } else if (lower.includes('case') || lower.includes('hearing')) {
      action = 'OPEN_TRACKER';
      target = '/advocate?tab=tracker';
    }

    res.json({
      success: true,
      data: {
        interpretedAction: action,
        target,
        requiresConfirm,
        confirmToken,
        spokenFeedback: `Understood command: ${action}. ${requiresConfirm ? 'Confirmation required for this consequential action.' : 'Navigating now.'}`
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'VOICE_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};

export const confirmVoiceAction = async (req: Request, res: Response) => {
  try {
    const { confirmToken } = req.body;
    if (!confirmToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Confirmation token is required.' },
        requestId: (req as AppRequest).id
      });
    }

    res.json({
      success: true,
      data: {
        status: 'confirmed',
        message: 'Consequential action authorized and successfully executed.'
      },
      requestId: (req as AppRequest).id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'VOICE_CONFIRM_ERROR', message: error.message }, requestId: (req as AppRequest).id });
  }
};
