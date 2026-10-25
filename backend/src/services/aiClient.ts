/**
 * DraftMate AI Adapter Service (Node.js -> FastAPI Bridge)
 * Maps Node application contracts to exact Python Pydantic schemas in draftmate-ai.
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '30000', 10);
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN || '';

export interface AiRequestOptions {
  requestId?: string;
  timeoutMs?: number;
}

export interface FactExtractionInput {
  problemDescription: string;
  documentType: string;
  jurisdiction?: string;
  objective: string;
  parties?: Array<{ name: string; role: string; address?: string }>;
  importantDates?: Array<{ date: string; description: string }>;
  context?: string;
}

export interface DraftGenerationInput {
  documentType: string;
  facts: any;
  jurisdiction?: string;
  customInstructions?: string;
  templateId?: string;
}

export interface CitationVerificationInput {
  text: string;
  citations?: string[];
  context?: string;
}

export interface ReviewDocumentInput {
  documentText: string;
  documentType?: string;
}

export interface RedlineInput {
  originalText: string;
  modifiedText: string;
}

export interface LegalAssistantInput {
  question: string;
  jurisdiction?: string;
  context?: string;
}

export interface ExportInput {
  content: string;
  format: 'docx' | 'pdf';
  title?: string;
}

class AiClient {
  private baseUrl: string;

  constructor(baseUrl: string = AI_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async post(endpoint: string, body: any, options: AiRequestOptions = {}): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || AI_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (options.requestId) headers['X-Request-Id'] = options.requestId;
      if (AI_SERVICE_TOKEN) headers['Authorization'] = `Bearer ${AI_SERVICE_TOKEN}`;

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`AI Service returned HTTP ${res.status}: ${errorText}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async get(endpoint: string, options: AiRequestOptions = {}): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || AI_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {};
      if (options.requestId) headers['X-Request-Id'] = options.requestId;
      if (AI_SERVICE_TOKEN) headers['Authorization'] = `Bearer ${AI_SERVICE_TOKEN}`;

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`AI Service returned HTTP ${res.status}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Health Checks
   */
  async checkHealth(): Promise<{ status: string; llmHealthy?: boolean }> {
    try {
      const basic = await this.get('/health', { timeoutMs: 3000 });
      return { status: basic.status || 'healthy', llmHealthy: true };
    } catch {
      return { status: 'offline', llmHealthy: false };
    }
  }

  /**
   * Fact Extraction (POST /facts)
   * Validates against FactExtractionRequest Pydantic schema
   */
  async extractFacts(input: FactExtractionInput, options?: AiRequestOptions): Promise<any> {
    const desc = input.problemDescription || '';
    const safeDesc = desc.trim().length >= 10 ? desc.trim() : `${desc.trim()} (Detailed factual statement required for extraction)`;
    const safeObjective = (input.objective || 'Prepare structured legal draft').trim();

    const payload = {
      problem_description: safeDesc,
      document_type: input.documentType || 'legal_notice',
      jurisdiction: input.jurisdiction || 'other',
      objective: safeObjective.length >= 5 ? safeObjective : 'Drafting review',
      parties: input.parties || [],
      important_dates: input.importantDates || [],
      context: input.context || undefined,
    };
    return this.post('/facts', payload, options);
  }

  /**
   * Draft Generation (POST /draft)
   * Requires FactExtractionResponse structure in facts
   */
  async generateDraft(input: DraftGenerationInput, options?: AiRequestOptions): Promise<any> {
    // If facts is already a FactExtractionResponse, use directly; otherwise adapt to schema
    const rawFacts = input.facts || {};
    const shapedFacts = rawFacts.user_provided_facts ? rawFacts : {
      user_provided_facts: [
        {
          fact: typeof rawFacts === 'string' ? rawFacts : JSON.stringify(rawFacts),
          source_text: 'User provided context',
          confidence: 1.0,
          is_assumption: false
        }
      ],
      inferred_facts: [],
      parties_and_roles: rawFacts.recipient ? [
        { name: rawFacts.recipient, role: 'respondent', confidence: 1.0, reasoning: 'Opposing party' }
      ] : [],
      important_dates: rawFacts.agreementDate ? [
        { date: rawFacts.agreementDate.slice(0, 10), description: 'Agreement Date', is_approximate: false }
      ] : [],
      desired_outcome: rawFacts.objective || 'Generate legal draft',
      missing_information: [],
      contradictions: [],
      follow_up_questions: [],
      assumptions: [],
      uncertainties: []
    };

    const payload = {
      document_type: input.documentType || 'legal_notice',
      facts: shapedFacts,
      jurisdiction: input.jurisdiction || 'other',
      custom_instructions: input.customInstructions || undefined,
      template_id: input.templateId || undefined,
    };
    return this.post('/draft', payload, options);
  }

  /**
   * Citation Verification (POST /citations/verify)
   * Adapts text into DraftResponse structure expected by CitationVerificationRequest
   */
  async verifyCitations(input: CitationVerificationInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      draft: {
        document_type: 'legal_notice',
        title: 'Document Citation Verification',
        sections: [
          {
            title: 'Substantive Clauses',
            content: input.text,
            order: 1,
            is_placeholder: false
          }
        ],
        assumptions: [],
        warnings: [],
        placeholders: [],
        review_status: 'ready_for_review',
        disclaimer: 'Verification check'
      },
      jurisdiction: 'other',
      citation_ids: input.citations || []
    };
    return this.post('/citations/verify', payload, options);
  }

  /**
   * Document Review (POST /review)
   */
  async reviewDocument(input: ReviewDocumentInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      draft: {
        document_type: input.documentType || 'legal_notice',
        title: 'Document for Review',
        sections: [
          {
            title: 'Content',
            content: input.documentText,
            order: 1,
            is_placeholder: false
          }
        ],
        assumptions: [],
        warnings: [],
        placeholders: [],
        review_status: 'ready_for_review',
        disclaimer: 'Review analysis'
      },
      facts: {
        user_provided_facts: [],
        inferred_facts: [],
        parties_and_roles: [],
        important_dates: [],
        desired_outcome: 'Document Review',
        missing_information: [],
        contradictions: [],
        follow_up_questions: [],
        assumptions: [],
        uncertainties: []
      },
      jurisdiction: 'other'
    };
    return this.post('/review', payload, options);
  }

  /**
   * Legal Assistant QA (POST /assistant/legal)
   */
  async answerLegalQuestion(input: LegalAssistantInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      question: input.question,
      jurisdiction: input.jurisdiction || 'other',
      context: input.context || undefined,
    };
    return this.post('/assistant/legal', payload, options);
  }

  /**
   * Export Document (POST /export)
   */
  async exportDocument(input: ExportInput, options?: AiRequestOptions): Promise<any> {
    const safeTitle = (input.title || 'Legal_Document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const payload = {
      draft: {
        document_type: 'legal_notice',
        title: input.title || 'Legal Document',
        sections: [
          {
            title: 'Document Body',
            content: input.content,
            order: 1,
            is_placeholder: false
          }
        ],
        assumptions: [],
        warnings: [],
        placeholders: [],
        review_status: 'ready_for_review',
        disclaimer: 'Exported legal document'
      },
      format: input.format,
      include_comments: false,
      include_changes_summary: false,
      filename: safeTitle
    };
    return this.post('/export', payload, options);
  }
}

export const aiClient = new AiClient();
