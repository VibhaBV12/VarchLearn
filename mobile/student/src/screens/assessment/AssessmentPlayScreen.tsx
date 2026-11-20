import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { sortAssessmentByVarkOrder, studentDataService } from '../../services/studentDataService';
import { StudentAssessmentProgress } from '../../../../../shared/types';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VisualGameRouter } from '../../components/games/VisualGames';
import { AuditoryGameRouter } from '../../components/games/AuditoryGames';
import { ReadWriteGameRouter } from '../../components/games/ReadWriteGames';
import { KinestheticGameRouter } from '../../components/games/KinestheticGames';
import { QuestionSetRunner } from '../../components/games/QuestionSetRunner';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentPlay'>;

export const AssessmentPlayScreen: React.FC<Props> = ({ route, navigation }) => {
  const orderedAssessment = useMemo(
    () => sortAssessmentByVarkOrder(route.params.assessment),
    [route.params.assessment]
  );
  const { student } = useAuth();
  const [progress, setProgress] = useState<StudentAssessmentProgress | null>(null);
  const [transitionSectionIndex, setTransitionSectionIndex] = useState<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!student) return;
    studentDataService.getAssessmentProgress(student.id, orderedAssessment.id).then((loaded) => {
      // Prevent re-entering a completed assessment
      if (loaded.status === 'completed' && student.latestAssessmentResult) {
        const vis = studentDataService.getAdminVisibilitySettings();
        navigation.replace('AssessmentResults', {
          result: student.latestAssessmentResult,
          showPercentages: vis.showModalityPercentages,
        });
        return;
      }

      const active: StudentAssessmentProgress = {
        ...loaded,
        status: 'in_progress',
        startedAt: loaded.startedAt || new Date().toISOString(),
      };
      setProgress(active);
      studentDataService.saveAssessmentProgress(active);
      startTimeRef.current = Date.now();
    });
  }, [student?.id, orderedAssessment.id]);

  if (!progress) return null;

  const totalSections = orderedAssessment.activities.length;
  const currentIndex = Math.min(progress.currentActivityIndex, totalSections - 1);
  const currentCfg = orderedAssessment.activities[currentIndex];
  if (!currentCfg) return null;

  const meta = MODALITY_META[currentCfg.activity.modality];

  const handlePause = async () => {
    const paused: StudentAssessmentProgress = { ...progress, status: 'paused' };
    await studentDataService.saveAssessmentProgress(paused);
    navigation.replace('AssessmentProgress', { assessment: orderedAssessment });
  };

  const handleActivityDone = async (correctCount: number, totalCount: number) => {
    const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const updated: StudentAssessmentProgress = {
      ...progress,
      completedActivityIds: Array.from(
        new Set([...progress.completedActivityIds, currentCfg.activityId])
      ),
      activityResults: {
        ...progress.activityResults,
        [currentCfg.activityId]: {
          questionType: 'knowledge',
          correctCount,
          totalCount,
          timeTakenSeconds: elapsedSec,
          scorePercent,
        },
      },
    };

    if (currentIndex + 1 < totalSections) {
      const nextIndex = currentIndex + 1;
      updated.currentActivityIndex = nextIndex;
      await studentDataService.saveAssessmentProgress(updated);
      setProgress(updated);
      setTransitionSectionIndex(nextIndex);
    } else {
      await studentDataService.saveAssessmentProgress(updated);
      navigation.replace('AssessmentSubmit', { assessment: orderedAssessment });
    }
  };

  // Smooth child-friendly transition between sections (Kinesthetic -> Auditory -> Visual -> Read/Write)
  if (transitionSectionIndex !== null) {
    const nextCfg = orderedAssessment.activities[transitionSectionIndex];
    const nextMeta = MODALITY_META[nextCfg.activity.modality];
    return (
      <View style={styles.transitionWrap}>
        <View style={styles.sectionPill}>
          <Text style={styles.sectionPillText}>
            Section {transitionSectionIndex + 1} of {totalSections}
          </Text>
        </View>
        <MascotAvatar
          mascotId={nextMeta.mascotId}
          expression="excited"
          size={120}
          speechBubble={`Awesome work! Now let's try ${nextMeta.studentName}!`}
        />
        <Text style={styles.transTitle}>{nextMeta.studentName}</Text>
        <Text style={styles.transSub}>{nextCfg.activity.name}</Text>
        <PrimaryButton
          title={`Start Section ${transitionSectionIndex + 1} of ${totalSections}`}
          onPress={() => {
            setTransitionSectionIndex(null);
            startTimeRef.current = Date.now();
          }}
          style={{ width: '100%' }}
        />
      </View>
    );
  }

  const renderGame = () => {
    const act = currentCfg.activity;
    if (act.category === 'question_sets' && act.questions) {
      return <QuestionSetRunner questions={act.questions} onComplete={handleActivityDone} />;
    }
    switch (act.modality) {
      case 'visual':
        return <VisualGameRouter activity={act} onComplete={handleActivityDone} />;
      case 'auditory':
        return <AuditoryGameRouter activity={act} onComplete={handleActivityDone} />;
      case 'read_write':
        return <ReadWriteGameRouter activity={act} onComplete={handleActivityDone} />;
      case 'kinesthetic':
        return <KinestheticGameRouter activity={act} onComplete={handleActivityDone} />;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
          <Ionicons name="pause" size={18} color={VARCHLEARN_COLORS.primary} />
          <Text style={styles.pauseText}>Pause</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>
          Section {currentIndex + 1} of {totalSections}
        </Text>
        <View style={[styles.modBadge, { backgroundColor: meta.bgColor }]}>
          <Text style={[styles.modText, { color: meta.color }]}>{meta.studentName}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${((currentIndex + 1) / totalSections) * 100}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.actTitle}>{currentCfg.activity.name}</Text>

      {renderGame()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 18, paddingTop: 48, paddingBottom: 36, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  pauseText: { fontWeight: '700', color: VARCHLEARN_COLORS.primary, fontSize: 13 },
  stepText: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  modBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  modText: { fontSize: 11.5, fontWeight: '800' },
  track: {
    height: 8,
    borderRadius: 6,
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: VARCHLEARN_COLORS.primary },
  actTitle: { fontSize: 19, fontWeight: '800', color: VARCHLEARN_COLORS.textPrimary },
  transitionWrap: {
    flex: 1,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  sectionPill: {
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectionPillText: {
    color: VARCHLEARN_COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  transTitle: { fontSize: 24, fontWeight: '900', color: VARCHLEARN_COLORS.darkPurple },
  transSub: { fontSize: 15, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center' },
});
