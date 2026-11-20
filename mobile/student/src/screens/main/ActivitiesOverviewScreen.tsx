import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { ModalityKey } from '../../../../../shared/types';
import { MascotAvatar } from '../../components/MascotAvatar';
import { RootStackParamList } from '../../navigation/types';

const MODALITIES: ModalityKey[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];

export const ActivitiesOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Explore Activities</Text>
      <Text style={styles.subtitle}>
        Pick a learning explorer to play games, puzzles, and question sets!
      </Text>

      {MODALITIES.map((key) => {
        const meta = MODALITY_META[key];
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.85}
            style={[styles.card, { borderColor: meta.borderColor }]}
            onPress={() => navigation.navigate('ModalityActivities', { modality: key })}
          >
            <MascotAvatar mascotId={meta.mascotId} expression="happy" size={72} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={[styles.pill, { backgroundColor: meta.bgColor }]}>
                <Text style={[styles.pillText, { color: meta.color }]}>
                  With {meta.mascotName}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{meta.studentName}</Text>
              <Text style={styles.cardSub}>{meta.tagline}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 18, paddingTop: 52, paddingBottom: 32, gap: 14 },
  title: { fontSize: 26, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  subtitle: { fontSize: 14, color: VARCHLEARN_COLORS.textSecondary, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#39245F',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: { fontSize: 11.5, fontWeight: '800' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: VARCHLEARN_COLORS.textPrimary },
  cardSub: { fontSize: 13, color: VARCHLEARN_COLORS.textSecondary },
});
