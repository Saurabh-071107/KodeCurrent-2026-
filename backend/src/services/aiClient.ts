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
   */
  async extractFacts(input: FactExtractionInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      problem_description: input.problemDescription,
      document_type: input.documentType || 'legal_notice',
      jurisdiction: input.jurisdiction || 'other',
      objective: input.objective,
      parties: input.parties || [],
      important_dates: input.importantDates || [],
      context: input.context,
    };
    return this.post('/facts', payload, options);
  }

  /**
   * Draft Generation (POST /draft)
   */
  async generateDraft(input: DraftGenerationInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      document_type: input.documentType,
      facts: input.facts,
      jurisdiction: input.jurisdiction || 'other',
      custom_instructions: input.customInstructions,
      template_id: input.templateId,
    };
    return this.post('/draft', payload, options);
  }

  /**
   * Citation Verification (POST /citations/verify)
   */
  async verifyCitations(input: CitationVerificationInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      text: input.text,
      citations: input.citations || [],
    };
    return this.post('/citations/verify', payload, options);
  }

  /**
   * Document Review (POST /review)
   */
  async reviewDocument(input: ReviewDocumentInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      document_text: input.documentText,
      document_type: input.documentType || 'legal_notice',
    };
    return this.post('/review', payload, options);
  }

  /**
   * Redline Generation (POST /redline)
   */
  async createRedline(input: RedlineInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      original_text: input.originalText,
      modified_text: input.modifiedText,
    };
    return this.post('/redline', payload, options);
  }

  /**
   * Legal Assistant QA (POST /assistant/legal)
   */
  async answerLegalQuestion(input: LegalAssistantInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      question: input.question,
      context: input.context,
    };
    return this.post('/assistant/legal', payload, options);
  }

  /**
   * Export Document (POST /export)
   */
  async exportDocument(input: ExportInput, options?: AiRequestOptions): Promise<any> {
    const payload = {
      content: input.content,
      format: input.format,
      title: input.title || 'Legal_Document',
    };
    return this.post('/export', payload, options);
  }
}

export const aiClient = new AiClient();
