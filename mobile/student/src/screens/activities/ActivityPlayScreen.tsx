import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { useStudentData } from '../../context/StudentDataContext';
import { MascotAvatar } from '../../components/MascotAvatar';
import { QuestionSetRunner } from '../../components/games/QuestionSetRunner';
import { ActivityRendererDispatcher } from '../../components/renderers/ActivityRendererRegistry';
import { VisualGameRouter } from '../../components/games/VisualGames';
import { AuditoryGameRouter } from '../../components/games/AuditoryGames';
import { ReadWriteGameRouter } from '../../components/games/ReadWriteGames';
import { KinestheticGameRouter } from '../../components/games/KinestheticGames';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityPlay'>;

export const ActivityPlayScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activity, pathNodeId } = route.params;
  const { completeNode } = useStudentData();
  const meta = MODALITY_META[activity.modality];

  const handleComplete = async (correctCount: number, totalCount: number) => {
    const earnedStars = activity.starReward;
    if (pathNodeId) {
      await completeNode(pathNodeId, earnedStars);
    }
    navigation.replace('ActivityComplete', {
      activity,
      correctCount,
      totalCount,
      earnedStars,
      pathNodeId,
    });
  };

  const renderInteractive = () => {
    if (activity.customization?.activitySpec) {
      return <ActivityRendererDispatcher activity={activity} onComplete={handleComplete} />;
    }
    if (activity.category === 'question_sets' && activity.questions) {
      return <QuestionSetRunner activity={activity} questions={activity.questions} onComplete={handleComplete} />;
    }
    switch (activity.modality) {
      case 'visual':
        return <VisualGameRouter activity={activity} onComplete={handleComplete} />;
      case 'auditory':
        return <AuditoryGameRouter activity={activity} onComplete={handleComplete} />;
      case 'read_write':
        return <ReadWriteGameRouter activity={activity} onComplete={handleComplete} />;
      case 'kinesthetic':
        return <KinestheticGameRouter activity={activity} onComplete={handleComplete} />;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={VARCHLEARN_COLORS.darkPurple} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activity.name}
        </Text>
        <MascotAvatar mascotId={meta.mascotId} expression="curious" size={44} />
      </View>

      {renderInteractive()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 18, paddingTop: 48, paddingBottom: 36, gap: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
});
