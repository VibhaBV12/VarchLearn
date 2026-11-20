import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';

export const ChangePasswordScreen: React.FC = () => {
  const { student, updateStudent } = useAuth();
  const navigation = useNavigation();
  const [curr, setCurr] = useState('');
  const [nextPass, setNextPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!student) return null;

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (nextPass.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (nextPass !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    try {
      const updated = await authService.changePassword(student.id, curr, nextPass);
      await updateStudent(updated);
      setSuccess('Password updated!');
      setCurr('');
      setNextPass('');
      setConfirm('');
    } catch (e: any) {
      setError(e?.message || 'Could not update password.');
    }
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>
      <Text style={styles.title}>Change Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Current password"
        value={curr}
        onChangeText={setCurr}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="New password"
        value={nextPass}
        onChangeText={setNextPass}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {success ? <Text style={styles.ok}>{success}</Text> : null}
      <PrimaryButton title="Update Password" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint, padding: 20, paddingTop: 48, gap: 14 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    padding: 14,
  },
  err: { color: VARCHLEARN_COLORS.danger, fontWeight: '600', textAlign: 'center' },
  ok: { color: VARCHLEARN_COLORS.success, fontWeight: '700', textAlign: 'center' },
});
