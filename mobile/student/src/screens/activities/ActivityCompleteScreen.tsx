import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityComplete'>;

export const ActivityCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { activity, correctCount, totalCount, earnedStars } = route.params;
  const meta = MODALITY_META[activity.modality];

  return (
    <View style={styles.container}>
      <MascotAvatar
        mascotId={meta.mascotId}
        expression="celebrating"
        size={130}
        speechBubble="Awesome effort, explorer!"
      />

      <Text style={styles.title}>Activity Complete!</Text>
      <Text style={styles.subtitle}>{activity.name}</Text>

      <View style={styles.rewardCard}>
        <Text style={styles.rewardLabel}>Stars Earned</Text>
        <Text style={styles.starBig}>⭐ +{earnedStars}</Text>
        <Text style={styles.detail}>
          Completed {correctCount} of {totalCount} steps
        </Text>
      </View>

      <PrimaryButton
        title="Back to Adventure Path"
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
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: VARCHLEARN_COLORS.darkPurple },
  subtitle: { fontSize: 15, color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  rewardCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  rewardLabel: { fontSize: 14, fontWeight: '700', color: VARCHLEARN_COLORS.textSecondary },
  starBig: { fontSize: 34, fontWeight: '900', color: VARCHLEARN_COLORS.starGold },
  detail: { fontSize: 13.5, color: VARCHLEARN_COLORS.textMuted, fontWeight: '600' },
});
