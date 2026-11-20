import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { DailyPathNode, MascotId } from '../../../../shared/types';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../shared/constants/theme';
import { MascotAvatar } from './MascotAvatar';

interface WindingAdventurePathProps {
  nodes: DailyPathNode[];
  onPressNode: (node: DailyPathNode) => void;
}

// Responsive width computed inside component via useWindowDimensions()
const NODE_ROW_HEIGHT = 116;

// Winding horizontal offsets (% of canvas width) to create an irregular, playful S-curve
const X_OFFSETS = [0.5, 0.76, 0.62, 0.25, 0.22, 0.56, 0.78, 0.48, 0.24, 0.52, 0.74, 0.5];

const MASCOT_GUIDES: { index: number; mascotId: MascotId; message: string; side: 'left' | 'right' }[] = [
  { index: 0, mascotId: 'vee', message: "Let's start your adventure!", side: 'left' },
  { index: 2, mascotId: 'winky', message: 'Word puzzles ahead!', side: 'right' },
  { index: 4, mascotId: 'bouncy', message: 'Time for hands-on action!', side: 'right' },
  { index: 6, mascotId: 'pixie', message: 'Spot the hidden clues!', side: 'left' },
  { index: 8, mascotId: 'echo', message: 'Listen closely, explorer!', side: 'right' },
];

export const WindingAdventurePath: React.FC<WindingAdventurePathProps> = ({
  nodes,
  onPressNode,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const CANVAS_WIDTH = Math.max(260, Math.min(screenWidth - 32, 420));
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.09, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (nodes.length === 0) {
    return null;
  }

  const totalHeight = nodes.length * NODE_ROW_HEIGHT + 70;

  const getPoint = (idx: number) => {
    const xRatio = X_OFFSETS[idx % X_OFFSETS.length];
    const x = Math.round(xRatio * (CANVAS_WIDTH - 90) + 45);
    const y = idx * NODE_ROW_HEIGHT + 64;
    return { x, y };
  };

  // Build smooth curved SVG path connecting all nodes
  const buildTrailSvgPath = () => {
    const points = nodes.map((_, i) => getPoint(i));
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const getModalityIcon = (modality: DailyPathNode['activity']['modality']) => {
    switch (modality) {
      case 'visual':
        return 'eye';
      case 'auditory':
        return 'headset';
      case 'read_write':
        return 'book';
      case 'kinesthetic':
        return 'hand-left';
    }
  };

  const trailD = buildTrailSvgPath();

  return (
    <View style={[styles.container, { width: CANVAS_WIDTH, height: totalHeight }]}>
      {/* Scenic Meadow Background Hills */}
      <View style={styles.hillTop} />
      <View style={styles.hillMid} />

      {/* Winding Trail SVG */}
      <Svg width={CANVAS_WIDTH} height={totalHeight} style={StyleSheet.absoluteFill}>
        {trailD ? (
          <>
            <Path
              d={trailD}
              stroke={VARCHLEARN_COLORS.pathTrailBorder}
              strokeWidth={22}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={trailD}
              stroke={VARCHLEARN_COLORS.pathTrail}
              strokeWidth={16}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={trailD}
              stroke="#FFFFFF"
              strokeWidth={2.5}
              strokeDasharray="8,10"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : null}
      </Svg>

      {/* Mascot Guides placed along the path */}
      {MASCOT_GUIDES.filter((g) => g.index < nodes.length).map((guide) => {
        const pt = getPoint(guide.index);
        const mascotLeft = guide.side === 'left' ? Math.max(4, pt.x - 125) : Math.min(CANVAS_WIDTH - 95, pt.x + 50);
        return (
          <View
            key={guide.mascotId}
            style={[
              styles.mascotSpot,
              {
                top: pt.y - 34,
                left: mascotLeft,
              },
            ]}
            pointerEvents="none"
          >
            <MascotAvatar
              mascotId={guide.mascotId}
              expression="encouraging"
              size={58}
            />
            <View style={styles.miniSpeech}>
              <Text style={styles.miniSpeechText} numberOfLines={2}>
                {guide.message}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Activity Nodes */}
      {nodes.map((node, idx) => {
        const pt = getPoint(idx);
        const meta = MODALITY_META[node.activity.modality];
        const isCompleted = node.status === 'completed';
        const isCurrent = node.status === 'current';
        const isLocked = node.status === 'locked';

        const nodeContent = (
          <TouchableOpacity
            activeOpacity={isLocked ? 0.8 : 0.75}
            onPress={() => onPressNode(node)}
            style={[
              styles.nodeCircle,
              {
                backgroundColor: isLocked
                  ? '#E5DFF2'
                  : isCompleted
                  ? VARCHLEARN_COLORS.success
                  : meta.color,
                borderColor: isCurrent ? VARCHLEARN_COLORS.starGold : '#FFFFFF',
                borderWidth: isCurrent ? 4 : 3,
              },
            ]}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={28} color="#FFFFFF" />
            ) : isLocked ? (
              <Ionicons name="lock-closed" size={22} color="#7A6E94" />
            ) : (
              <Ionicons name={getModalityIcon(node.activity.modality)} size={24} color="#FFFFFF" />
            )}

            {/* Star Reward Pill */}
            <View style={styles.starPill}>
              <Ionicons name="star" size={11} color={VARCHLEARN_COLORS.starGold} />
              <Text style={styles.starPillText}>{node.activity.starReward}</Text>
            </View>
          </TouchableOpacity>
        );

        return (
          <View
            key={node.id}
            style={[
              styles.nodeAnchor,
              {
                left: pt.x - 36,
                top: pt.y - 36,
              },
            ]}
          >
            {isCurrent ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.currentHalo}>{nodeContent}</View>
              </Animated.View>
            ) : (
              nodeContent
            )}

            <View style={styles.nodeLabelBox}>
              <Text style={styles.nodeTitle} numberOfLines={1}>
                {node.activity.gameType}
              </Text>
              <Text style={styles.nodeSub} numberOfLines={1}>
                {meta.studentName}
                {node.isCarriedForward ? ` • ${node.assignedDate}` : ''}
              </Text>
              {isCurrent ? (
                <View style={styles.tapBadge}>
                  <Text style={styles.tapBadgeText}>Tap to start!</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#EAF7E3',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#CBE9BC',
    position: 'relative',
  },
  hillTop: {
    position: 'absolute',
    top: -40,
    left: -30,
    right: -30,
    height: 180,
    backgroundColor: '#DDF3D2',
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
  },
  hillMid: {
    position: 'absolute',
    top: 320,
    left: -50,
    right: -50,
    height: 240,
    backgroundColor: '#E1F5D7',
    borderRadius: 200,
  },
  mascotSpot: {
    position: 'absolute',
    alignItems: 'center',
    width: 92,
    zIndex: 2,
  },
  miniSpeech: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    marginTop: 2,
  },
  miniSpeechText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
  nodeAnchor: {
    position: 'absolute',
    width: 72,
    alignItems: 'center',
    zIndex: 5,
  },
  currentHalo: {
    padding: 4,
    borderRadius: 42,
    backgroundColor: 'rgba(112, 65, 198, 0.22)',
  },
  nodeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39245F',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  starPill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  starPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.textPrimary,
  },
  nodeLabelBox: {
    marginTop: 8,
    alignItems: 'center',
    width: 104,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  nodeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.textPrimary,
  },
  nodeSub: {
    fontSize: 9.5,
    color: VARCHLEARN_COLORS.textSecondary,
  },
  tapBadge: {
    marginTop: 2,
    backgroundColor: VARCHLEARN_COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tapBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
});
