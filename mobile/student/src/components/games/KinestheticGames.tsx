import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ActivityItem } from '../../../../../shared/types';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { PrimaryButton } from '../PrimaryButton';

interface GameProps {
  activity: ActivityItem;
  onComplete: (correct: number, total: number) => void;
}

// 1. Model Builder (Interactive System & Component Assembly)
const ModelBuilderGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const dynamicParts = activity.customization?.learningInput?.interactiveModelParts;
  const hasDynamicParts = Array.isArray(dynamicParts) && dynamicParts.length >= 2;
  const hasExpSlots = Array.isArray(exp?.workbenchSlots) && exp.workbenchSlots.length >= 2;

  const slots = hasExpSlots
    ? exp.workbenchSlots.map((s: any) => ({
        id: s.expectedComponentId || s.id,
        label: s.label,
      }))
    : hasDynamicParts
    ? dynamicParts.map((p, idx) => ({ id: `part_${idx}`, label: p }))
    : [
        { id: 'flower', label: 'Top: Flower (Attracts pollinators)' },
        { id: 'leaves', label: 'Middle: Leaves (Make food via sunlight)' },
        { id: 'stem', label: 'Support: Stem (Carries water and sap)' },
        { id: 'roots', label: 'Base: Roots (Absorbs water underground)' },
      ];

  const trayParts = hasExpSlots && Array.isArray(exp?.modelComponents) && exp.modelComponents.length >= 2
    ? exp.modelComponents.map((c: any) => ({ id: c.id, name: c.name }))
    : hasDynamicParts
    ? dynamicParts.map((p, idx) => ({ id: `part_${idx}`, name: p }))
    : [
        { id: 'roots', name: 'ROOTS' },
        { id: 'stem', name: 'STEM' },
        { id: 'leaves', name: 'LEAVES' },
        { id: 'flower', name: 'FLOWER' },
      ];

  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handlePlace = (slotId: string) => {
    if (selectedPart === slotId) {
      const next = { ...placed, [slotId]: true };
      setPlaced(next);
      setSelectedPart(null);
      if (Object.keys(next).length === slots.length) {
        setTimeout(() => onComplete(slots.length, slots.length), 350);
      }
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Assemble the {activity.topic || 'System'} Model!</Text>
      <Text style={styles.sub}>1. Tap a component in the tray • 2. Tap its matching slot on the workbench</Text>

      <View style={styles.workbench}>
        {slots.map((s: any) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => handlePlace(s.id)}
            style={[styles.slotZone, placed[s.id] && styles.slotFilled]}
          >
            <Text style={styles.slotText}>
              {placed[s.id] ? `✅ ${s.label}` : `⬜ Place here: ${s.label}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.trayRow}>
        {trayParts.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            disabled={!!placed[item.id]}
            onPress={() => setSelectedPart(item.id)}
            style={[
              styles.trayChip,
              selectedPart === item.id && styles.trayActive,
              placed[item.id] && styles.trayDone,
            ]}
          >
            <Text style={styles.trayText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 2. Virtual Experiment (Variable Simulation)
const VirtualExperimentGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const simVars = exp?.simulationVariables?.length
    ? exp.simulationVariables
    : [
        { name: 'water', label: 'Water Level', min: 1, max: 3, optimalValue: 2, unit: '/3' },
        { name: 'sun', label: 'Sunlight Level', min: 1, max: 3, optimalValue: 2, unit: '/3' },
      ];

  const [varValues, setVarValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const v of simVars) {
      init[v.name] = v.initial ?? v.min ?? 1;
    }
    return init;
  });
  const [tested, setTested] = useState(false);

  const isBalanced = simVars.every(
    (v: any) => varValues[v.name] === (v.optimalValue ?? Math.round((v.min + v.max) / 2))
  );

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Virtual Experiment: {activity.topic || 'System'} Simulation</Text>
      <View style={styles.labCard}>
        <Text style={styles.plantEmoji}>
          {!tested ? '⚙️' : isBalanced ? '🌟' : '⚠️'}
        </Text>
        <Text style={styles.sub}>
          {!tested
            ? 'Adjust the system parameters to reach optimal equilibrium, then run!'
            : isBalanced
            ? `Success! All parameters harmonized. ${exp?.completionFeedback || 'Optimal equilibrium achieved!'}`
            : 'Parameters out of balance! Adjust variables toward their optimal levels and retry.'}
        </Text>
      </View>

      {simVars.map((v: any) => {
        const curVal = varValues[v.name] ?? v.min;
        const range = [];
        for (let i = v.min || 1; i <= (v.max || 3); i++) range.push(i);
        return (
          <View key={v.name} style={styles.controlRow}>
            <Text style={styles.ctrlLabel}>
              {v.label}: {curVal}{v.unit ? ` ${v.unit}` : ''}
            </Text>
            <View style={styles.ctrlBtns}>
              {range.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setVarValues({ ...varValues, [v.name]: val })}
                  style={[styles.numBtn, curVal === val && styles.trayActive]}
                >
                  <Text style={styles.trayText}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <PrimaryButton
        title="Run Simulation"
        onPress={() => {
          setTested(true);
          if (isBalanced) {
            setTimeout(() => onComplete(1, 1), 600);
          }
        }}
      />
    </View>
  );
};

// 3. Drag-and-Drop Challenge & 4. Object Sorting
const SortingChallengeGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const hasExpSorting = Array.isArray(exp?.sortingItems) && exp.sortingItems.length >= 2;
  const isHabitat = activity.gameType === 'Drag-and-Drop Challenge';

  const items = hasExpSorting
    ? exp.sortingItems.map((item: any) => ({ name: item.text, bin: item.bucketId }))
    : isHabitat
    ? [
        { name: '🐟 Fish', bin: 'Ocean' },
        { name: '🌵 Cactus', bin: 'Desert' },
        { name: '🐒 Monkey', bin: 'Forest' },
      ]
    : [
        { name: '🪵 Wooden Spoon', bin: 'Floats' },
        { name: '🔑 Iron Key', bin: 'Sinks' },
        { name: '🪨 Stone', bin: 'Sinks' },
      ];

  const bins = hasExpSorting && Array.isArray(exp?.sortingBuckets) && exp.sortingBuckets.length >= 2
    ? exp.sortingBuckets.map((b: any) => b.id)
    : isHabitat
    ? ['Ocean', 'Desert', 'Forest']
    : ['Floats', 'Sinks'];

  const bucketNameMap = hasExpSorting && Array.isArray(exp?.sortingBuckets)
    ? exp.sortingBuckets.reduce((acc: any, b: any) => ({ ...acc, [b.id]: b.name }), {})
    : {};

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const current = items[idx];

  const handleBin = (bin: string) => {
    const nextScore = bin === current.bin ? score + 1 : score;
    if (idx + 1 < items.length) {
      setScore(nextScore);
      setIdx(idx + 1);
    } else {
      onComplete(nextScore, items.length);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Place each object into the right category:</Text>
      <View style={styles.labCard}>
        <Text style={{ fontSize: 22, fontWeight: '800', textAlign: 'center' }}>{current.name}</Text>
        <Text style={styles.sub}>
          Item {idx + 1} of {items.length}
        </Text>
      </View>
      <View style={styles.trayRow}>
        {bins.map((b: string) => (
          <TouchableOpacity key={b} style={styles.binBtn} onPress={() => handleBin(b)}>
            <Text style={styles.binText}>{bucketNameMap[b] || b}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 5. Mechanism Challenge (Pipe & Valve alignment)
const MechanismChallengeGame: React.FC<GameProps> = ({ onComplete }) => {
  const [valves, setValves] = useState([false, true, false]);
  const toggle = (i: number) => {
    const next = valves.map((v, idx) => (idx === i ? !v : v));
    setValves(next);
    if (next.every(Boolean)) {
      setTimeout(() => onComplete(1, 1), 400);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Open all 3 valves so the conduit activates!</Text>
      <View style={styles.trayRow}>
        {valves.map((open, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => toggle(i)}
            style={[styles.binBtn, open && styles.slotFilled]}
          >
            <Text style={styles.binText}>{open ? `Valve ${i + 1}: OPEN` : `Valve ${i + 1}: CLOSED`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 6. Build in Order (Process Sequencing)
const BuildInOrderGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const hasSteps = Array.isArray(exp?.processSteps) && exp.processSteps.length >= 2;
  const sortedSteps = hasSteps
    ? [...exp.processSteps].sort((a: any, b: any) => (a.stepNumber || 0) - (b.stepNumber || 0))
    : [];
  const correct = hasSteps
    ? sortedSteps.map((s: any) => s.label)
    : ['Evaporation', 'Condensation', 'Precipitation', 'Collection'];

  const [choices] = useState(() =>
    hasSteps
      ? [...correct].sort(() => Math.random() - 0.5)
      : ['Precipitation', 'Evaporation', 'Collection', 'Condensation']
  );
  const [built, setBuilt] = useState<string[]>([]);

  const handleTap = (step: string) => {
    if (built.includes(step)) return;
    const next = [...built, step];
    setBuilt(next);
    if (next.length === correct.length) {
      const score = next.filter((v, i) => v === correct[i]).length;
      setTimeout(() => onComplete(score, correct.length), 350);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Arrange the sequence stages in functional order (1 → {correct.length})!</Text>
      <View style={styles.labCard}>
        <Text style={styles.sub}>{built.join(' → ') || 'Tap stages below in order'}</Text>
      </View>
      <View style={styles.trayRow}>
        {choices.map((c) => (
          <TouchableOpacity
            key={c}
            disabled={built.includes(c)}
            onPress={() => handleTap(c)}
            style={[styles.trayChip, built.includes(c) && styles.trayDone]}
          >
            <Text style={styles.trayText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export const KinestheticGameRouter: React.FC<GameProps> = (props) => {
  switch (props.activity.gameType) {
    case 'Model Builder':
      return <ModelBuilderGame {...props} />;
    case 'Virtual Experiment':
      return <VirtualExperimentGame {...props} />;
    case 'Drag-and-Drop Challenge':
    case 'Object Sorting':
      return <SortingChallengeGame {...props} />;
    case 'Mechanism Challenge':
      return <MechanismChallengeGame {...props} />;
    case 'Build in Order':
    default:
      return <BuildInOrderGame {...props} />;
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
  sub: { fontSize: 13, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  workbench: { gap: 8 },
  slotZone: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#06B6D4',
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  slotText: { fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  trayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  trayChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#67E8F9',
  },
  trayActive: { backgroundColor: '#CFFAFE', borderColor: VARCHLEARN_COLORS.primary },
  trayDone: { opacity: 0.35 },
  trayText: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  labCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  plantEmoji: { fontSize: 48 },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
  },
  ctrlLabel: { fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  ctrlBtns: { flexDirection: 'row', gap: 8 },
  numBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  binBtn: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  binText: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple, textAlign: 'center' },
});
