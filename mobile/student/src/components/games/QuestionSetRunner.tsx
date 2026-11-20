import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ActivityItem, QuestionItem } from '../../../../../shared/types';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { PrimaryButton } from '../PrimaryButton';
import { AudioPlayerBar } from './AudioPlayerBar';

interface QuestionSetRunnerProps {
  activity?: ActivityItem;
  questions: QuestionItem[];
  onComplete: (correctCount: number, totalCount: number) => void;
}

export const QuestionSetRunner: React.FC<QuestionSetRunnerProps> = ({
  activity,
  questions,
  onComplete,
}) => {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[index];
  if (!q) return null;

  const exp = activity?.customization?.learningExperience as any;
  const learningInput = activity?.customization?.learningInput;

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
    if (selected === q.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setChecked(false);
    } else {
      onComplete(correctCount, questions.length);
    }
  };

  const renderModalityContext = () => {
    if (!activity) return null;

    if (activity.modality === 'auditory') {
      const script =
        exp?.narrationScript ||
        learningInput?.audioTranscript ||
        `Listen carefully to the principles of ${activity.topic || 'the concept'}.`;
      const segments = exp?.segments || learningInput?.audioSegments || [];
      return (
        <View style={styles.modalityHeaderCard}>
          <AudioPlayerBar transcript={script} label={`${activity.topic} Audio Study`} segments={segments} />
        </View>
      );
    }

    if (activity.modality === 'visual') {
      const title = exp?.title || learningInput?.diagramTitle || `${activity.topic} Diagram`;
      const nodes = exp?.nodes || learningInput?.diagramParts || [];
      return (
        <View style={styles.modalityVisualCard}>
          <Text style={styles.modalityTitle}>📐 {title}</Text>
          <Text style={styles.modalitySub}>
            {exp?.description || 'Inspect the key components of this diagram before answering:'}
          </Text>
          <View style={styles.nodeGrid}>
            {nodes.map((node: any, idx: number) => (
              <View key={node.id || idx} style={styles.nodeChip}>
                <Text style={styles.nodeLabel}>{node.label}</Text>
                <Text style={styles.nodeDesc} numberOfLines={2}>{node.description}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (activity.modality === 'read_write') {
      const passage =
        exp?.structuredPassage ||
        learningInput?.readingPassage ||
        `${activity.topic} demonstrates key conceptual mechanisms in this chapter.`;
      return (
        <View style={styles.modalityReadCard}>
          <Text style={styles.modalityTitle}>📖 {exp?.passageTitle || 'Core Reading Passage'}</Text>
          <Text style={styles.modalityPassageText}>{passage}</Text>
        </View>
      );
    }

    if (activity.modality === 'kinesthetic') {
      const steps = exp?.processSteps || [];
      const scenario = exp?.scenario || `Interactive system experiment for ${activity.topic}.`;
      return (
        <View style={styles.modalityKinestheticCard}>
          <Text style={styles.modalityTitle}>⚙️ {activity.topic} Process Overview</Text>
          <Text style={styles.modalitySub}>{scenario}</Text>
          {steps.length > 0 ? (
            <View style={styles.stepsContainer}>
              {steps.map((st: any, i: number) => (
                <View key={st.id || i} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{st.stepNumber || i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepLabel}>{st.label}</Text>
                    <Text style={styles.stepDesc}>{st.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {renderModalityContext()}

      <View style={styles.topRow}>
        <Text style={styles.counter}>
          Question {index + 1} of {questions.length}
        </Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {q.type === 'academic' ? 'Academic' : 'General'}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((index + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.prompt}>{q.prompt}</Text>
        {q.hint && !checked ? <Text style={styles.hint}>Hint: {q.hint}</Text> : null}
      </View>

      <View style={styles.options}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = checked && i === q.correctIndex;
          const isWrong = checked && isSelected && i !== q.correctIndex;
          return (
            <TouchableOpacity
              key={i}
              disabled={checked}
              onPress={() => setSelected(i)}
              style={[
                styles.optionBtn,
                isSelected && styles.optionSelected,
                isCorrect && styles.optionCorrect,
                isWrong && styles.optionWrong,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {checked && q.explanation ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>
            {selected === q.correctIndex ? 'Great job!' : 'Good try!'}
          </Text>
          <Text style={styles.feedbackText}>{q.explanation}</Text>
        </View>
      ) : null}

      {!checked ? (
        <PrimaryButton
          title="Check Answer"
          disabled={selected === null}
          onPress={handleCheck}
        />
      ) : (
        <PrimaryButton
          title={index + 1 < questions.length ? 'Next Question' : 'Finish Set'}
          onPress={handleNext}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    fontSize: 14,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.darkPurple,
  },
  typeBadge: {
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: VARCHLEARN_COLORS.primary,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  prompt: {
    fontSize: 17,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.textPrimary,
    lineHeight: 24,
  },
  hint: {
    marginTop: 8,
    fontSize: 12.5,
    color: VARCHLEARN_COLORS.primary,
    fontWeight: '600',
  },
  options: { gap: 10 },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  optionSelected: {
    borderColor: VARCHLEARN_COLORS.primary,
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
  },
  optionCorrect: {
    borderColor: VARCHLEARN_COLORS.success,
    backgroundColor: VARCHLEARN_COLORS.successBg,
  },
  optionWrong: {
    borderColor: VARCHLEARN_COLORS.danger,
    backgroundColor: VARCHLEARN_COLORS.dangerBg,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: VARCHLEARN_COLORS.textPrimary,
  },
  optionTextSelected: {
    color: VARCHLEARN_COLORS.darkPurple,
    fontWeight: '700',
  },
  feedbackBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  feedbackTitle: {
    fontWeight: '800',
    color: VARCHLEARN_COLORS.primary,
    marginBottom: 2,
  },
  feedbackText: {
    color: VARCHLEARN_COLORS.textSecondary,
    fontSize: 13.5,
  },
  modalityHeaderCard: {
    marginBottom: 8,
  },
  modalityVisualCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 8,
    marginBottom: 6,
  },
  modalityReadCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    gap: 8,
    marginBottom: 6,
  },
  modalityKinestheticCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: 8,
    marginBottom: 6,
  },
  modalityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
  },
  modalitySub: {
    fontSize: 13,
    color: VARCHLEARN_COLORS.textSecondary,
    lineHeight: 18,
  },
  modalityPassageText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: VARCHLEARN_COLORS.textPrimary,
  },
  nodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nodeChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flex: 1,
    minWidth: 130,
  },
  nodeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  nodeDesc: {
    fontSize: 11.5,
    color: VARCHLEARN_COLORS.textSecondary,
    lineHeight: 16,
  },
  stepsContainer: {
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.textPrimary,
  },
  stepDesc: {
    fontSize: 11.5,
    color: VARCHLEARN_COLORS.textSecondary,
  },
});
