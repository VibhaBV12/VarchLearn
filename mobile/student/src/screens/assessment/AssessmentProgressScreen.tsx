import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { StudentAssessmentProgress } from '../../../../../shared/types';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentProgress'>;

export const AssessmentProgressScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assessment } = route.params;
  const { student } = useAuth();
  const [progress, setProgress] = useState<StudentAssessmentProgress | null>(null);

  useEffect(() => {
    if (student) {
      studentDataService.getAssessmentProgress(student.id, assessment.id).then(setProgress);
    }
  }, [student?.id, assessment.id]);

  const done = progress?.completedActivityIds.length || 0;

  return (
    <View style={styles.container}>
      <MascotAvatar
        mascotId="vee"
        expression="encouraging"
        size={112}
        speechBubble="Your progress is safely saved!"
      />
      <Text style={styles.title}>Assessment Paused</Text>
      <Text style={styles.sub}>
        You finished {done} of {assessment.activities.length} activities in {assessment.name}.
      </Text>

      <PrimaryButton
        title="Resume Assessment"
        onPress={() => navigation.replace('AssessmentPlay', { assessment })}
        style={{ width: '100%' }}
      />
      <PrimaryButton
        title="Back to Home"
        variant="secondary"
        onPress={() => navigation.navigate('MainTabs')}
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
    gap: 14,
  },
  title: { fontSize: 26, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  sub: { fontSize: 14.5, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center' },
});
