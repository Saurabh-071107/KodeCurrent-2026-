'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sliders,
  ChevronDown,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { universalReadAloud, ReadAloudState } from '@/lib/universalReadAloudService';

export interface ReadAloudControlProps {
  id: string;
  text: string;
  language?: string;
  title?: string;
  variant?: 'toolbar' | 'compact' | 'inline';
  className?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export const ReadAloudControl: React.FC<ReadAloudControlProps> = ({
  id,
  text,
  language = 'en-IN',
  title = 'Read Aloud',
  variant = 'compact',
  className = '',
  onStart,
  onEnd
}) => {
  const [readState, setReadState] = useState<ReadAloudState>(universalReadAloud.getState());
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = universalReadAloud.subscribe((newState) => {
      setReadState(newState);
      if (newState.activeSessionId === id && newState.error) {
        setErrorMsg(newState.error);
      } else if (newState.activeSessionId === id && !newState.error) {
        setErrorMsg(null);
      }
    });
    return unsubscribe;
  }, [id]);

  const isCurrentSession = readState.activeSessionId === id;
  const isPlaying = isCurrentSession && readState.status === 'playing';
  const isPaused = isCurrentSession && readState.status === 'paused';

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setErrorMsg(null);
    onStart?.();
    universalReadAloud.speak({
      id,
      text,
      language,
      rate: readState.rate,
      onEnd,
      onError: (err) => {
        setErrorMsg(err?.message || 'Speech generation failed');
      }
    });
  };

  const handlePause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    universalReadAloud.pause();
  };

  const handleResume = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    universalReadAloud.resume();
  };

  const handleStop = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    universalReadAloud.stop();
  };

  const handleRestart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    universalReadAloud.restart();
  };

  const handleSpeedChange = (rate: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    universalReadAloud.setRate(rate);
    setSpeedDropdownOpen(false);
  };

  // Clean language tag for display
  const displayLang = (() => {
    const l = (language || 'en-IN').toLowerCase();
    if (l.startsWith('hi')) return 'Hindi';
    if (l.startsWith('bn')) return 'Bengali';
    if (l.startsWith('mr')) return 'Marathi';
    if (l.startsWith('ta')) return 'Tamil';
    if (l.startsWith('te')) return 'Telugu';
    if (l.startsWith('gu')) return 'Gujarati';
    if (l.startsWith('kn')) return 'Kannada';
    if (l.startsWith('ml')) return 'Malayalam';
    if (l.startsWith('pa')) return 'Punjabi';
    return 'English';
  })();

  // 1. Compact Button Variant (For chat replies, clauses, cards, summary points)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {!isPlaying && !isPaused ? (
          <button
            type="button"
            onClick={handlePlay}
            disabled={!text || !text.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1E3A8A] bg-[#EEF4FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition shadow-2xs cursor-pointer disabled:opacity-40"
            title={`Read Aloud (${displayLang})`}
          >
            <Volume2 className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>Read Aloud</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-[#EEF4FF] border border-[#BFDBFE] rounded-lg p-0.5 px-1.5 shadow-2xs">
            {/* Play/Pause toggle */}
            {isPlaying ? (
              <button
                type="button"
                onClick={handlePause}
                className="p-1 hover:bg-[#DBEAFE] text-[#1E3A8A] rounded transition cursor-pointer"
                title="Pause"
              >
                <Pause className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResume}
                className="p-1 hover:bg-[#DBEAFE] text-[#1E3A8A] rounded transition cursor-pointer"
                title="Resume"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}

            {/* Stop button */}
            <button
              type="button"
              onClick={handleStop}
              className="p-1 hover:bg-[#DBEAFE] text-[#64748B] hover:text-[#1E293B] rounded transition cursor-pointer"
              title="Stop"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
            </button>

            {/* Restart button */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-1 hover:bg-[#DBEAFE] text-[#64748B] hover:text-[#1E293B] rounded transition cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>

            {/* Animated Audio Waveform */}
            <div className="flex items-center gap-0.5 px-1">
              <span className={`w-0.5 h-2.5 bg-[#1E3A8A] rounded-full ${isPlaying ? 'animate-pulse' : 'opacity-40'}`} />
              <span className={`w-0.5 h-4 bg-[#1E3A8A] rounded-full ${isPlaying ? 'animate-pulse' : 'opacity-40'}`} style={{ animationDelay: '150ms' }} />
              <span className={`w-0.5 h-2 bg-[#1E3A8A] rounded-full ${isPlaying ? 'animate-pulse' : 'opacity-40'}`} style={{ animationDelay: '300ms' }} />
            </div>

            {/* Percentage badge */}
            <span className="text-[10px] font-bold text-[#1E3A8A] ml-0.5">
              {readState.progressPercent}%
            </span>
          </div>
        )}

        {errorMsg && (
          <span className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </span>
        )}
      </div>
    );
  }

  // 2. Full Toolbar Variant (For Draft documents, translated documents, revised redline views)
  return (
    <div className={`bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-xs space-y-2.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPlaying ? 'bg-[#1E3A8A] text-white animate-pulse' : 'bg-[#EEF4FF] text-[#1E3A8A]'}`}>
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-[#1E293B]">
                {title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] text-[#475569] text-[10px] font-semibold">
                {displayLang}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {isPlaying
                ? `Reading section ${readState.currentChunkIndex + 1} of ${readState.totalChunks}...`
                : isPaused
                ? 'Playback paused'
                : 'Listen to document aloud with synchronized playback'}
            </p>
          </div>
        </div>

        {/* Audio controls button group */}
        <div className="flex items-center gap-1.5">
          {!isPlaying && !isPaused ? (
            <button
              type="button"
              onClick={handlePlay}
              disabled={!text || !text.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1D4ED8] transition shadow-xs cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-white border border-[#CBD5E1] rounded-lg p-1 shadow-2xs">
              {isPlaying ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="p-1.5 text-[#1E3A8A] hover:bg-[#F1F5F9] rounded transition cursor-pointer"
                  title="Pause"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  className="p-1.5 text-[#1E3A8A] hover:bg-[#F1F5F9] rounded transition cursor-pointer"
                  title="Resume"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              )}

              <button
                type="button"
                onClick={handleStop}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition cursor-pointer"
                title="Stop"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Speed selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSpeedDropdownOpen(!speedDropdownOpen);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#475569] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              <span>{readState.rate}x</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {speedDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-1 z-50 text-xs">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={(e) => handleSpeedChange(speed, e)}
                    className={`w-full text-left px-2.5 py-1.5 rounded font-medium transition cursor-pointer ${
                      readState.rate === speed
                        ? 'bg-[#1E3A8A] text-white font-bold'
                        : 'text-[#475569] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Progress Bar */}
      {isCurrentSession && (readState.status === 'playing' || readState.status === 'paused') && (
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E3A8A] transition-all duration-300 rounded-full"
              style={{ width: `${readState.progressPercent}%` }}
            />
          </div>
          {readState.currentTextSnippet && (
            <p className="text-[11px] text-[#475569] italic truncate bg-white border border-[#E2E8F0] px-2 py-1 rounded">
              &ldquo;{readState.currentTextSnippet}&rdquo;
            </p>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
