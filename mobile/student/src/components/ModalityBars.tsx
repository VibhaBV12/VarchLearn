import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ModalityKey, ModalityScores } from '../../../../shared/types';
import { MODALITY_META, VARCHLEARN_COLORS } from '../../../../shared/constants/theme';

interface ModalityBarsProps {
  scores: ModalityScores;
  showPercentages?: boolean;
}

const ORDER: ModalityKey[] = ['kinesthetic', 'auditory', 'visual', 'read_write'];

export const ModalityBars: React.FC<ModalityBarsProps> = ({
  scores,
  showPercentages = true,
}) => {
  return (
    <View style={styles.container}>
      {ORDER.map((key) => {
        const meta = MODALITY_META[key];
        const value = Math.max(0, Math.min(100, scores[key]));
        return (
          <View key={key} style={styles.row}>
            <View style={styles.labelRow}>
              <View style={[styles.badge, { backgroundColor: meta.bgColor }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>
                  {meta.studentName}
                </Text>
              </View>
              <Text style={styles.percent}>
                {showPercentages ? `${value}%` : 'Recorded'}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: showPercentages ? `${value}%` : '100%',
                    backgroundColor: showPercentages ? meta.color : VARCHLEARN_COLORS.borderLavender,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  percent: {
    fontSize: 14,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.textPrimary,
  },
  track: {
    height: 11,
    borderRadius: 8,
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
