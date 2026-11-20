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
import { useAuth } from '../../context/AuthContext';
import { useStudentData } from '../../context/StudentDataContext';
import { studentDataService } from '../../services/studentDataService';
import { MascotAvatar } from '../../components/MascotAvatar';
import { ModalityBars } from '../../components/ModalityBars';
import { WindingAdventurePath } from '../../components/WindingAdventurePath';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { DailyPathNode } from '../../../../../shared/types';
import { RootStackParamList } from '../../navigation/types';

export const HomeDashboardScreen: React.FC = () => {
  const { student } = useAuth();
  const { dailyPath, publishedAssessments, initialAssessment, simulateNextDay } = useStudentData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const visibility = studentDataService.getAdminVisibilitySettings();

  if (!student) return null;

  const completedCount = dailyPath.filter((n) => n.status === 'completed').length;
  const newAssessment = initialAssessment?.status !== 'completed'
    ? publishedAssessments.find((a) => a.id !== student.latestAssessmentResult?.assessmentId)
    : undefined;

  const handlePressNode = (node: DailyPathNode) => {
    if (node.status === 'locked') {
      const msg = 'Complete your current adventure step first to unlock this node!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Node Locked', msg);
      }
      return;
    }
    navigation.navigate('ActivityIntro', {
      activity: node.activity,
      pathNodeId: node.id,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.userLeft}>
          <View style={styles.miniAvatar}>
            <MascotAvatar mascotId={student.avatarMascot} expression="happy" size={38} />
          </View>
          <View>
            <Text style={styles.greeting}>Hi, {student.name}!</Text>
            <Text style={styles.classText}>{student.className} • Daily Adventure</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={16} color={VARCHLEARN_COLORS.starGold} />
            <Text style={styles.starCount}>{student.stars}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => {
              if (newAssessment) {
                navigation.navigate('AssessmentNotification', { assessment: newAssessment });
              } else if (publishedAssessments[0]) {
                navigation.navigate('AssessmentNotification', {
                  assessment: publishedAssessments[0],
                });
              }
            }}
          >
            <Ionicons name="notifications" size={20} color={VARCHLEARN_COLORS.primary} />
            {newAssessment ? <View style={styles.redDot} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* Vee Motivational Card */}
      <View style={styles.veeCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.veeTitle}>Keep going, {student.name}!</Text>
          <Text style={styles.veeSub}>
            You completed {completedCount} of {dailyPath.length} adventure steps today.
          </Text>
        </View>
        <MascotAvatar mascotId="vee" expression="encouraging" size={74} />
      </View>

      {/* Assessment Notification Banner (when new assessment is published) */}
      {newAssessment ? (
        <TouchableOpacity
          style={styles.asmtBanner}
          onPress={() =>
            navigation.navigate('AssessmentNotification', { assessment: newAssessment })
          }
        >
          <View style={styles.asmtIcon}>
            <Ionicons name="sparkles" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.asmtTitle}>New Assessment Published!</Text>
            <Text style={styles.asmtSub}>{newAssessment.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={VARCHLEARN_COLORS.primary} />
        </TouchableOpacity>
      ) : null}

      {/* Central Feature: Winding Daily Improvement Adventure Path */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Learning Path</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdventurePath')}>
          <Text style={styles.linkText}>Full Path →</Text>
        </TouchableOpacity>
      </View>

      <WindingAdventurePath nodes={dailyPath} onPressNode={handlePressNode} />

      {/* Carry-Forward Persistence Demo Control */}
      <TouchableOpacity style={styles.rolloverBtn} onPress={simulateNextDay}>
        <Ionicons name="calendar-outline" size={16} color={VARCHLEARN_COLORS.primary} />
        <Text style={styles.rolloverText}>
          Simulate Next Day (Test Carry-Forward & 12-Item Cap)
        </Text>
      </TouchableOpacity>

      {/* Latest Assessment Result (only when available and permitted by settings) */}
      {student.latestAssessmentResult && visibility.showResultsToStudents ? (
        <View style={styles.resultCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.resultTitle}>Latest Discovery Snapshot</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AssessmentResults', {
                  result: student.latestAssessmentResult!,
                  showPercentages: visibility.showModalityPercentages,
                })
              }
            >
              <Text style={styles.linkText}>Details</Text>
            </TouchableOpacity>
          </View>
          <ModalityBars
            scores={student.latestAssessmentResult.scores}
            showPercentages={visibility.showModalityPercentages}
          />
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 16, paddingTop: 48, paddingBottom: 36, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  classText: { fontSize: 12.5, color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  starCount: { fontWeight: '800', color: VARCHLEARN_COLORS.textPrimary, fontSize: 14 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: VARCHLEARN_COLORS.danger,
  },
  veeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  veeTitle: { fontSize: 17, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  veeSub: { fontSize: 13.5, color: VARCHLEARN_COLORS.textSecondary, marginTop: 4 },
  asmtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.primary,
  },
  asmtIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: VARCHLEARN_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asmtTitle: { fontWeight: '800', color: VARCHLEARN_COLORS.primary, fontSize: 14 },
  asmtSub: { color: VARCHLEARN_COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  linkText: { fontSize: 13.5, fontWeight: '700', color: VARCHLEARN_COLORS.primary },
  rolloverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  rolloverText: { fontSize: 12.5, fontWeight: '700', color: VARCHLEARN_COLORS.primary },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    gap: 12,
  },
  resultTitle: { fontSize: 16, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
});
