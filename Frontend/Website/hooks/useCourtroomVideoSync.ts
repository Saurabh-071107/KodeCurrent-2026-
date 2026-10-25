'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CourtroomSpeaker,
  CourtroomVoiceController,
} from '@/lib/courtroomVoiceController';

interface UseCourtroomVideoSyncProps {
  judgeVideoRef: React.RefObject<HTMLVideoElement | null>;
  opposingVideoRef: React.RefObject<HTMLVideoElement | null>;
  petitionerVideoRef: React.RefObject<HTMLVideoElement | null>;
  muted?: boolean;
}

export function useCourtroomVideoSync({
  judgeVideoRef,
  opposingVideoRef,
  petitionerVideoRef,
  muted = false,
}: UseCourtroomVideoSyncProps) {
  const [activeSpeaker, setActiveSpeaker] = useState<CourtroomSpeaker | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const voiceControllerRef = useRef<CourtroomVoiceController | null>(null);

  // Helper to map speakerId to matching video element
  const getVideoElement = useCallback(
    (speaker: CourtroomSpeaker): HTMLVideoElement | null => {
      switch (speaker) {
        case 'judge':
          return judgeVideoRef.current;
        case 'opposition':
          return opposingVideoRef.current;
        case 'user':
          return petitionerVideoRef.current;
        default:
          return null;
      }
    },
    [judgeVideoRef, opposingVideoRef, petitionerVideoRef]
  );

  // 1. startSpeaking: Pause other videos, play target video
  const startSpeaking = useCallback(
    (speakerId: CourtroomSpeaker) => {
      setActiveSpeaker(speakerId);
      setIsPlaying(true);

      const targetVideo = getVideoElement(speakerId);
      const allVideos = [
        judgeVideoRef.current,
        opposingVideoRef.current,
        petitionerVideoRef.current,
      ];

      // Strictly pause all other videos first to prevent simultaneous playback
      allVideos.forEach((vid) => {
        if (vid && vid !== targetVideo) {
          vid.pause();
        }
      });

      // Start target video
      if (targetVideo) {
        targetVideo.muted = true; // Always muted to prevent duplicate audio
        targetVideo.play().catch((err) => {
          // Handled gracefully without blocking speech audio
          console.warn(`[CourtroomVideoSync] Autoplay prevented for ${speakerId}:`, err);
        });
      }
    },
    [getVideoElement, judgeVideoRef, opposingVideoRef, petitionerVideoRef]
  );

  // 2. stopSpeaking: Pause target video
  const stopSpeaking = useCallback(
    (speakerId?: CourtroomSpeaker) => {
      if (speakerId) {
        const vid = getVideoElement(speakerId);
        if (vid) vid.pause();
      } else {
        [judgeVideoRef.current, opposingVideoRef.current, petitionerVideoRef.current].forEach(
          (vid) => vid?.pause()
        );
      }

      setActiveSpeaker((prev) => (speakerId ? (prev === speakerId ? null : prev) : null));
      setIsPlaying(false);
    },
    [getVideoElement, judgeVideoRef, opposingVideoRef, petitionerVideoRef]
  );

  // 3. pauseAll: Instantly pause all character videos
  const pauseAll = useCallback(() => {
    [judgeVideoRef.current, opposingVideoRef.current, petitionerVideoRef.current].forEach((vid) =>
      vid?.pause()
    );
    setActiveSpeaker(null);
    setIsPlaying(false);
  }, [judgeVideoRef, opposingVideoRef, petitionerVideoRef]);

  // 4. resetCourtroom: Pause all and reset playback positions
  const resetCourtroom = useCallback(() => {
    [judgeVideoRef.current, opposingVideoRef.current, petitionerVideoRef.current].forEach((vid) => {
      if (vid) {
        vid.pause();
        vid.currentTime = 0;
      }
    });
    setActiveSpeaker(null);
    setIsPlaying(false);
  }, [judgeVideoRef, opposingVideoRef, petitionerVideoRef]);

  // Initialize voice controller and bind to actual audio playback lifecycle
  useEffect(() => {
    const vc = new CourtroomVoiceController({
      onSpeechStart: (speakerId) => {
        startSpeaking(speakerId);
      },
      onSpeechEnd: (speakerId) => {
        stopSpeaking(speakerId);
      },
      onSpeechPause: (speakerId) => {
        stopSpeaking(speakerId);
      },
      onQueueEmpty: () => {
        pauseAll();
      },
    });

    vc.setMuted(muted);
    voiceControllerRef.current = vc;

    return () => {
      vc.stop();
      pauseAll();
    };
  }, [muted, startSpeaking, stopSpeaking, pauseAll]);

  // Propagate muted change to voice controller
  useEffect(() => {
    if (voiceControllerRef.current) {
      voiceControllerRef.current.setMuted(muted);
    }
  }, [muted]);

  return {
    activeSpeaker,
    isPlaying,
    voiceController: voiceControllerRef.current,
    startSpeaking,
    stopSpeaking,
    pauseAll,
    resetCourtroom,
  };
}
