import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';

export interface AudioSegmentItem {
  index: number;
  title: string;
  transcriptSnippet?: string;
  snippet?: string;
  listenTarget?: string;
}

interface AudioPlayerBarProps {
  transcript: string;
  label?: string;
  segments?: AudioSegmentItem[];
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  transcript,
  label = 'Listen Carefully',
  segments,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number | null>(null);

  const activeText =
    selectedSegmentIdx !== null && segments && segments[selectedSegmentIdx]
      ? segments[selectedSegmentIdx].transcriptSnippet ||
        segments[selectedSegmentIdx].snippet ||
        transcript
      : transcript;

  useEffect(() => {
    return () => {
      try {
        Speech.stop();
      } catch {
        // Ignore if Speech unavailable
      }
    };
  }, []);

  const handlePlayText = (text: string) => {
    try {
      Speech.stop();
      setIsPlaying(true);
      setPlayCount((c) => c + 1);
      Speech.speak(text, {
        rate: 0.92,
        pitch: 1.05,
        onDone: () => setIsPlaying(false),
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch {
      // Fallback visual playback simulation
      setIsPlaying(true);
      setPlayCount((c) => c + 1);
      setTimeout(() => setIsPlaying(false), 2500);
    }
  };

  const handlePlay = () => {
    handlePlayText(activeText);
  };

  const handleSelectSegment = (idx: number) => {
    if (selectedSegmentIdx === idx) {
      setSelectedSegmentIdx(null);
      handlePlayText(transcript);
    } else {
      setSelectedSegmentIdx(idx);
      const segText =
        segments?.[idx]?.transcriptSnippet || segments?.[idx]?.snippet || transcript;
      handlePlayText(segText);
    }
  };

  const handleStop = () => {
    try {
      Speech.stop();
    } catch {
      // Ignore
    }
    setIsPlaying(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={isPlaying ? handleStop : handlePlay}
          activeOpacity={0.85}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.waveBox}>
          <View style={styles.bars}>
            {[16, 28, 20, 34, 24, 30, 18, 26, 22].map((h, idx) => (
              <View
                key={idx}
                style={[
                  styles.bar,
                  {
                    height: isPlaying ? h : Math.max(10, h * 0.55),
                    backgroundColor: isPlaying ? '#3B82F6' : '#93C5FD',
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.statusText}>
            {isPlaying ? 'Playing audio...' : playCount > 0 ? `Played ${playCount}x • Tap to replay` : 'Tap Play to listen'}
          </Text>
        </View>

        <TouchableOpacity style={styles.replayBtn} onPress={handlePlay}>
          <Ionicons name="refresh" size={20} color={VARCHLEARN_COLORS.primary} />
        </TouchableOpacity>
      </View>

      {segments && segments.length > 0 ? (
        <View style={styles.segmentList}>
          <Text style={styles.segmentHeader}>Audio Segments (Tap to listen):</Text>
          <View style={styles.segmentRow}>
            {segments.map((seg, sIdx) => {
              const isSelected = selectedSegmentIdx === sIdx;
              return (
                <TouchableOpacity
                  key={sIdx}
                  onPress={() => handleSelectSegment(sIdx)}
                  style={[styles.segmentChip, isSelected && styles.segmentChipActive]}
                >
                  <Ionicons
                    name={isSelected && isPlaying ? 'volume-high' : 'radio-button-on'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#1E40AF'}
                  />
                  <Text style={[styles.segmentChipText, isSelected && styles.segmentChipTextActive]}>
                    {seg.title || `Part ${seg.index || sIdx + 1}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.captionToggle}
        onPress={() => setShowCaptions(!showCaptions)}
      >
        <Ionicons name="chatbox-ellipses-outline" size={16} color={VARCHLEARN_COLORS.primary} />
        <Text style={styles.captionToggleText}>
          {showCaptions ? 'Hide Accessibility Captions' : 'Show Accessibility Captions'}
        </Text>
      </TouchableOpacity>

      {showCaptions ? (
        <View style={styles.captionBox}>
          <Text style={styles.captionText}>{transcript}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: VARCHLEARN_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBox: {
    flex: 1,
    gap: 6,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  replayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  captionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  captionToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.primary,
  },
  captionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
  },
  captionText: {
    fontSize: 13,
    lineHeight: 19,
    color: VARCHLEARN_COLORS.textPrimary,
  },
  segmentList: {
    gap: 6,
    paddingVertical: 4,
  },
  segmentHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  segmentChipActive: {
    backgroundColor: VARCHLEARN_COLORS.primary,
    borderColor: VARCHLEARN_COLORS.primary,
  },
  segmentChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  segmentChipTextActive: {
    color: '#FFFFFF',
  },
});
