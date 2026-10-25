const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  error?: any;
  expiresInSeconds?: number;
  verified?: boolean;
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('draftmate_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // --- Auth & Onboarding ---
  sendOtp: async (mobile: string, purpose: 'register' | 'login' = 'register'): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, purpose }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  verifyOtp: async (mobile: string, otp: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  register: async (payload: { mobile: string; name: string; password: string; role?: string }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  login: async (payload: { mobile: string; password: string }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getMe: async (token: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  updateOnboarding: async (data: Record<string, any>): Promise<ApiResponse> => {
    let mobile: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('draftmate_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          mobile = parsed.mobile || null;
        }
      } catch (e) {}
    }

    const payload = {
      ...data,
      ...(mobile ? { mobile } : {}),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/auth/onboarding`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success && result.user && typeof window !== 'undefined') {
        localStorage.setItem('draftmate_user', JSON.stringify(result.user));
      }
      return result;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Dynamic Dashboard & Stats ---
  getDashboardStats: async (role: string = 'advocate'): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats?role=${encodeURIComponent(role)}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Templates & Drafting ---
  getTemplates: async (role?: string, category?: string): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (category) params.append('category', category);
      const res = await fetch(`${API_BASE_URL}/templates?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getDrafts: async (role?: string): Promise<ApiResponse> => {
    try {
      const query = role ? `?role=${encodeURIComponent(role)}` : '';
      const res = await fetch(`${API_BASE_URL}/drafts${query}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  saveDraft: async (draft: any): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/drafts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(draft),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  preCheckDraft: async (facts: any): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/drafts/precheck`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ facts }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  generateDraft: async (payload: {
    documentType?: string;
    facts?: any;
    templateId?: string;
    customInstructions?: string;
    jurisdiction?: string;
    referenceStyle?: any;
    existingClauses?: string[];
    skillName?: string;
    isDemo?: boolean;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/drafts/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  extractReferenceStyle: async (payload: {
    referenceText: string;
    filename?: string;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/reference-style`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },



  askResearchQuestion: async (payload: {
    question: string;
    context?: string;
    searchMode?: string;
    mode?: string;
    threadId?: string;
    isDemo?: boolean;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/research/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  chatAssistant: async (payload: {
    question: string;
    context?: string;
    isDemo?: boolean;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/research/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Case Tracker ---
  getCases: async (query?: string, cnr?: string): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (cnr) params.append('cnr', cnr);
      const res = await fetch(`${API_BASE_URL}/tracker/cases?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getCaseByCnr: async (cnr: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/tracker/cases/${encodeURIComponent(cnr)}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Clients ---
  getClients: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getClientById: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Legal Library ---

  getLibraryData: async (tab?: string): Promise<ApiResponse> => {
    try {
      const query = tab ? `?tab=${encodeURIComponent(tab)}` : '';
      const res = await fetch(`${API_BASE_URL}/library${query}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Verification ---
  getVerificationReport: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify/sample`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
  verifyDocument: async (text: string, citations?: any[]): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, citations }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
  verifyCitations: async (text: string, citations?: any[]): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, citations }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
  parseDocumentFile: async (file: File): Promise<ApiResponse> => {
    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');

      const res = await fetch(`${API_BASE_URL}/documents/parse-file`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          filename: file.name,
          fileBase64
        }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Research ---
  getResearchThreads: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/research/threads`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Student Center Assets ---
  getStudentAssets: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/assets`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Translation ---
  getTranslationData: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/translation/data`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  createTranslationJob: async (jobData: {
    fileName: string;
    fileSize?: string;
    sourceLang: string;
    targetLang: string;
    clauses?: string[];
    text?: string;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/translation/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Citizen Helpline ---
  askCitizenQuestion: async (question: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/citizen/ask`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ question }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getCitizenGlossary: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/citizen/glossary`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Session & Refresh Management ---
  refreshToken: async (): Promise<ApiResponse> => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('draftmate_refresh_token') : null;
      if (!refreshToken) return { success: false, message: 'No refresh token stored' };

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (data.success && data.token && typeof window !== 'undefined') {
        localStorage.setItem('draftmate_token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('draftmate_refresh_token', data.refreshToken);
        }
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- NEXORA AI Case Strategy ---
  askNexoraAi: async (payload: {
    query: string;
    matterContext?: string;
    aiMode?: string;
    discussionId?: string;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/nexora/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- BAR AI Bare Acts & Statutory Explanations ---
  getBareActs: async (category?: string, q?: string): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (q) params.append('q', q);
      const res = await fetch(`${API_BASE_URL}/bare-acts?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  searchBareActs: async (q?: string, category?: string): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (category && category !== 'All') params.append('category', category);
      const res = await fetch(`${API_BASE_URL}/bare-acts/search?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  explainBareAct: async (payload: {
    query?: string;
    actName?: string;
    sectionNumber?: string;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/bare-acts/explain`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- AI Live Courtroom Engine (courtroom.ai Integration) ---
  startCourtroomHearing: async (payload: {
    topic: string;
    userSide?: 'petitioner' | 'respondent';
    difficulty?: string;
    court?: string;
    appearanceRole?: string;
    scenarioId?: string;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/courtroom/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  submitCourtroomArgument: async (sessionId: string, argument: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/courtroom/argument`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId, argument }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  endCourtroomHearing: async (sessionId: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/courtroom/${encodeURIComponent(sessionId)}/end`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  getCourtroomHearing: async (sessionId: string): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/courtroom/${encodeURIComponent(sessionId)}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- AI Live Courtroom Simulation Turns ---
  submitCourtroomTurn: async (
    sessionId: string,
    payload: {
      argument: string;
      scenario?: any;
      court?: string;
      difficulty?: string;
      appearanceRole?: string;
      turnHistory?: any[];
    }
  ): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/courtroom/sessions/${encodeURIComponent(sessionId)}/turns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Exam & Moot Evaluation ---
  submitExam: async (
    testId: string,
    payload: {
      answers: Record<string, any>;
      questions?: any[];
    }
  ): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/tests/${encodeURIComponent(testId)}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Combined Moot Memorial Lab Workflow ---
  generateMootMemorial: async (payload: {
    topic: string;
    facts?: string;
    side?: 'petitioner' | 'respondent';
    jurisdiction?: string;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/moot/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // --- Universal Text-to-Speech (TTS) & Preferences ---
  getTtsPreferences: async (): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/preferences/tts`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  updateTtsPreferences: async (preferences: {
    voice?: string;
    rate?: number;
    pitch?: number;
    preferredLanguage?: string;
    autoScrollHighlight?: boolean;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/preferences/tts`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  synthesizeTts: async (payload: {
    text: string;
    language?: string;
    voice?: string;
    rate?: number;
  }): Promise<ApiResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/tts/synthesize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('draftmate_refresh_token') : null;
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('draftmate_token');
        localStorage.removeItem('draftmate_refresh_token');
        localStorage.removeItem('draftmate_user');
      }
    }
  },
};

