import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  AuditoryLearningData,
  AuditoryAudioSegment,
} from '../../../shared/types';

export interface AudioSegmentOption {
  index: number;
  title: string;
  transcriptSnippet?: string;
  snippet?: string;
  soundCue?: string;
  keyListenFor?: string;
  listenTarget?: string;
  durationSec?: number;
}

export interface AudioPlayerWebProps {
  data?: AuditoryLearningData | null;
  /** Fallback properties */
  audioTitle?: string;
  narrationScript?: string;
  speakerInstructions?: string;
  segments?: AudioSegmentOption[];
  className?: string;
}

export const AudioPlayerWeb: React.FC<AudioPlayerWebProps> = ({
  data,
  audioTitle: propTitle,
  narrationScript: propScript,
  speakerInstructions: propInstructions,
  segments: propSegments,
  className = '',
}) => {
  const audioTitle = data?.audioTitle || propTitle || 'Spoken Conceptual Masterclass';
  const fullTranscript = data?.narrationScript || propScript || '';
  const speakerInstructions = data?.speakerInstructions || propInstructions;

  // Normalize segments
  const rawSegments: any[] = data?.segments || propSegments || [];
  const segments: AudioSegmentOption[] =
    rawSegments.length > 0
      ? rawSegments.map((s, idx) => ({
          index: s.index || idx + 1,
          title: s.title || `Segment ${idx + 1}`,
          transcriptSnippet: s.transcriptSnippet || s.snippet || '',
          snippet: s.snippet || s.transcriptSnippet || '',
          soundCue: s.soundCue,
          keyListenFor: s.keyListenFor || s.listenTarget,
          listenTarget: s.listenTarget || s.keyListenFor,
          durationSec: s.durationSec || 15,
        }))
      : [
          {
            index: 1,
            title: 'Full Lesson Narration',
            transcriptSnippet: fullTranscript,
            snippet: fullTranscript,
            durationSec: Math.max(10, Math.ceil(fullTranscript.split(' ').length / 2.5)),
          },
        ];

  const [currentSegmentIdx, setCurrentSegmentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const currentSegment = segments[currentSegmentIdx] || segments[0];
  const activeText = currentSegment.transcriptSnippet || fullTranscript;

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<any>(null);

  // Check speech synthesis support on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
      setStatusMessage('Web Speech synthesis is not supported in this environment; simulated playback active.');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgressPercent(0);
  };

  const playText = (text: string, startPct = 0) => {
    stopPlayback();

    if (!text || text.trim().length === 0) {
      setStatusMessage('No spoken text provided for this segment.');
      return;
    }

    const estimatedDuration = Math.max(4, (text.split(' ').length / (2.5 * playbackRate)));
    const startTime = Date.now() - (startPct / 100) * estimatedDuration * 1000;

    if (speechSupported && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setStatusMessage('Audio streaming live through browser speech synthesizer...');
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setProgressPercent(100);
          if (timerRef.current) clearInterval(timerRef.current);
          setStatusMessage('Playback finished.');
        };

        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            setStatusMessage(`Synthesizer notice: ${e.error || 'Audio streamed successfully'}`);
          }
          setIsPlaying(false);
          setIsPaused(false);
          if (timerRef.current) clearInterval(timerRef.current);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Fallback to simulation
        setSpeechSupported(false);
      }
    }

    // Interval to update progress smoothly
    setIsPlaying(true);
    setIsPaused(false);
    const intervalMs = 100;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(100, Math.round((elapsed / estimatedDuration) * 100));
      setProgressPercent(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsPlaying(false);
      }
    }, intervalMs);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (speechSupported && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
      setIsPlaying(false);
      setStatusMessage('Audio paused.');
    } else if (isPaused) {
      if (speechSupported && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
        setStatusMessage('Resumed audio playback.');
      } else {
        playText(activeText, progressPercent);
      }
    } else {
      playText(activeText, 0);
    }
  };

  const handleRestart = () => {
    playText(activeText, 0);
  };

  const handlePrevSegment = () => {
    if (currentSegmentIdx > 0) {
      const nextIdx = currentSegmentIdx - 1;
      setCurrentSegmentIdx(nextIdx);
      const nextText = segments[nextIdx].transcriptSnippet || fullTranscript;
      playText(nextText, 0);
    } else {
      handleRestart();
    }
  };

  const handleNextSegment = () => {
    if (currentSegmentIdx < segments.length - 1) {
      const nextIdx = currentSegmentIdx + 1;
      setCurrentSegmentIdx(nextIdx);
      const nextText = segments[nextIdx].transcriptSnippet || fullTranscript;
      playText(nextText, 0);
    }
  };

  const handleSelectSegment = (idx: number) => {
    setCurrentSegmentIdx(idx);
    const nextText = segments[idx].transcriptSnippet || fullTranscript;
    playText(nextText, 0);
  };

  return (
    <div className={`bg-white rounded-2xl border border-[#E2D6F8] shadow-sm overflow-hidden ${className}`}>
      {/* Player Header */}
      <div className="bg-[#FAF8FF] px-4 py-3 border-b border-[#E2D6F8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-[#24163D] text-sm">{audioTitle}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Auditory Learning Player
              </span>
            </div>
            <p className="text-[11px] text-[#64587A]">
              Segment {currentSegmentIdx + 1} of {segments.length}: {currentSegment.title}
            </p>
          </div>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-[#64587A]">Speed:</span>
          {[0.85, 1.0, 1.2].map((rate) => (
            <button
              key={rate}
              onClick={() => {
                setPlaybackRate(rate);
                if (isPlaying) {
                  playText(activeText, progressPercent);
                }
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                playbackRate === rate
                  ? 'bg-[#7041C6] text-white'
                  : 'bg-white border border-[#E2D6F8] text-[#39245F] hover:bg-purple-50'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Playback Bar & Progress */}
      <div className="p-4 bg-gradient-to-r from-blue-50/40 via-purple-50/30 to-blue-50/40 space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-[#E2D6F8] h-2 rounded-full overflow-hidden cursor-pointer relative">
            <div
              className="bg-[#7041C6] h-full transition-all duration-150 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-[#64587A]">
            <span>{Math.round((progressPercent / 100) * (currentSegment.durationSec || 20))}s</span>
            <span>{progressPercent}% played</span>
            <span>{currentSegment.durationSec || 20}s total</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {/* Previous Segment */}
            <button
              onClick={handlePrevSegment}
              disabled={currentSegmentIdx === 0 && progressPercent === 0}
              title="Previous Segment"
              className="p-2 rounded-xl border border-[#E2D6F8] bg-white text-[#39245F] hover:bg-purple-50 transition-all disabled:opacity-40"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause Main */}
            <button
              onClick={handlePlayPause}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                isPlaying
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-[#7041C6] text-white hover:bg-[#5C32A8]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause Audio
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Play Segment
                </>
              )}
            </button>

            {/* Next Segment */}
            <button
              onClick={handleNextSegment}
              disabled={currentSegmentIdx >= segments.length - 1}
              title="Next Segment"
              className="p-2 rounded-xl border border-[#E2D6F8] bg-white text-[#39245F] hover:bg-purple-50 transition-all disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Restart */}
            <button
              onClick={handleRestart}
              title="Replay from start"
              className="p-2 rounded-xl border border-[#E2D6F8] bg-white text-[#64587A] hover:bg-purple-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Transcript */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E2D6F8] bg-white text-[#7041C6] hover:bg-purple-50 transition-all"
          >
            <Subtitles className="w-3.5 h-3.5" />
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        </div>

        {/* Sound Cue or Listen Target Indicator */}
        {(currentSegment.soundCue || currentSegment.keyListenFor) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {currentSegment.soundCue && (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> Sound Cue: {currentSegment.soundCue}
              </span>
            )}
            {currentSegment.keyListenFor && (
              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-md font-semibold">
                🎯 Target Focus: {currentSegment.keyListenFor}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Segment Selector Tabs */}
      {segments.length > 1 && (
        <div className="px-4 py-2.5 bg-white border-t border-[#E2D6F8] flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-[#64587A] whitespace-nowrap">Segments:</span>
          {segments.map((seg, i) => (
            <button
              key={seg.index || i}
              onClick={() => handleSelectSegment(i)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                i === currentSegmentIdx
                  ? 'bg-[#7041C6] text-white shadow-sm'
                  : 'bg-[#FAF8FF] border border-[#E2D6F8] text-[#39245F] hover:bg-purple-50'
              }`}
            >
              <span>{i + 1}.</span> {seg.title}
            </button>
          ))}
        </div>
      )}

      {/* Spoken Text / Subtitles Banner */}
      {showTranscript && (
        <div className="p-4 bg-white border-t border-[#E2D6F8] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#24163D] flex items-center gap-1">
              <Subtitles className="w-3.5 h-3.5 text-[#7041C6]" /> Spoken Text (Segment {currentSegmentIdx + 1}):
            </span>
            {speakerInstructions && (
              <span className="text-[10px] text-[#64587A] italic">
                Voice Delivery: {speakerInstructions}
              </span>
            )}
          </div>
          <div className="bg-[#FAF8FF] p-3 rounded-xl border border-[#E2D6F8] text-xs text-[#39245F] leading-relaxed">
            <p className="font-medium italic">"{activeText}"</p>
          </div>

          {/* Full Narration Accordion if distinct */}
          {fullTranscript && fullTranscript !== activeText && (
            <details className="text-xs text-[#64587A] pt-1">
              <summary className="cursor-pointer font-bold text-[#7041C6] hover:underline">
                View Full Lesson Narration Script
              </summary>
              <p className="pt-2 pl-2 text-[11px] leading-relaxed text-[#39245F] bg-[#FDFBFF] p-2.5 rounded-lg border border-purple-100 mt-1">
                {fullTranscript}
              </p>
            </details>
          )}
        </div>
      )}

      {/* Status Notice */}
      {statusMessage && (
        <div className="px-4 py-1.5 bg-[#FAF8FF] border-t border-[#E2D6F8] text-[10px] text-[#64587A] flex items-center justify-between">
          <span>{statusMessage}</span>
          <span className="text-emerald-700 font-bold">● Active Engine</span>
        </div>
      )}
    </div>
  );
};
