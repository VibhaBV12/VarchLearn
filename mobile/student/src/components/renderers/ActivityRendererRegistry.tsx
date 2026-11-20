import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ActivityItem, ActivitySpecification, ActivityRendererType } from '../../../../../shared/types';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { PrimaryButton } from '../PrimaryButton';
import { AudioPlayerBar } from '../games/AudioPlayerBar';

interface RendererProps {
  activity: ActivityItem;
  spec: ActivitySpecification;
  onComplete: (correctCount: number, totalCount: number) => void;
}

// 1. SEQUENCE BUILDER RENDERER (e.g., Water Cycle stages: Evaporation -> Condensation -> Precipitation)
export const SequenceBuilderRenderer: React.FC<RendererProps> = ({ spec, onComplete }) => {
  const elements = spec.interactionData.availableElements || [];
  const expectedSeq = spec.interactionData.correctSolution.expectedSequence || elements.map((e) => e.id);
  const [placed, setPlaced] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePick = (elemId: string) => {
    if (placed.includes(elemId) || isSuccess) return;
    const next = [...placed, elemId];
    setPlaced(next);

    // Immediate action feedback
    const targetIdx = next.length - 1;
    if (next[targetIdx] === expectedSeq[targetIdx]) {
      const el = elements.find((e) => e.id === elemId);
      setFeedbackMsg(`✅ Step ${next.length} (${el?.label}): Correct order!`);
    } else {
      setFeedbackMsg(`⚠️ Step ${next.length}: Out of expected order. Keep going or tap to reset.`);
    }

    if (next.length === expectedSeq.length) {
      const correctCount = next.filter((id, i) => id === expectedSeq[i]).length;
      if (correctCount === expectedSeq.length) {
        setIsSuccess(true);
        setFeedbackMsg(spec.feedback.correct);
        setTimeout(() => onComplete(expectedSeq.length, expectedSeq.length), 650);
      } else {
        setFeedbackMsg(spec.feedback.incorrect);
      }
    }
  };

  const handleReset = () => {
    setPlaced([]);
    setFeedbackMsg(null);
    setIsSuccess(false);
  };

  return (
    <View style={styles.card}>
      {/* Phase 1: Conceptual Overview / Demonstration */}
      <View style={styles.learningHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>PHASE 1: CONCEPT OVERVIEW</Text>
        </View>
        <Text style={styles.overviewText}>{spec.learningContent.overview}</Text>
        <Text style={styles.takeawayText}>💡 {spec.learningContent.keyTakeaway}</Text>
      </View>

      {/* Phase 2: Interactive Task */}
      <View style={styles.taskSection}>
        <Text style={styles.sectionHeading}>Phase 2: {spec.title}</Text>
        <Text style={styles.instructionsText}>{spec.studentInstructions}</Text>

        {/* Sequence Slots */}
        <View style={styles.slotsRow}>
          {expectedSeq.map((_, idx) => {
            const placedId = placed[idx];
            const elem = elements.find((e) => e.id === placedId);
            const isCorrect = placedId === expectedSeq[idx];
            return (
              <View
                key={idx}
                style={[
                  styles.sequenceSlot,
                  placedId ? (isCorrect ? styles.slotSuccess : styles.slotWarning) : undefined,
                ]}
              >
                <Text style={styles.slotNumber}>Stage {idx + 1}</Text>
                <Text style={styles.slotLabel}>{elem ? elem.label : 'Drop Stage Here'}</Text>
              </View>
            );
          })}
        </View>

        {/* Available Stage Elements */}
        <View style={styles.chipsRow}>
          {elements.map((el) => {
            const isUsed = placed.includes(el.id);
            return (
              <TouchableOpacity
                key={el.id}
                disabled={isUsed || isSuccess}
                onPress={() => handlePick(el.id)}
                style={[styles.draggableChip, isUsed && styles.chipUsed]}
              >
                <Ionicons name="swap-vertical" size={16} color={isUsed ? '#9CA3AF' : '#7041C6'} />
                <Text style={[styles.chipText, isUsed && styles.chipTextUsed]}>{el.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedbackMsg ? (
          <View style={[styles.feedbackBanner, isSuccess ? styles.bannerSuccess : styles.bannerNotice]}>
            <Text style={styles.feedbackBannerText}>{feedbackMsg}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color="#4B5563" />
            <Text style={styles.resetBtnText}>Reset Sequence</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// 2. DIAGRAM LABEL RENDERER (e.g. Labelling plant/organ parts, circuits, or concept maps)
export const DiagramLabelRenderer: React.FC<RendererProps> = ({ spec, onComplete }) => {
  const elements = spec.interactionData.availableElements || [];
  const zones = spec.interactionData.targetZones || [];
  const [selectedElem, setSelectedElem] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({}); // zoneId -> elemId
  const [inspectedNode, setInspectedNode] = useState<string | null>(null);

  const handleZoneTap = (zoneId: string) => {
    if (!selectedElem) return;
    const targetZone = zones.find((z) => z.id === zoneId);
    const isExpected = targetZone?.expectedElementId === selectedElem;

    const next = { ...matched, [zoneId]: selectedElem };
    setMatched(next);
    setSelectedElem(null);

    if (Object.keys(next).length === zones.length) {
      const correct = zones.filter((z) => next[z.id] === z.expectedElementId).length;
      setTimeout(() => onComplete(correct, zones.length), 450);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.learningHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>PHASE 1: DIAGRAM INSPECTION</Text>
        </View>
        <Text style={styles.overviewText}>{spec.learningContent.overview}</Text>
      </View>

      {/* Schematic Canvas */}
      <View style={styles.diagramCanvas}>
        <Svg width="100%" height={180} viewBox="0 0 100 100">
          <Rect x="5" y="5" width="90" height="90" rx="10" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1.5" />
          {zones.map((z, i) => {
            const x = 25 + (i % 2) * 50;
            const y = 30 + Math.floor(i / 2) * 40;
            const isDone = !!matched[z.id];
            return (
              <React.Fragment key={z.id}>
                <Circle cx={x} cy={y} r="10" fill={isDone ? '#22C55E' : '#7041C6'} opacity={0.25} />
                <Circle cx={x} cy={y} r="5" fill={isDone ? '#16A34A' : '#7041C6'} />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Zones & Element Hotspots */}
      <Text style={styles.sectionHeading}>Target Zones ({Object.keys(matched).length}/{zones.length})</Text>
      <View style={styles.zonesGrid}>
        {zones.map((z) => {
          const filledId = matched[z.id];
          const filledElem = elements.find((e) => e.id === filledId);
          return (
            <TouchableOpacity
              key={z.id}
              style={[styles.zoneBox, filledId ? styles.zoneFilled : undefined]}
              onPress={() => handleZoneTap(z.id)}
            >
              <Text style={styles.zoneBoxTitle}>{z.label}</Text>
              <Text style={styles.zoneBoxValue}>
                {filledElem ? `✅ ${filledElem.label}` : 'Tap here to assign selected label'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Available Labels Tray */}
      <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Available Labels</Text>
      <View style={styles.chipsRow}>
        {elements.map((el) => {
          const isPlaced = Object.values(matched).includes(el.id);
          const isSelected = selectedElem === el.id;
          return (
            <TouchableOpacity
              key={el.id}
              disabled={isPlaced}
              onPress={() => setSelectedElem(isSelected ? null : el.id)}
              style={[
                styles.draggableChip,
                isSelected ? styles.chipActive : undefined,
                isPlaced ? styles.chipUsed : undefined,
              ]}
            >
              <Text style={[styles.chipText, isSelected && { color: '#FFFFFF' }]}>{el.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// 3. SORTING / CATEGORISATION RENDERER (e.g. Floating vs Sinking, Active vs Passive)
export const SortingRenderer: React.FC<RendererProps> = ({ spec, onComplete }) => {
  const elements = spec.interactionData.availableElements || [];
  const zones = spec.interactionData.targetZones || [
    { id: 'zone_active', label: 'Primary Mechanisms' },
    { id: 'zone_passive', label: 'Supporting Components' },
  ];
  const expectedCats = spec.interactionData.correctSolution.expectedCategories || {};

  const [activeIdx, setActiveIdx] = useState(0);
  const [sorted, setSorted] = useState<Record<string, string>>({}); // elemId -> zoneId
  const current = elements[activeIdx];

  const handleCategorize = (zoneId: string) => {
    if (!current) return;
    const next = { ...sorted, [current.id]: zoneId };
    setSorted(next);

    if (activeIdx + 1 < elements.length) {
      setActiveIdx(activeIdx + 1);
    } else {
      let correct = 0;
      for (const [zId, elemIds] of Object.entries(expectedCats)) {
        for (const eId of elemIds) {
          if (next[eId] === zId) correct++;
        }
      }
      onComplete(Math.max(correct, 1), elements.length);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.learningHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>PHASE 1: CATEGORIZATION OVERVIEW</Text>
        </View>
        <Text style={styles.overviewText}>{spec.learningContent.overview}</Text>
      </View>

      {current ? (
        <View style={styles.sortingActiveCard}>
          <Text style={styles.sortingBadge}>Item {activeIdx + 1} of {elements.length}</Text>
          <Text style={styles.sortingItemTitle}>{current.label}</Text>
          {current.description ? (
            <Text style={styles.sortingItemDesc}>{current.description}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionHeading}>Sort into Target Category:</Text>
      <View style={styles.bucketRow}>
        {zones.map((z) => (
          <TouchableOpacity
            key={z.id}
            style={styles.bucketBtn}
            onPress={() => handleCategorize(z.id)}
          >
            <Ionicons name="folder-open" size={20} color="#7041C6" />
            <Text style={styles.bucketBtnText}>{z.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 4. VARIABLE SIMULATION RENDERER (e.g. adjust flow, temperature, or balance)
export const VariableSimulationRenderer: React.FC<RendererProps> = ({ spec, onComplete }) => {
  const vars = spec.interactionData.correctSolution.expectedVariables || { balance: 2 };
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const k of Object.keys(vars)) init[k] = 1;
    return init;
  });
  const [tested, setTested] = useState(false);

  const isEquilibrium = Object.entries(vars).every(([k, v]) => values[k] === v);

  const handleTest = () => {
    setTested(true);
    if (isEquilibrium) {
      setTimeout(() => onComplete(Object.keys(vars).length, Object.keys(vars).length), 500);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.learningHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>PHASE 1: SYSTEMIC SIMULATION</Text>
        </View>
        <Text style={styles.overviewText}>{spec.learningContent.overview}</Text>
      </View>

      <View style={styles.simStatusBox}>
        <Text style={styles.simStatusIcon}>{isEquilibrium && tested ? '🌟' : '⚙️'}</Text>
        <Text style={styles.simStatusText}>
          {!tested
            ? 'Adjust parameters to achieve system equilibrium, then test.'
            : isEquilibrium
            ? spec.feedback.correct
            : spec.feedback.incorrect}
        </Text>
      </View>

      {Object.entries(vars).map(([name, opt]) => (
        <View key={name} style={styles.simControlRow}>
          <Text style={styles.simLabel}>{name.replace(/_/g, ' ').toUpperCase()}: {values[name]}/3</Text>
          <View style={styles.stepperBtns}>
            {[1, 2, 3].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setValues({ ...values, [name]: val })}
                style={[styles.stepperBtn, values[name] === val && styles.stepperActive]}
              >
                <Text style={[styles.stepperBtnText, values[name] === val && { color: '#FFFFFF' }]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <PrimaryButton title="Run Simulation Test" onPress={handleTest} />
    </View>
  );
};

// 5. FILL IN THE BLANK / MISSING INFO RENDERER
export const FillBlankRenderer: React.FC<RendererProps> = ({ spec, onComplete }) => {
  const elements = spec.interactionData.availableElements || [];
  const expectedFills = spec.interactionData.correctSolution.expectedFills || {};
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [fills, setFills] = useState<Record<string, string>>({});

  const blanks = Object.keys(expectedFills).length > 0
    ? Object.keys(expectedFills)
    : ['blank_1', 'blank_2'];

  const handleFillSlot = (blankKey: string) => {
    if (!selectedWord) return;
    const next = { ...fills, [blankKey]: selectedWord };
    setFills(next);
    setSelectedWord(null);

    if (Object.keys(next).length === blanks.length) {
      let correct = 0;
      for (const k of blanks) {
        if (expectedFills[k]?.toLowerCase() === next[k]?.toLowerCase()) correct++;
      }
      setTimeout(() => onComplete(Math.max(correct, 1), blanks.length), 400);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.learningHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>PHASE 1: TEXT ANALYSIS</Text>
        </View>
        <Text style={styles.overviewText}>{spec.learningContent.overview}</Text>
      </View>

      <Text style={styles.sectionHeading}>Complete the Missing Information:</Text>
      <View style={styles.slotsRow}>
        {blanks.map((bKey, idx) => (
          <TouchableOpacity
            key={bKey}
            style={[styles.sequenceSlot, fills[bKey] ? styles.slotSuccess : undefined]}
            onPress={() => handleFillSlot(bKey)}
          >
            <Text style={styles.slotNumber}>Slot {idx + 1}</Text>
            <Text style={styles.slotLabel}>{fills[bKey] || 'Tap to fill selected word'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Word Bank:</Text>
      <View style={styles.chipsRow}>
        {elements.map((el) => {
          const isChosen = Object.values(fills).includes(el.label);
          const isSelected = selectedWord === el.label;
          return (
            <TouchableOpacity
              key={el.id}
              disabled={isChosen}
              onPress={() => setSelectedWord(isSelected ? null : el.label)}
              style={[
                styles.draggableChip,
                isSelected ? styles.chipActive : undefined,
                isChosen ? styles.chipUsed : undefined,
              ]}
            >
              <Text style={[styles.chipText, isSelected && { color: '#FFFFFF' }]}>{el.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// UNIVERSAL ACTIVITY RENDERER DISPATCHER
export const ActivityRendererDispatcher: React.FC<{
  activity: ActivityItem;
  onComplete: (correct: number, total: number) => void;
}> = ({ activity, onComplete }) => {
  const spec = activity.customization?.activitySpec;

  if (spec) {
    switch (spec.rendererType) {
      case 'SequenceBuilderRenderer':
        return <SequenceBuilderRenderer activity={activity} spec={spec} onComplete={onComplete} />;
      case 'DiagramLabelRenderer':
        return <DiagramLabelRenderer activity={activity} spec={spec} onComplete={onComplete} />;
      case 'SortingRenderer':
        return <SortingRenderer activity={activity} spec={spec} onComplete={onComplete} />;
      case 'VariableSimulationRenderer':
        return <VariableSimulationRenderer activity={activity} spec={spec} onComplete={onComplete} />;
      case 'FillBlankRenderer':
        return <FillBlankRenderer activity={activity} spec={spec} onComplete={onComplete} />;
      case 'DragDropRenderer':
        return <SequenceBuilderRenderer activity={activity} spec={spec} onComplete={onComplete} />;
      case 'ListeningComprehensionRenderer':
      case 'AudioSequenceRenderer':
        return (
          <View style={styles.card}>
            <AudioPlayerBar transcript={spec.learningContent.overview} label={spec.title} />
            <SequenceBuilderRenderer activity={activity} spec={spec} onComplete={onComplete} />
          </View>
        );
      case 'ReadingChallengeRenderer':
      case 'VisualMatchingRenderer':
      default:
        return <DiagramLabelRenderer activity={activity} spec={spec} onComplete={onComplete} />;
    }
  }

  // Fallback to existing activity view if no specification is attached
  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeading}>{activity.name}</Text>
      <Text style={styles.instructionsText}>
        {activity.customization?.instructions || 'Complete the interactive activity.'}
      </Text>
      <PrimaryButton title="Complete Activity" onPress={() => onComplete(1, 1)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2D6F8',
    gap: 14,
  },
  learningHeader: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  badgeRow: { flexDirection: 'row' },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7041C6',
    letterSpacing: 1,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  overviewText: { fontSize: 13.5, color: '#39245F', lineHeight: 20 },
  takeawayText: { fontSize: 12.5, fontWeight: '700', color: '#6B21A8' },
  taskSection: { gap: 10 },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: '#24163D' },
  instructionsText: { fontSize: 13, color: '#64587A', lineHeight: 18 },
  slotsRow: { gap: 8 },
  sequenceSlot: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotSuccess: { borderColor: '#10B981', backgroundColor: '#ECFDF5', borderStyle: 'solid' },
  slotWarning: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB', borderStyle: 'solid' },
  slotNumber: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  slotLabel: { fontSize: 13.5, fontWeight: '700', color: '#1F2937', flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  draggableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2D6F8',
  },
  chipActive: { backgroundColor: '#7041C6', borderColor: '#7041C6' },
  chipUsed: { opacity: 0.35 },
  chipText: { fontSize: 13, fontWeight: '700', color: '#39245F' },
  chipTextUsed: { color: '#9CA3AF' },
  feedbackBanner: { borderRadius: 12, padding: 10 },
  bannerSuccess: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7' },
  bannerNotice: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  feedbackBannerText: { fontSize: 12.5, fontWeight: '700', color: '#1F2937' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  resetBtnText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  diagramCanvas: {
    backgroundColor: '#FDFBFF',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D6F8',
  },
  zonesGrid: { gap: 8 },
  zoneBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#C084FC',
    gap: 2,
  },
  zoneFilled: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  zoneBoxTitle: { fontSize: 12, fontWeight: '800', color: '#7041C6' },
  zoneBoxValue: { fontSize: 13, color: '#374151' },
  sortingActiveCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#C084FC',
  },
  sortingBadge: { fontSize: 11, fontWeight: '800', color: '#7041C6' },
  sortingItemTitle: { fontSize: 18, fontWeight: '900', color: '#24163D' },
  sortingItemDesc: { fontSize: 12.5, color: '#64587A', textAlign: 'center' },
  bucketRow: { flexDirection: 'row', gap: 10 },
  bucketBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E2D6F8',
  },
  bucketBtnText: { fontSize: 13, fontWeight: '800', color: '#39245F', textAlign: 'center' },
  simStatusBox: {
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2D6F8',
  },
  simStatusIcon: { fontSize: 32 },
  simStatusText: { fontSize: 13, color: '#39245F', textAlign: 'center', fontWeight: '600' },
  simControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  simLabel: { fontSize: 13, fontWeight: '800', color: '#39245F' },
  stepperBtns: { flexDirection: 'row', gap: 6 },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperActive: { backgroundColor: '#7041C6' },
  stepperBtnText: { fontSize: 14, fontWeight: '800', color: '#374151' },
});
