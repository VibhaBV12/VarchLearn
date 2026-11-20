import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { MascotId } from '../../../../../shared/types';
import { MASCOT_META, VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PrimaryButton } from '../../components/PrimaryButton';

const MASCOTS: MascotId[] = ['vee', 'pixie', 'echo', 'winky', 'bouncy'];

export const AccountSettingsScreen: React.FC = () => {
  const { student, updateStudent } = useAuth();
  const navigation = useNavigation();
  const [selectedMascot, setSelectedMascot] = useState<MascotId>(student?.avatarMascot || 'vee');
  const [saved, setSaved] = useState(false);

  if (!student) return null;

  const handleSave = async () => {
    await updateStudent({ ...student, avatarMascot: selectedMascot });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={VARCHLEARN_COLORS.darkPurple} />
      </TouchableOpacity>
      <Text style={styles.title}>Account Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Choose Your Profile Mascot</Text>
        <View style={styles.row}>
          {MASCOTS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMascot(m)}
              style={[styles.mascotPick, selectedMascot === m && styles.mascotActive]}
            >
              <MascotAvatar mascotId={m} expression="happy" size={50} />
              <Text style={styles.mascotName}>{MASCOT_META[m].name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {saved ? <Text style={styles.saved}>Avatar updated!</Text> : null}
      <PrimaryButton title="Save Changes" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 20, paddingTop: 48, gap: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  label: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  mascotPick: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  mascotActive: {
    borderColor: VARCHLEARN_COLORS.primary,
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
  },
  mascotName: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  saved: { color: VARCHLEARN_COLORS.success, fontWeight: '700', textAlign: 'center' },
});
