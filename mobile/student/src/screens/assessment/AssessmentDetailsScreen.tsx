import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { sortAssessmentByVarkOrder, studentDataService } from '../../services/studentDataService';
import { StudentAssessmentProgress } from '../../../../../shared/types';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentDetails'>;

export const AssessmentDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const orderedAssessment = useMemo(
    () => sortAssessmentByVarkOrder(route.params.assessment),
    [route.params.assessment]
  );
  const { student } = useAuth();
  const [progress, setProgress] = useState<StudentAssessmentProgress | null>(null);

  useEffect(() => {
    if (student) {
      studentDataService.getAssessmentProgress(student.id, orderedAssessment.id).then(setProgress);
    }
  }, [student?.id, orderedAssessment.id]);

  const isCompleted = progress?.status === 'completed';
  const isPausedOrStarted =
    progress && (progress.status === 'paused' || progress.status === 'in_progress');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {isCompleted && navigation.canGoBack() ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.center}>
        <MascotAvatar
          mascotId="vee"
          expression={isCompleted ? 'celebrating' : 'encouraging'}
          size={94}
          speechBubble={
            isCompleted
              ? 'You already completed this discovery adventure!'
              : "Let's explore all 4 sections together!"
          }
        />
        <Text style={styles.title}>{orderedAssessment.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Instructions</Text>
        <Text style={styles.line}>1. Complete all 4 sections in order: Kinesthetic → Auditory → Visual → Read/Write.</Text>
        <Text style={styles.line}>2. Your progress is autosaved after every section.</Text>
        <Text style={styles.line}>3. This assessment is completed once—results appear after Section 4.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>4 Sections</Text>
        {orderedAssessment.activities.map((cfg, idx) => {
          const meta = MODALITY_META[cfg.activity.modality];
          return (
            <View key={cfg.activityId} style={styles.actRow}>
              <Text style={styles.actOrder}>{idx + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actName}>{cfg.activity.name}</Text>
                <Text style={[styles.actMod, { color: meta.color }]}>
                  {meta.studentName} • {cfg.activity.gameType}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {isCompleted ? (
        <PrimaryButton
          title="Assessment Completed ✓ — Go to Home"
          onPress={() => navigation.navigate('MainTabs')}
        />
      ) : (
        <PrimaryButton
          title={isPausedOrStarted ? 'Resume Assessment' : 'Start Assessment'}
          onPress={() => navigation.replace('AssessmentPlay', { assessment: orderedAssessment })}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 20, paddingTop: 48, paddingBottom: 36, gap: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  line: { fontSize: 14, color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  actRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  actOrder: { fontWeight: '800', color: VARCHLEARN_COLORS.primary },
  actName: { fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  actMod: { fontSize: 12, fontWeight: '700' },
});
