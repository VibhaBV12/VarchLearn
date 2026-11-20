import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MascotAvatar } from '../../components/MascotAvatar';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('aarav5');
  const [password, setPassword] = useState('learn123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={VARCHLEARN_COLORS.darkPurple} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Let's continue your learning journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color={VARCHLEARN_COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="Username (demo: aarav5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={VARCHLEARN_COLORS.textMuted}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={VARCHLEARN_COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="Password (demo: learn123)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={VARCHLEARN_COLORS.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={VARCHLEARN_COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton title="Login" onPress={handleLogin} loading={loading} />

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <PrimaryButton
            title="Register"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
          />
        </View>

        {/* All 5 Mascots peeking at bottom */}
        <View style={styles.mascotRow}>
          <MascotAvatar mascotId="vee" expression="happy" size={56} />
          <MascotAvatar mascotId="pixie" expression="curious" size={54} />
          <MascotAvatar mascotId="echo" expression="excited" size={54} />
          <MascotAvatar mascotId="winky" expression="happy" size={54} />
          <MascotAvatar mascotId="bouncy" expression="encouraging" size={54} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: 'space-between',
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
    marginVertical: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
  },
  subtitle: {
    fontSize: 15,
    color: VARCHLEARN_COLORS.textSecondary,
    marginTop: 6,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: VARCHLEARN_COLORS.textPrimary,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: VARCHLEARN_COLORS.primary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  errorText: {
    color: VARCHLEARN_COLORS.danger,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  line: { flex: 1, height: 1, backgroundColor: VARCHLEARN_COLORS.borderLavender },
  orText: { color: VARCHLEARN_COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  mascotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 22,
  },
});
