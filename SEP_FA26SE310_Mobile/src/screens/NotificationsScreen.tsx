import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SubPageHeader } from '../components/SubPageHeader';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { formatCalendarDate } from '../utils/calendarDate';

interface Props { onBack: () => void }

export function NotificationsScreen({ onBack }: Props) {
  const { trips, isDarkMode } = useAppContext();
  const waitlistedTrips = trips.filter((trip) => trip.status === 'waitlist');

  return (
    <View style={[styles.screen, isDarkMode && { backgroundColor: darkPalette.background }]}>
      <SubPageHeader title="Thông báo" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {waitlistedTrips.length === 0 ? (
          <View style={[styles.emptyState, isDarkMode && { backgroundColor: darkPalette.surface, borderColor: darkPalette.border }]}>
            <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>🔔</Text></View>
            <Text style={[styles.emptyTitle, isDarkMode && { color: darkPalette.text }]}>Chưa có thông báo mới</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, isDarkMode && { color: darkPalette.muted }]}>DANH SÁCH CHỜ</Text>
            {waitlistedTrips.map((trip) => (
              <View key={trip.id} style={[styles.notificationCard, isDarkMode && { backgroundColor: darkPalette.surface, borderColor: darkPalette.border }]}>
                <View style={styles.notificationIcon}><Text style={styles.waitIcon}>◷</Text></View>
                <View style={styles.notificationCopy}>
                  <Text style={[styles.notificationTitle, isDarkMode && { color: darkPalette.text }]}>Bạn đang trong danh sách chờ</Text>
                  <Text style={[styles.notificationText, isDarkMode && { color: darkPalette.muted }]}>{trip.from} → {trip.to}</Text>
                  <Text style={[styles.notificationMeta, isDarkMode && { color: darkPalette.muted }]}>{formatCalendarDate(trip.date)} · {trip.time}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F4F8' }, content: { flexGrow: 1, padding: 20 },
  emptyState: { flex: 1, minHeight: 350, backgroundColor: colors.white, borderRadius: 22, justifyContent: 'center', alignItems: 'center', padding: 28, borderWidth: 1, borderColor: '#EBEEF1' },
  emptyIconBox: { width: 82, height: 82, borderRadius: 24, backgroundColor: '#FFF1D9', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, emptyIcon: { fontSize: 34 },
  emptyTitle: { color: '#263A4D', fontSize: 17, fontWeight: '800', textAlign: 'center' }, emptyText: { color: '#82909B', fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8, maxWidth: 270 },
  sectionTitle: { color: '#788692', fontSize: 11, letterSpacing: 1, fontWeight: '800', marginBottom: 12 },
  notificationCard: { flexDirection: 'row', gap: 13, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: '#EBEEF1', padding: 16, marginBottom: 11, alignItems: 'center' },
  notificationIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' }, waitIcon: { fontSize: 25, color: '#7955D9' },
  notificationCopy: { flex: 1 }, notificationTitle: { color: '#293D50', fontSize: 13, fontWeight: '800' }, notificationText: { color: '#5C6B78', fontSize: 11, marginTop: 5 }, notificationMeta: { color: '#94A0A9', fontSize: 10, marginTop: 4 },
});
