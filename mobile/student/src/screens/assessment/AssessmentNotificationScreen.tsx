import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentNotification'>;

export const AssessmentNotificationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assessment } = route.params;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>

      <View style={styles.center}>
        <MascotAvatar
          mascotId="vee"
          expression="excited"
          size={120}
          speechBubble="A brand new discovery adventure is ready!"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>New Assessment Published</Text>
        </View>
        <Text style={styles.title}>{assessment.name}</Text>
        <Text style={styles.desc}>{assessment.description}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLine}>• Includes all 4 learning explorers</Text>
          <Text style={styles.cardLine}>• {assessment.activities.length} interactive activities</Text>
          <Text style={styles.cardLine}>• You can pause and resume anytime!</Text>
        </View>
      </View>

      <PrimaryButton
        title="View Instructions"
        onPress={() => navigation.replace('AssessmentDetails', { assessment })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    padding: 24,
    paddingTop: 48,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: 12 },
  badge: {
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: { color: VARCHLEARN_COLORS.primary, fontWeight: '800', fontSize: 12.5 },
  title: { fontSize: 22, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple, textAlign: 'center' },
  desc: { fontSize: 14, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  cardLine: { fontSize: 14, fontWeight: '600', color: VARCHLEARN_COLORS.textPrimary },
});
