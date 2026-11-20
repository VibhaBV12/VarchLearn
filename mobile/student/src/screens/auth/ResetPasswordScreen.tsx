import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authService } from '../../services/authService';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { username, recoveryPin } = route.params;
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (newPass.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(username, newPass, recoveryPin);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <MascotAvatar
            mascotId="vee"
            expression="celebrating"
            size={120}
            speechBubble="Woohoo! Your password is updated!"
          />
          <Text style={styles.title}>Password Reset Complete!</Text>
          <Text style={styles.subtitle}>You can now log in with your new password.</Text>
          <PrimaryButton title="Go to Login" onPress={() => navigation.navigate('Login')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <MascotAvatar mascotId="vee" expression="encouraging" size={96} />
        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>Choose a new password for @{username}</Text>

        <TextInput
          style={styles.input}
          placeholder="New password"
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          value={confirmPass}
          onChangeText={setConfirmPass}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Save New Password" onPress={handleReset} loading={loading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 24,
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
    fontSize: 15,
  },
  error: {
    color: VARCHLEARN_COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});
