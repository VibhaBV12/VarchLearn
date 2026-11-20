import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';

export const ChangePinScreen: React.FC = () => {
  const { student, updateStudent } = useAuth();
  const navigation = useNavigation();
  const [currPin, setCurrPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!student) return null;

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!/^\d{4}$/.test(newPin)) {
      setError('New Recovery PIN must be 4 digits.');
      return;
    }
    try {
      const updated = await authService.changeRecoveryPin(student.id, currPin, newPin);
      await updateStudent(updated);
      setSuccess('Recovery PIN updated!');
      setCurrPin('');
      setNewPin('');
    } catch (e: any) {
      setError(e?.message || 'Could not update PIN.');
    }
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>
      <Text style={styles.title}>Change Recovery PIN</Text>

      <TextInput
        style={styles.input}
        placeholder="Current 4-digit PIN"
        value={currPin}
        onChangeText={setCurrPin}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="New 4-digit PIN"
        value={newPin}
        onChangeText={setNewPin}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {success ? <Text style={styles.ok}>{success}</Text> : null}
      <PrimaryButton title="Update Recovery PIN" onPress={handleSave} />
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
