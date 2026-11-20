import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { MascotAvatar } from '../../components/MascotAvatar';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { RootStackParamList } from '../../navigation/types';

export const StudentProfileScreen: React.FC = () => {
  const { student, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (!student) return null;

  const menuItems = [
    {
      label: 'Daily Adventure Path',
      icon: 'map-outline',
      onPress: () => navigation.navigate('AdventurePath'),
    },
    {
      label: 'Account Settings',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('AccountSettings'),
    },
    {
      label: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      label: 'Change Recovery PIN',
      icon: 'keypad-outline',
      onPress: () => navigation.navigate('ChangePin'),
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.header}>My Profile</Text>

      <View style={styles.profileCard}>
        <MascotAvatar mascotId={student.avatarMascot} expression="happy" size={88} />
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.meta}>
          @{student.username} • {student.className}
        </Text>

        {/* Stars, Completed Activities & Achievements — NO daily activity performance scores */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>⭐ {student.stars}</Text>
            <Text style={styles.statLbl}>Stars</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{student.completedActivitiesCount}</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{student.badges.length}</Text>
            <Text style={styles.statLbl}>Badges</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuRow} onPress={item.onPress}>
            <Ionicons name={item.icon as any} size={20} color={VARCHLEARN_COLORS.primary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={VARCHLEARN_COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.menuRow} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={VARCHLEARN_COLORS.danger} />
          <Text style={[styles.menuLabel, { color: VARCHLEARN_COLORS.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mascotStrip}>
        <MascotAvatar mascotId="vee" expression="happy" size={48} />
        <MascotAvatar mascotId="pixie" expression="happy" size={48} />
        <MascotAvatar mascotId="echo" expression="happy" size={48} />
        <MascotAvatar mascotId="winky" expression="happy" size={48} />
        <MascotAvatar mascotId="bouncy" expression="happy" size={48} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: VARCHLEARN_COLORS.lavenderTint },
  content: { padding: 18, paddingTop: 52, paddingBottom: 36, gap: 16 },
  header: { fontSize: 26, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  name: { fontSize: 22, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  meta: { fontSize: 13.5, color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12, width: '100%' },
  statBox: {
    flex: 1,
    backgroundColor: VARCHLEARN_COLORS.lightLavender,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statVal: { fontSize: 17, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  statLbl: { fontSize: 11.5, color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: VARCHLEARN_COLORS.lavenderTint,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  mascotStrip: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
});
