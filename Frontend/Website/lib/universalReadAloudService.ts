/**
 * Universal Read Aloud / Text-to-Speech (TTS) Service for DraftMate AI
 *
 * Provides enterprise-grade speech playback across:
 * - AI Chat Replies
 * - Translated Legal Documents (in target Indian language)
 * - AI Drafted Legal Documents & Clause Sections
 * - Revised & Redline Documents
 * - Verification Summaries & Legal Explanations
 *
 * Implements:
 * 1. Smart legal text chunking (avoids Chromium ~250 char speech freeze bug)
 * 2. Strict global single-speaker concurrency (no overlapping voices)
 * 3. Play, Pause, Resume, Stop, and Restart from beginning
 * 4. Multilingual voice resolution (Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, English)
 * 5. Reactive subscriber pattern for React hook integration
 */

export interface ReadAloudState {
  status: 'idle' | 'playing' | 'paused' | 'stopped' | 'error';
  activeSessionId: string | null;
  currentChunkIndex: number;
  totalChunks: number;
  progressPercent: number;
  currentTextSnippet: string;
  language: string;
  rate: number;
  voiceURI: string | null;
  error: string | null;
}

export interface ReadAloudOptions {
  id: string;
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onChunkStart?: (chunkIndex: number, snippet: string) => void;
  onProgress?: (progressPercent: number) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

type StateListener = (state: ReadAloudState) => void;

class UniversalReadAloudService {
  private static instance: UniversalReadAloudService;

  private state: ReadAloudState = {
    status: 'idle',
    activeSessionId: null,
    currentChunkIndex: 0,
    totalChunks: 0,
    progressPercent: 0,
    currentTextSnippet: '',
    language: 'en-IN',
    rate: 1.0,
    voiceURI: null,
    error: null,
  };

  private listeners: Set<StateListener> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private currentChunks: string[] = [];
  private currentOptions: ReadAloudOptions | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isProcessingQueue = false;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public static getInstance(): UniversalReadAloudService {
    if (!UniversalReadAloudService.instance) {
      UniversalReadAloudService.instance = new UniversalReadAloudService();
    }
    return UniversalReadAloudService.instance;
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
      if (this.availableVoices.length > 0) {
        this.voicesLoaded = true;
      }
    }
  }

  public getVoices(targetLanguage?: string): SpeechSynthesisVoice[] {
    if (!this.voicesLoaded && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
    }
    if (!targetLanguage) return this.availableVoices;

    const normTarget = targetLanguage.toLowerCase().replace('_', '-');
    const langPrefix = normTarget.split('-')[0];

    // Priority 1: Exact language match (e.g., 'hi-IN')
    const exact = this.availableVoices.filter((v) => v.lang.toLowerCase().replace('_', '-') === normTarget);
    if (exact.length > 0) return exact;

    // Priority 2: Primary language prefix match (e.g., 'hi')
    const prefixMatches = this.availableVoices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (prefixMatches.length > 0) return prefixMatches;

    // Fallback: All voices
    return this.availableVoices;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((listener) => listener(copy));
  }

  public getState(): ReadAloudState {
    return { ...this.state };
  }

  /**
   * Smart Chunking: Splits legal drafts, judgments, and replies into natural boundary
   * segments (150-250 chars) to prevent browser speech synthesis timeouts.
   */
  public chunkLegalText(rawText: string): string[] {
    if (!rawText || !rawText.trim()) return [];

    // Clean markdown headings & asterisks without losing legal citations or clause numbers
    const clean = rawText
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*{1,3}/g, '')
      .trim();

    const paragraphs = clean.split(/\n{2,}|\r\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const chunks: string[] = [];

    for (const para of paragraphs) {
      if (para.length <= 220) {
        chunks.push(para);
      } else {
        // Split at sentence ending punctuation (. ? ! ;) followed by whitespace or clause numbers
        const sentences = para.split(/(?<=[.?!;])\s+(?=[A-Z0-9(])/).map((s) => s.trim()).filter(Boolean);
        let accumulated = '';

        for (const sent of sentences) {
          if ((accumulated + ' ' + sent).trim().length <= 220) {
            accumulated = accumulated ? accumulated + ' ' + sent : sent;
          } else {
            if (accumulated) chunks.push(accumulated);
            accumulated = sent;
          }
        }
        if (accumulated) chunks.push(accumulated);
      }
    }

    return chunks.length > 0 ? chunks : [clean.substring(0, 220)];
  }

  /**
   * Main Read Aloud Invocation
   */
  public async speak(options: ReadAloudOptions): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.state.error = 'Speech synthesis is not supported on this device/browser.';
      this.state.status = 'error';
      this.notify();
      options.onError?.(new Error(this.state.error));
      return;
    }

    // Cancel existing speech session immediately (Strict Single Speaker)
    this.stopInternal();

    const chunks = this.chunkLegalText(options.text);
    if (chunks.length === 0) {
      this.state.error = 'No pronounceable text provided.';
      this.state.status = 'error';
      this.notify();
      return;
    }

    const lang = options.language || 'en-IN';
    const rate = options.rate ?? 1.0;

    this.currentChunks = chunks;
    this.currentOptions = options;
    this.isProcessingQueue = true;

    this.state = {
      status: 'playing',
      activeSessionId: options.id,
      currentChunkIndex: 0,
      totalChunks: chunks.length,
      progressPercent: 0,
      currentTextSnippet: chunks[0],
      language: lang,
      rate,
      voiceURI: options.voiceURI || null,
      error: null,
    };
    this.notify();

    this.playChunk(0);
  }

  private playChunk(index: number) {
    if (!this.isProcessingQueue || !this.currentOptions) return;
    if (index >= this.currentChunks.length) {
      // Completed all chunks
      this.state.status = 'idle';
      this.state.progressPercent = 100;
      this.notify();
      this.currentOptions.onEnd?.();
      this.isProcessingQueue = false;
      return;
    }

    const snippet = this.currentChunks[index];
    const utterance = new SpeechSynthesisUtterance(snippet);

    utterance.lang = this.state.language;
    utterance.rate = this.state.rate;
    utterance.pitch = this.currentOptions.pitch ?? 1.0;

    // Voice assignment
    const matchingVoices = this.getVoices(this.state.language);
    if (this.state.voiceURI) {
      const selected = this.availableVoices.find((v) => v.voiceURI === this.state.voiceURI);
      if (selected) utterance.voice = selected;
    } else if (matchingVoices.length > 0) {
      utterance.voice = matchingVoices[0];
    }

    utterance.onstart = () => {
      this.state.currentChunkIndex = index;
      this.state.currentTextSnippet = snippet;
      this.state.progressPercent = Math.round(((index + 1) / this.currentChunks.length) * 100);
      this.notify();
      this.currentOptions?.onChunkStart?.(index, snippet);
      this.currentOptions?.onProgress?.(this.state.progressPercent);
    };

    utterance.onend = () => {
      if (this.isProcessingQueue && this.state.status === 'playing') {
        this.playChunk(index + 1);
      }
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // If error occurred because of cancellation / interruption, ignore gracefully
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('[UniversalReadAloud] Playback error on chunk:', e.error);
      this.state.status = 'error';
      this.state.error = `Speech playback interrupted: ${e.error}`;
      this.notify();
      this.currentOptions?.onError?.(e);
      this.isProcessingQueue = false;
    };

    this.currentUtterance = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      this.state.status = 'error';
      this.state.error = err.message || 'Failed to start speech synthesis.';
      this.notify();
      this.currentOptions?.onError?.(err);
      this.isProcessingQueue = false;
    }
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.state.status = 'paused';
      this.notify();
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.state.status = 'playing';
        this.notify();
      } else if (this.state.status === 'paused' && this.currentOptions) {
        // Fallback for Chromium resume bug: re-speak current chunk
        this.state.status = 'playing';
        this.notify();
        this.playChunk(this.state.currentChunkIndex);
      }
    }
  }

  public stop(): void {
    this.stopInternal();
    this.state.status = 'idle';
    this.state.activeSessionId = null;
    this.state.currentChunkIndex = 0;
    this.state.progressPercent = 0;
    this.state.currentTextSnippet = '';
    this.notify();
  }

  private stopInternal(): void {
    this.isProcessingQueue = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.currentUtterance = null;
  }

  public restart(): void {
    if (!this.currentOptions) return;
    const opts = { ...this.currentOptions };
    this.speak(opts);
  }

  public setRate(newRate: number): void {
    this.state.rate = newRate;
    this.notify();
    if (this.state.status === 'playing' && this.currentOptions) {
      // Restart current chunk with new rate
      const currentIdx = this.state.currentChunkIndex;
      this.stopInternal();
      this.isProcessingQueue = true;
      this.state.status = 'playing';
      this.notify();
      this.playChunk(currentIdx);
    }
  }

  public setVoiceURI(voiceURI: string): void {
    this.state.voiceURI = voiceURI;
    this.notify();
  }
}

export const universalReadAloud = UniversalReadAloudService.getInstance();
