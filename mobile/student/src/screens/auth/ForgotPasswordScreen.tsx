import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    setError('');
    navigation.navigate('RecoveryPin', { username: username.trim() });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>

      <View style={styles.center}>
        <MascotAvatar
          mascotId="vee"
          expression="curious"
          size={110}
          speechBubble="Forgot your password? No worries!"
        />
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Step 1: Enter your student username</Text>

        <TextInput
          style={styles.input}
          placeholder="Username (e.g., aarav5)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Continue to PIN Check" onPress={handleNext} style={styles.btn} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backLink}>Back to Login</Text>
        </TouchableOpacity>
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
    fontSize: 14,
    color: VARCHLEARN_COLORS.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    padding: 14,
    fontSize: 16,
  },
  error: {
    color: VARCHLEARN_COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  btn: { marginTop: 6 },
  backLink: {
    textAlign: 'center',
    color: VARCHLEARN_COLORS.primary,
    fontWeight: '700',
    marginTop: 8,
  },
});
