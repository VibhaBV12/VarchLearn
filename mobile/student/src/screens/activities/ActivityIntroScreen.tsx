import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityIntro'>;

export const ActivityIntroScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activity, pathNodeId } = route.params;
  const meta = MODALITY_META[activity.modality];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: meta.bgColor }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>
            {meta.studentName} • {activity.gameType}
          </Text>
        </View>
        <Text style={styles.title}>{activity.name}</Text>

        <MascotAvatar
          mascotId={meta.mascotId}
          expression="excited"
          size={112}
          speechBubble={activity.customization.mission}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoHeading}>How to Play</Text>
        <Text style={styles.infoText}>{activity.customization.instructions}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>Subject: {activity.subject}</Text>
          <Text style={styles.metaChip}>Level: {activity.difficulty}</Text>
          <Text style={styles.metaChip}>Reward: ⭐ {activity.starReward}</Text>
        </View>
      </View>

      <PrimaryButton
        title="Start Activity"
        onPress={() => navigation.replace('ActivityPlay', { activity, pathNodeId })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 20, paddingTop: 48, gap: 18 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontWeight: '800', fontSize: 12.5 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  infoHeading: { fontSize: 16, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  infoText: { fontSize: 14.5, lineHeight: 22, color: VARCHLEARN_COLORS.textSecondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metaChip: {
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    color: VARCHLEARN_COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});
