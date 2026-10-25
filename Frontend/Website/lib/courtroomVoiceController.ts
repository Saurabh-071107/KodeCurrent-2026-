/**
 * Courtroom Voice & Audio Playback Queue Controller
 *
 * Drives character video playback strictly through actual audio playback events.
 * Uses Web Speech API (speechSynthesis) or audio element streams with full lifecycle hooks.
 */

export type CourtroomSpeaker = 'judge' | 'opposition' | 'user';

export interface SpeechUtteranceItem {
  id: string;
  speakerId: CourtroomSpeaker;
  text: string;
  audioUrl?: string;
  delayBeforeMs?: number;
}

export interface VoiceControllerCallbacks {
  onSpeechStart?: (speakerId: CourtroomSpeaker, utteranceId: string) => void;
  onSpeechEnd?: (speakerId: CourtroomSpeaker, utteranceId: string) => void;
  onSpeechPause?: (speakerId: CourtroomSpeaker, utteranceId: string) => void;
  onQueueEmpty?: () => void;
  onError?: (error: any) => void;
}

export class CourtroomVoiceController {
  private queue: SpeechUtteranceItem[] = [];
  private isProcessing = false;
  private currentUtterance: SpeechUtteranceItem | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private callbacks: VoiceControllerCallbacks = {};
  private muted = false;
  private voicesLoaded = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor(callbacks?: VoiceControllerCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
      if (this.availableVoices.length > 0) {
        this.voicesLoaded = true;
      }
    }
  }

  public setCallbacks(callbacks: VoiceControllerCallbacks) {
    this.callbacks = callbacks;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stop();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getActiveSpeaker(): CourtroomSpeaker | null {
    return this.currentUtterance?.speakerId || null;
  }

  public isSpeaking(): boolean {
    return this.isProcessing && this.currentUtterance !== null;
  }

  /**
   * Enqueue a single speech item
   */
  public enqueue(item: {
    speakerId: CourtroomSpeaker;
    text: string;
    audioUrl?: string;
    delayBeforeMs?: number;
  }) {
    const utteranceItem: SpeechUtteranceItem = {
      id: `utt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      speakerId: item.speakerId,
      text: item.text,
      audioUrl: item.audioUrl,
      delayBeforeMs: item.delayBeforeMs ?? 200,
    };

    this.queue.push(utteranceItem);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  /**
   * Enqueue a multi-turn sequence (e.g. Opposing counsel speaks first, then Judge)
   */
  public enqueueSequence(items: Array<{ speakerId: CourtroomSpeaker; text: string; audioUrl?: string }>) {
    items.forEach((it, idx) => {
      this.enqueue({
        speakerId: it.speakerId,
        text: it.text,
        audioUrl: it.audioUrl,
        delayBeforeMs: idx === 0 ? 100 : 400,
      });
    });
  }

  /**
   * Stop all playback immediately and empty the queue
   */
  public stop() {
    this.queue = [];
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.currentUtterance) {
      const spk = this.currentUtterance.speakerId;
      const uid = this.currentUtterance.id;
      this.currentUtterance = null;
      this.isProcessing = false;
      this.callbacks.onSpeechEnd?.(spk, uid);
    } else {
      this.isProcessing = false;
    }

    this.callbacks.onQueueEmpty?.();
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.currentUtterance = null;
      this.callbacks.onQueueEmpty?.();
      return;
    }

    if (this.muted) {
      this.queue = [];
      this.isProcessing = false;
      this.currentUtterance = null;
      this.callbacks.onQueueEmpty?.();
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift()!;
    this.currentUtterance = item;

    // Optional delay between speaker handoffs for natural courtroom cadence
    if (item.delayBeforeMs && item.delayBeforeMs > 0) {
      await new Promise((res) => setTimeout(res, item.delayBeforeMs));
      // In case stopped during delay
      if (!this.isProcessing || this.currentUtterance?.id !== item.id) {
        return;
      }
    }

    if (item.audioUrl) {
      this.playAudioElement(item);
    } else {
      this.playSpeechSynthesis(item);
    }
  }

  private playAudioElement(item: SpeechUtteranceItem) {
    try {
      const audio = new Audio(item.audioUrl);
      this.currentAudioElement = audio;

      audio.onplay = () => {
        this.callbacks.onSpeechStart?.(item.speakerId, item.id);
      };

      audio.onpause = () => {
        if (!audio.ended) {
          this.callbacks.onSpeechPause?.(item.speakerId, item.id);
        }
      };

      audio.onended = () => {
        this.currentAudioElement = null;
        this.callbacks.onSpeechEnd?.(item.speakerId, item.id);
        this.processNext();
      };

      audio.onerror = (e) => {
        console.warn('[CourtroomVoice] Audio stream error, falling back to Web Speech:', e);
        this.currentAudioElement = null;
        this.playSpeechSynthesis(item);
      };

      audio.play().catch((err) => {
        console.warn('[CourtroomVoice] Audio autoplay prevented, falling back to Web Speech:', err);
        this.playSpeechSynthesis(item);
      });
    } catch (err) {
      this.playSpeechSynthesis(item);
    }
  }

  private playSpeechSynthesis(item: SpeechUtteranceItem) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // If Web Speech is completely unsupported, simulate audio duration gracefully
      this.simulateSpeechDuration(item);
      return;
    }

    // Cancel any stuck utterances
    window.speechSynthesis.cancel();

    const cleanText = item.text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) {
      this.processNext();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Speaker-specific acoustic profile
    if (item.speakerId === 'judge') {
      utterance.pitch = 0.9;
      utterance.rate = 0.92;
      const judgeVoice = this.availableVoices.find(
        (v) => (v.name.includes('India') || v.name.includes('UK') || v.name.includes('Male')) && !v.name.includes('Female')
      ) || this.availableVoices[0];
      if (judgeVoice) utterance.voice = judgeVoice;
    } else if (item.speakerId === 'opposition') {
      utterance.pitch = 1.05;
      utterance.rate = 1.02;
      const oppVoice = this.availableVoices.find(
        (v) => (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('David')) && v !== utterance.voice
      ) || this.availableVoices[1] || this.availableVoices[0];
      if (oppVoice) utterance.voice = oppVoice;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      this.callbacks.onSpeechStart?.(item.speakerId, item.id);
    };

    utterance.onpause = () => {
      this.callbacks.onSpeechPause?.(item.speakerId, item.id);
    };

    utterance.onresume = () => {
      this.callbacks.onSpeechStart?.(item.speakerId, item.id);
    };

    utterance.onend = () => {
      this.callbacks.onSpeechEnd?.(item.speakerId, item.id);
      this.processNext();
    };

    utterance.onerror = (event) => {
      // Interrupted errors happen on intentional cancellation, don't log as fatal
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('[CourtroomVoice] Speech synthesis error:', event.error);
        this.callbacks.onError?.(event);
      }
      this.callbacks.onSpeechEnd?.(item.speakerId, item.id);
      this.processNext();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[CourtroomVoice] speechSynthesis.speak failed:', e);
      this.simulateSpeechDuration(item);
    }
  }

  private simulateSpeechDuration(item: SpeechUtteranceItem) {
    this.callbacks.onSpeechStart?.(item.speakerId, item.id);
    // Rough estimate: ~150 words per minute => ~400ms per word, capped at 6 seconds
    const wordCount = item.text.split(/\s+/).length;
    const durationMs = Math.min(6000, Math.max(1500, wordCount * 280));

    setTimeout(() => {
      this.callbacks.onSpeechEnd?.(item.speakerId, item.id);
      this.processNext();
    }, durationMs);
  }
}
