import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MascotAvatar } from '../../components/MascotAvatar';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { ALL_CLASSES } from '../../../../../shared/constants/modalities';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [className, setClassName] = useState('Class 5');
  const [password, setPassword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !username.trim() || !password || !recoveryPin.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!/^\d{4}$/.test(recoveryPin.trim())) {
      setError('Recovery PIN must be a 4-digit number.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, username, className, password, recoveryPin });
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>

      <View style={styles.header}>
        <MascotAvatar mascotId="vee" expression="excited" size={76} />
        <Text style={styles.title}>Join VarchLearn!</Text>
        <Text style={styles.subtitle}>No parent email needed — just pick your username & PIN</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Aarav"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., aarav_star"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Select Your Class</Text>
        <View style={styles.classRow}>
          {ALL_CLASSES.map((cls) => (
            <TouchableOpacity
              key={cls}
              onPress={() => setClassName(cls)}
              style={[styles.classChip, className === cls && styles.classChipActive]}
            >
              <Text style={[styles.classChipText, className === cls && styles.classChipTextActive]}>
                {cls}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Password (min 6 characters)</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>4-Digit Recovery PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 1234"
          value={recoveryPin}
          onChangeText={setRecoveryPin}
          keyboardType="numeric"
          maxLength={4}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Create My Account" onPress={handleRegister} loading={loading} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: VARCHLEARN_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    gap: 10,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: VARCHLEARN_COLORS.darkPurple,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: VARCHLEARN_COLORS.textPrimary,
  },
  classRow: {
    flexDirection: 'row',
    gap: 10,
  },
  classChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    alignItems: 'center',
  },
  classChipActive: {
    backgroundColor: VARCHLEARN_COLORS.primary,
    borderColor: VARCHLEARN_COLORS.primary,
  },
  classChipText: {
    fontWeight: '700',
    color: VARCHLEARN_COLORS.textPrimary,
  },
  classChipTextActive: {
    color: '#FFFFFF',
  },
  error: {
    color: VARCHLEARN_COLORS.danger,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
