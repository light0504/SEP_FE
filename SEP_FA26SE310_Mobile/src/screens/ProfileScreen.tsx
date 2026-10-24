import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { PreferredStopSetting } from '../components/PreferredStopSetting';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';

export function ProfileScreen() {
  const { profile, isDarkMode, toggleDarkMode, signOut, isSigningOut, role } = useAppContext();
  const palette = isDarkMode ? darkPalette : null;

  return (
    <ScrollView style={[styles.screen, palette && { backgroundColor: palette.background }]} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <AppHeader title="Hồ sơ cá nhân" />

      <View style={[styles.infoCard, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <InfoRow label="TÊN" value={profile.name} isDarkMode={isDarkMode} />
        <View style={[styles.divider, palette && { backgroundColor: palette.border }]} />
        <InfoRow label="EMAIL" value={profile.email} isDarkMode={isDarkMode} />
      </View>

      <View style={[styles.settingsCard, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.settingsHeading, palette && { color: palette.text }]}>Cài đặt</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, palette && { color: palette.text }]}>Dark mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#CBD2D8', true: colors.green }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#F4F5F6'}
            accessibilityLabel="Bật hoặc tắt Dark mode"
          />
        </View>
        {role === 'student' || role === 'lecturer' ? <PreferredStopSetting /> : null}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }} disabled={isSigningOut} onPress={() => { void signOut(); }} style={[styles.logoutButton, palette && { backgroundColor: palette.surface, borderColor: palette.border }, isSigningOut && styles.logoutDisabled]}>
        {isSigningOut ? <ActivityIndicator color="#C34C4C" /> : null}
        <Text style={styles.logoutText}>{isSigningOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value, isDarkMode }: { label: string; value: string; isDarkMode: boolean }) {
  const palette = isDarkMode ? darkPalette : null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, palette && { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.value, palette && { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  page: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 },
  infoCard: { backgroundColor: colors.white, borderRadius: 19, paddingHorizontal: 17, borderWidth: 1, borderColor: colors.line },
  infoRow: { minHeight: 76, justifyContent: 'center', gap: 7 },
  label: { color: '#8B9690', fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  value: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.line },
  settingsCard: { marginTop: 16, backgroundColor: colors.white, borderRadius: 19, paddingHorizontal: 17, paddingTop: 16, paddingBottom: 8, borderWidth: 1, borderColor: colors.line },
  settingsHeading: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  settingRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingCopy: { flex: 1, paddingRight: 10 },
  settingTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  logoutButton: { marginTop: 20, minHeight: 50, borderWidth: 1, borderColor: '#F0D4D4', borderRadius: 14, backgroundColor: '#FFF5F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: '#C34C4C', fontSize: 14, fontWeight: '700' }, logoutDisabled: { opacity: 0.6 },
});
