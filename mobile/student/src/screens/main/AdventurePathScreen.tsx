import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudentData } from '../../context/StudentDataContext';
import { MascotAvatar } from '../../components/MascotAvatar';
import { WindingAdventurePath } from '../../components/WindingAdventurePath';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { DailyPathNode } from '../../../../../shared/types';
import { RootStackParamList } from '../../navigation/types';

export const AdventurePathScreen: React.FC = () => {
  const { dailyPath } = useStudentData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const completed = dailyPath.filter((n) => n.status === 'completed').length;
  const carriedCount = dailyPath.filter((n) => n.isCarriedForward).length;

  const handleNode = (node: DailyPathNode) => {
    if (node.status === 'locked') {
      const msg = 'Finish your current node to unlock the next one!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Locked Step', msg);
      }
      return;
    }
    navigation.navigate('ActivityIntro', { activity: node.activity, pathNodeId: node.id });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Improvement</Text>
        <View style={styles.countPill}>
          <Ionicons name="star" size={14} color={VARCHLEARN_COLORS.starGold} />
          <Text style={styles.countText}>
            {completed}/{dailyPath.length}
          </Text>
        </View>
      </View>

      <View style={styles.guideCard}>
        <MascotAvatar mascotId="echo" expression="encouraging" size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.guideTitle}>You're on the right track!</Text>
          <Text style={styles.guideSub}>
            {carriedCount > 0
              ? `${carriedCount} pending steps carried forward with original dates • Max 12/day.`
              : 'Tap any open node to earn stars and unlock the next step!'}
          </Text>
        </View>
      </View>

      <WindingAdventurePath nodes={dailyPath} onPressNode={handleNode} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40, gap: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: { fontSize: 20, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  guideTitle: { fontSize: 15, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  guideSub: { fontSize: 12.5, color: VARCHLEARN_COLORS.textSecondary, marginTop: 3 },
});
