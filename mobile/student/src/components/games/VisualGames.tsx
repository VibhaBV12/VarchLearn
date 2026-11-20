import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { ActivityItem } from '../../../../../shared/types';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { PrimaryButton } from '../PrimaryButton';

interface GameProps {
  activity: ActivityItem;
  onComplete: (correct: number, total: number) => void;
}

// 1. Diagram Detective (Interactive Concept & Diagram Exploration)
const DiagramDetectiveGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const isPlantTopic =
    (activity.topic && activity.topic.toLowerCase().includes('plant')) ||
    (activity.name && activity.name.toLowerCase().includes('plant')) ||
    (activity.customization?.learningInput?.diagramTitle &&
      activity.customization.learningInput.diagramTitle.toLowerCase().includes('plant'));

  const parts = activity.customization.learningInput?.diagramParts || [
    { id: 'flower', label: 'Flower', description: 'Makes seeds and attracts pollinators.', x: 50, y: 18 },
    { id: 'leaf', label: 'Leaf', description: 'Makes food using sunlight through photosynthesis.', x: 74, y: 40 },
    { id: 'stem', label: 'Stem', description: 'Carries water and nutrients up to the leaves.', x: 50, y: 55 },
    { id: 'roots', label: 'Roots', description: 'Absorbs water and minerals from soil.', x: 50, y: 84 },
  ];

  const diagramTitle = activity.customization.learningInput?.diagramTitle || `${activity.topic} Diagram`;
  const [inspected, setInspected] = useState<string[]>([]);
  const [activeInfo, setActiveInfo] = useState<string>(
    'Tap each glowing component on the diagram to inspect its role!'
  );
  const [phase, setPhase] = useState<'explore' | 'quiz'>('explore');
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);

  const quizTargets = parts.map((p) => p.id).slice(0, Math.min(parts.length, 4));

  const handleInspect = (id: string, desc: string, label: string) => {
    setActiveInfo(`${label}: ${desc}`);
    if (!inspected.includes(id)) {
      setInspected([...inspected, id]);
    }
  };

  const requiredInspections = Math.min(parts.length, 3);

  if (phase === 'explore') {
    return (
      <View style={styles.box}>
        <Text style={styles.heading}>Step 1: Explore {diagramTitle}</Text>
        <View style={styles.diagramCard}>
          <Svg width={220} height={220} viewBox="0 0 100 100">
            {isPlantTopic ? (
              <>
                {/* Soil */}
                <Rect x="10" y="75" width="80" height="22" rx="6" fill="#D97706" opacity={0.25} />
                {/* Roots */}
                <Path d="M50 75 Q42 86 35 92 M50 75 Q50 88 50 95 M50 75 Q58 86 65 92" stroke="#92400E" strokeWidth="3" fill="none" />
                {/* Stem */}
                <Path d="M50 75 L50 28" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" />
                {/* Leaf */}
                <Ellipse cx="68" cy="46" rx="16" ry="8" fill="#22C55E" />
                <Ellipse cx="32" cy="52" rx="14" ry="7" fill="#22C55E" />
                {/* Flower */}
                <Circle cx="50" cy="20" r="10" fill="#F59E0B" />
                <Circle cx="50" cy="20" r="5" fill="#FEF3C7" />
              </>
            ) : (
              <>
                {/* Dynamic Conceptual Schematic */}
                <Rect x="5" y="5" width="90" height="90" rx="12" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1.5" />
                {/* Connect adjacent nodes */}
                {parts.map((p, idx) => {
                  if (idx === 0) return null;
                  const prev = parts[idx - 1];
                  return (
                    <Path
                      key={`line-${idx}`}
                      d={`M${prev.x} ${prev.y} L${p.x} ${p.y}`}
                      stroke="#A855F7"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                    />
                  );
                })}
                {/* Interactive Node Hotspots */}
                {parts.map((p) => {
                  const isDone = inspected.includes(p.id);
                  return (
                    <React.Fragment key={`node-${p.id}`}>
                      <Circle cx={p.x} cy={p.y} r="10" fill={isDone ? '#22C55E' : '#7041C6'} opacity={0.2} />
                      <Circle cx={p.x} cy={p.y} r="6" fill={isDone ? '#16A34A' : '#7041C6'} />
                      <Circle cx={p.x} cy={p.y} r="2.5" fill="#FFFFFF" />
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </Svg>
          <View style={styles.hotspotRow}>
            {parts.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => handleInspect(p.id, p.description, p.label)}
                style={[styles.chip, inspected.includes(p.id) && styles.chipDone]}
              >
                <Text style={styles.chipText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.infoText}>{activeInfo}</Text>
        </View>
        <PrimaryButton
          title={
            inspected.length >= requiredInspections
              ? 'Start Diagram Quiz!'
              : `Inspect ${requiredInspections - inspected.length} more parts`
          }
          disabled={inspected.length < requiredInspections}
          onPress={() => setPhase('quiz')}
        />
      </View>
    );
  }

  const targetPart = parts.find((p) => p.id === quizTargets[qIdx]) || parts[0];
  return (
    <View style={styles.box}>
      <Text style={styles.heading}>
        Clue {qIdx + 1} of {quizTargets.length}
      </Text>
      <View style={styles.card}>
        <Text style={styles.prompt}>Which component: "{targetPart.description}"</Text>
      </View>
      <View style={styles.grid2}>
        {parts.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.gridBtn}
            onPress={() => {
              const nextScore = p.id === targetPart.id ? score + 1 : score;
              if (qIdx + 1 < quizTargets.length) {
                setScore(nextScore);
                setQIdx(qIdx + 1);
              } else {
                onComplete(nextScore, quizTargets.length);
              }
            }}
          >
            <Text style={styles.gridBtnText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 2. Picture Memory Match
const PictureMemoryMatchGame: React.FC<GameProps> = ({ onComplete }) => {
  const symbols = ['🍎', '⭐', '🌸', '🌳', '🍎', '⭐', '🌸', '🌳'];
  const [cards] = useState(() => [...symbols].sort(() => Math.random() - 0.5));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  const handleTap = (idx: number) => {
    if (flipped.includes(idx) || matched.includes(idx) || flipped.length === 2) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next;
      if (cards[a] === cards[b]) {
        const nextMatched = [...matched, a, b];
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === cards.length) {
          setTimeout(() => onComplete(4, 4), 450);
        }
      } else {
        setTimeout(() => setFlipped([]), 650);
      }
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Match all 4 picture pairs! ({matched.length / 2}/4)</Text>
      <View style={styles.memoryGrid}>
        {cards.map((sym, idx) => {
          const open = flipped.includes(idx) || matched.includes(idx);
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleTap(idx)}
              style={[styles.memCard, open && styles.memCardOpen]}
            >
              <Text style={styles.memText}>{open ? sym : '?'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// 3. Pattern Recognition
const PatternRecognitionGame: React.FC<GameProps> = ({ onComplete }) => {
  const patterns = [
    { seq: ['⭐', '🟣', '⭐', '🟣', '⭐', '?'], options: ['🟣', '🔺', '🟩'], answer: '🟣' },
    { seq: ['🔺', '🔺', '🟩', '🔺', '🔺', '?'], options: ['⭐', '🟩', '🟣'], answer: '🟩' },
  ];
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const p = patterns[idx];

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Which shape completes the pattern?</Text>
      <View style={styles.patternRow}>
        {p.seq.map((item, i) => (
          <View key={i} style={styles.patternCell}>
            <Text style={styles.patternEmoji}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid2}>
        {p.options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.gridBtn}
            onPress={() => {
              const nextScore = opt === p.answer ? score + 1 : score;
              if (idx + 1 < patterns.length) {
                setScore(nextScore);
                setIdx(idx + 1);
              } else {
                onComplete(nextScore, patterns.length);
              }
            }}
          >
            <Text style={{ fontSize: 28 }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 4. Jigsaw Puzzle (3x3 swap)
const JigsawPuzzleGame: React.FC<GameProps> = ({ onComplete }) => {
  const target = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
  const [tiles, setTiles] = useState(['2️⃣', '1️⃣', '3️⃣', '5️⃣', '4️⃣', '6️⃣']);
  const [selected, setSelected] = useState<number | null>(null);

  const handleTap = (idx: number) => {
    if (selected === null) {
      setSelected(idx);
      return;
    }
    const copy = [...tiles];
    [copy[selected], copy[idx]] = [copy[idx], copy[selected]];
    setTiles(copy);
    setSelected(null);
    if (copy.every((v, i) => v === target[i])) {
      setTimeout(() => onComplete(1, 1), 350);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Tap two tiles to swap them into order (1 → 6)!</Text>
      <View style={styles.memoryGrid}>
        {tiles.map((t, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleTap(i)}
            style={[styles.memCard, styles.memCardOpen, selected === i && styles.tileSelected]}
          >
            <Text style={styles.memText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 5. Visual Maze
const VisualMazeGame: React.FC<GameProps> = ({ onComplete }) => {
  // 4x4 grid: 0 open, 1 wall
  const grid = [
    [0, 0, 1, 0],
    [1, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ];
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const goal = { r: 3, c: 3 };

  const move = (dr: number, dc: number) => {
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr >= 4 || nc < 0 || nc >= 4 || grid[nr][nc] === 1) return;
    setPos({ r: nr, c: nc });
    if (nr === goal.r && nc === goal.c) {
      setTimeout(() => onComplete(1, 1), 300);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Guide 🦋 to the 🌸 flower!</Text>
      <View style={styles.mazeWrap}>
        {grid.map((row, r) => (
          <View key={r} style={styles.mazeRow}>
            {row.map((cell, c) => {
              const isPlayer = pos.r === r && pos.c === c;
              const isGoal = goal.r === r && goal.c === c;
              return (
                <View key={c} style={[styles.mazeCell, cell === 1 && styles.mazeWall]}>
                  <Text style={{ fontSize: 22 }}>
                    {isPlayer ? '🦋' : isGoal ? '🌸' : cell === 1 ? '🌿' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.arrowPad}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => move(-1, 0)}>
          <Text style={styles.arrowText}>⬆️</Text>
        </TouchableOpacity>
        <View style={styles.arrowMid}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => move(0, -1)}>
            <Text style={styles.arrowText}>⬅️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => move(1, 0)}>
            <Text style={styles.arrowText}>⬇️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => move(0, 1)}>
            <Text style={styles.arrowText}>➡️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// 6. Picture Sequence Challenge
const PictureSequenceGame: React.FC<GameProps> = ({ onComplete }) => {
  const correctOrder = ['🌰 Seed', '🌱 Sprout', '🌿 Sapling', '🌳 Tree'];
  const [choices] = useState(['🌿 Sapling', '🌰 Seed', '🌳 Tree', '🌱 Sprout']);
  const [picked, setPicked] = useState<string[]>([]);

  const handlePick = (item: string) => {
    if (picked.includes(item)) return;
    const next = [...picked, item];
    setPicked(next);
    if (next.length === correctOrder.length) {
      const score = next.filter((v, i) => v === correctOrder[i]).length;
      setTimeout(() => onComplete(score, correctOrder.length), 350);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Tap the stages from first to last!</Text>
      <View style={styles.card}>
        <Text style={styles.prompt}>Your Order: {picked.join(' → ') || 'Tap cards below'}</Text>
      </View>
      <View style={styles.grid2}>
        {choices.map((c) => (
          <TouchableOpacity
            key={c}
            disabled={picked.includes(c)}
            onPress={() => handlePick(c)}
            style={[styles.gridBtn, picked.includes(c) && styles.chipDone]}
          >
            <Text style={styles.gridBtnText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export const VisualGameRouter: React.FC<GameProps> = (props) => {
  switch (props.activity.gameType) {
    case 'Diagram Detective':
      return <DiagramDetectiveGame {...props} />;
    case 'Picture Memory Match':
      return <PictureMemoryMatchGame {...props} />;
    case 'Pattern Recognition':
      return <PatternRecognitionGame {...props} />;
    case 'Jigsaw Puzzle':
      return <JigsawPuzzleGame {...props} />;
    case 'Visual Maze':
      return <VisualMazeGame {...props} />;
    case 'Picture Sequence Challenge':
    default:
      return <PictureSequenceGame {...props} />;
  }
};

const styles = StyleSheet.create({
  box: { gap: 14 },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
  diagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    gap: 10,
  },
  hotspotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  chipDone: { backgroundColor: '#DCFCE7', borderColor: '#22C55E', opacity: 0.7 },
  chipText: { fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary, fontSize: 13 },
  infoText: { textAlign: 'center', color: VARCHLEARN_COLORS.textSecondary, fontSize: 13.5 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  prompt: { fontSize: 15.5, fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  gridBtn: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  gridBtnText: { fontSize: 15, fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  memCard: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: VARCHLEARN_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memCardOpen: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: VARCHLEARN_COLORS.primary },
  tileSelected: { borderColor: VARCHLEARN_COLORS.starGold, borderWidth: 3 },
  memText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  patternRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  patternCell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  patternEmoji: { fontSize: 22 },
  mazeWrap: { alignSelf: 'center', gap: 4 },
  mazeRow: { flexDirection: 'row', gap: 4 },
  mazeCell: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  mazeWall: { backgroundColor: '#DCFCE7' },
  arrowPad: { alignItems: 'center', gap: 6 },
  arrowMid: { flexDirection: 'row', gap: 12 },
  arrowBtn: {
    width: 50,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  arrowText: { fontSize: 20 },
});
