import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useStudentData } from '../../context/StudentDataContext';
import { MascotAvatar } from '../../components/MascotAvatar';
import { ModalityBars } from '../../components/ModalityBars';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentResults'>;

export const AssessmentResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { result, showPercentages } = route.params;
  const { student } = useAuth();
  const { markInitialAssessmentCompleted } = useStudentData();

  useEffect(() => {
    markInitialAssessmentCompleted();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>Assessment Completed ✓</Text>
      </View>

      <Text style={styles.title}>Well Done, {student?.name || 'Explorer'}!</Text>
      <Text style={styles.subtitle}>
        Here are your results for {result.assessmentName}
      </Text>

      <View style={styles.card}>
        <ModalityBars scores={result.scores} showPercentages={showPercentages} />
        <Text style={styles.note}>
          These bars help pick fun daily activities for you—they are never permanent labels!
        </Text>
      </View>

      <View style={styles.mascotsRow}>
        <MascotAvatar mascotId="vee" expression="celebrating" size={56} />
        <MascotAvatar mascotId="pixie" expression="happy" size={54} />
        <MascotAvatar mascotId="echo" expression="excited" size={54} />
        <MascotAvatar mascotId="winky" expression="happy" size={54} />
        <MascotAvatar mascotId="bouncy" expression="celebrating" size={54} />
      </View>

      <PrimaryButton
        title="Go to My Daily Learning Path"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 20, paddingTop: 56, paddingBottom: 36, gap: 18 },
  statusPill: {
    alignSelf: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPillText: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: VARCHLEARN_COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  note: {
    fontSize: 12.5,
    color: VARCHLEARN_COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mascotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
});
