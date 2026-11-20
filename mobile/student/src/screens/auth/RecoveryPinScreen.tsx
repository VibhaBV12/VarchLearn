import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authService } from '../../services/authService';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RecoveryPin'>;

export const RecoveryPinScreen: React.FC<Props> = ({ route, navigation }) => {
  const { username } = route.params;
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setError('');
    if (!/^\d{4}$/.test(pin.trim())) {
      setError('Please enter your 4-digit Recovery PIN.');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyRecoveryPin(username, pin);
      navigation.navigate('ResetPassword', { username, recoveryPin: pin });
    } catch (err: any) {
      setError(err?.message || 'PIN verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>

      <View style={styles.center}>
        <MascotAvatar
          mascotId="vee"
          expression="thinking"
          size={105}
          speechBubble={`Checking Recovery PIN for @${username}`}
        />
        <Text style={styles.title}>Verify Recovery PIN</Text>
        <Text style={styles.subtitle}>Enter the 4-digit PIN you set during registration (demo: 1234)</Text>

        <TextInput
          style={styles.input}
          placeholder="4-digit Recovery PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Verify" onPress={handleVerify} loading={loading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: VARCHLEARN_COLORS.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    padding: 14,
    fontSize: 18,
    letterSpacing: 6,
    textAlign: 'center',
  },
  error: {
    color: VARCHLEARN_COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});
