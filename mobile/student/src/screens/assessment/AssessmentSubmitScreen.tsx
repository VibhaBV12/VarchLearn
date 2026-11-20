import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentSubmit'>;

export const AssessmentSubmitScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assessment } = route.params;
  const { student, updateStudent } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!student) return;
    setSubmitting(true);
    try {
      const progress = await studentDataService.getAssessmentProgress(student.id, assessment.id);
      const result = await studentDataService.submitAssessment(student, assessment, progress);
      await updateStudent({
        ...student,
        latestAssessmentResult: result,
        assessmentHistory: [...student.assessmentHistory, result],
      });
      const vis = studentDataService.getAdminVisibilitySettings();
      navigation.replace('AssessmentResults', {
        result,
        showPercentages: vis.showModalityPercentages,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <MascotAvatar
        mascotId="vee"
        expression="excited"
        size={120}
        speechBubble="Ready to submit your adventure?"
      />
      <Text style={styles.title}>Submit Assessment?</Text>
      <Text style={styles.sub}>
        You completed all {assessment.activities.length} activities! Tap below to submit and save your results.
      </Text>
      <PrimaryButton
        title="Submit Assessment"
        onPress={handleSubmit}
        loading={submitting}
        style={{ width: '100%' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  sub: { fontSize: 14.5, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center' },
});
