'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  buttonLabel?: string;
}

/**
 * OpenWhispr-inspired Voice Dictation Component for DraftMate AI.
 * Provides real-time speech-to-text input with audio waveform indicators.
 * Reference: https://github.com/OpenWhispr/openwhispr
 */
export const VoiceDictation: React.FC<VoiceDictationProps> = ({
  onTranscript,
  language = 'en-IN',
  className = '',
  buttonLabel = 'Voice Dictation'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimText(currentInterim);
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim() + ' ');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[OpenWhispr] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone permissions.');
      }
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup aborts
        }
      }
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      alert('Speech Recognition is not supported on this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className={`inline-flex flex-col sm:flex-row items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border ${
          isListening
            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20 animate-pulse'
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
        }`}
        title={isListening ? 'Stop Dictation' : 'Start Voice Dictation (OpenWhispr)'}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4 text-white" />
            <span>Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-amber-400" />
            <span>{buttonLabel}</span>
          </>
        )}
      </button>

      {isListening && interimText && (
        <span className="text-xs text-amber-300 italic truncate max-w-[200px] sm:max-w-[300px]">
          "{interimText}"
        </span>
      )}
    </div>
  );
};
