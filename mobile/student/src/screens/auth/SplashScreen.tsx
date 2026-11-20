import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <LinearGradient colors={['#FFFFFF', '#F3EEFC', '#E6D9FA']} style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.brand}>VarchLearn</Text>
        <Text style={styles.tagline}>Learn • Play • Grow</Text>
      </View>

      <View style={styles.centerSection}>
        <MascotAvatar
          mascotId="vee"
          expression="excited"
          size={190}
          speechBubble="Hi! I'm Vee! Let's explore together!"
        />
        <Text style={styles.subtitle}>Discover your learning style!</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Get Started" onPress={() => navigation.navigate('Login')} />
        <Text style={styles.simNote}>Simulated Student Frontend • Ages 8–11</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 54,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  brand: {
    fontSize: 40,
    fontWeight: '900',
    color: VARCHLEARN_COLORS.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.darkPurple,
    marginTop: 6,
  },
  centerSection: {
    alignItems: 'center',
    gap: 18,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.textPrimary,
    textAlign: 'center',
  },
  footer: {
    gap: 12,
  },
  simNote: {
    textAlign: 'center',
    fontSize: 12,
    color: VARCHLEARN_COLORS.textMuted,
  },
});
