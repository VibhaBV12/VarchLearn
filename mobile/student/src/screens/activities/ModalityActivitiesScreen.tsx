import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityItem } from '../../../../../shared/types';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { studentDataService } from '../../services/studentDataService';
import { MascotAvatar } from '../../components/MascotAvatar';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ModalityActivities'>;

export const ModalityActivitiesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { modality } = route.params;
  const meta = MODALITY_META[modality];
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tab, setTab] = useState<'games_puzzles' | 'question_sets'>('games_puzzles');

  useEffect(() => {
    studentDataService.getActivitiesByModality(modality).then(setActivities);
  }, [modality]);

  const filtered = activities.filter((a) => a.category === tab);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
        </TouchableOpacity>
        <Text style={styles.title}>{meta.studentName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.banner, { backgroundColor: meta.bgColor, borderColor: meta.borderColor }]}>
        <MascotAvatar mascotId={meta.mascotId} expression="excited" size={68} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{meta.mascotName}'s Zone</Text>
          <Text style={styles.bannerSub}>{meta.tagline}</Text>
        </View>
      </View>

      {/* Two Categories: Games and Puzzles | Question Sets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab('games_puzzles')}
          style={[styles.tabBtn, tab === 'games_puzzles' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'games_puzzles' && styles.tabTextActive]}>
            Games & Puzzles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('question_sets')}
          style={[styles.tabBtn, tab === 'question_sets' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'question_sets' && styles.tabTextActive]}>
            Question Sets
          </Text>
        </TouchableOpacity>
      </View>

      {filtered.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.actCard}
          onPress={() => navigation.navigate('ActivityIntro', { activity: item })}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.gameType}>{item.gameType}</Text>
            <Text style={styles.actName}>{item.name}</Text>
            <Text style={styles.actMeta}>
              {item.className} • {item.subject} • {item.difficulty}
            </Text>
          </View>
          <View style={styles.starPill}>
            <Ionicons name="star" size={14} color={VARCHLEARN_COLORS.starGold} />
            <Text style={styles.starText}>{item.starReward}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 18, paddingTop: 48, paddingBottom: 36, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  bannerSub: { fontSize: 13, color: VARCHLEARN_COLORS.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: VARCHLEARN_COLORS.primary },
  tabText: { fontWeight: '700', color: VARCHLEARN_COLORS.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  actCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  gameType: { fontSize: 11.5, fontWeight: '800', color: VARCHLEARN_COLORS.primary },
  actName: { fontSize: 16, fontWeight: '800', color: VARCHLEARN_COLORS.textPrimary, marginTop: 2 },
  actMeta: { fontSize: 12.5, color: VARCHLEARN_COLORS.textSecondary, marginTop: 4 },
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  starText: { fontWeight: '800', color: VARCHLEARN_COLORS.textPrimary },
});
