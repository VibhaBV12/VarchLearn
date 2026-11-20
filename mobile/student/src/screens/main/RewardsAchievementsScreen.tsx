import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { MascotAvatar } from '../../components/MascotAvatar';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';

const ALL_BADGES = [
  { id: 'Quick Learner', icon: 'flash', color: '#F59E0B', desc: 'Started your daily learning path!' },
  { id: 'Puzzle Pro', icon: 'extension-puzzle', color: '#7041C6', desc: 'Solved visual & word puzzles!' },
  { id: 'Curious Mind', icon: 'sparkles', color: '#3B82F6', desc: 'Explored multiple learning modes!' },
  { id: 'Sound Hero', icon: 'headset', color: '#06B6D4', desc: 'Completed 5 Sound Explorer quests!' },
];

export const RewardsAchievementsScreen: React.FC = () => {
  const { student } = useAuth();
  if (!student) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Rewards</Text>

      <View style={styles.starHero}>
        <Ionicons name="star" size={44} color={VARCHLEARN_COLORS.starGold} />
        <Text style={styles.starBig}>{student.stars} Stars</Text>
        <Text style={styles.starSub}>
          {student.completedActivitiesCount} activities completed! Every step counts.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.badgeGrid}>
        {ALL_BADGES.map((b) => {
          const unlocked = student.badges.includes(b.id);
          return (
            <View key={b.id} style={[styles.badgeCard, !unlocked && styles.badgeLocked]}>
              <View style={[styles.iconCircle, { backgroundColor: unlocked ? b.color : '#CBD5E1' }]}>
                <Ionicons name={b.icon as any} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.badgeName}>{b.id}</Text>
              <Text style={styles.badgeDesc}>{b.desc}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.highlightCard}>
        <MascotAvatar
          mascotId="vee"
          expression="celebrating"
          size={78}
          speechBubble="You're doing amazing—keep exploring at your own pace!"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 18, paddingTop: 52, paddingBottom: 36, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  starHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  starBig: { fontSize: 30, fontWeight: '900', color: VARCHLEARN_COLORS.darkPurple },
  starSub: { fontSize: 13.5, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  badgeLocked: { opacity: 0.55 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: { fontWeight: '800', fontSize: 14, color: VARCHLEARN_COLORS.textPrimary, textAlign: 'center' },
  badgeDesc: { fontSize: 11.5, color: VARCHLEARN_COLORS.textSecondary, textAlign: 'center' },
  highlightCard: {
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
});
