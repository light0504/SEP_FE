import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { ProfileScreen } from './ProfileScreen';
import { formatCalendarDate } from '../utils/calendarDate';
import type { StudentTrip } from '../types/studentTrips';

type CrewTrip = StudentTrip & { busAttendant: string | null; booked: number };

export function CrewHomeScreen() {
  const { apiGet, role, profile, isDarkMode } = useAppContext();
  const [showProfile, setShowProfile] = useState(false);
  const [trips, setTrips] = useState<CrewTrip[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const palette = isDarkMode ? darkPalette : { background: colors.canvas, surface: colors.white, text: colors.ink, muted: colors.muted, border: colors.line };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    apiGet<CrewTrip[]>('/staff/trips', controller.signal).then(data => { if (!controller.signal.aborted) setTrips(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không thể tải chuyến.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiGet, attempt]);
  if (showProfile) return <View style={[styles.screen, { backgroundColor: palette.background }]}>
    <TouchableOpacity accessibilityRole="button" onPress={() => setShowProfile(false)} style={styles.back}><Text style={{ color: palette.text }}>‹ Chuyến của tôi</Text></TouchableOpacity><ProfileScreen />
  </View>;
  return <View style={[styles.screen, { backgroundColor: palette.background }]}>
    <View style={[styles.header, { backgroundColor: palette.surface }]}><View style={styles.identity}><Text style={[styles.name, { color: palette.text }]}>{profile.name}</Text><Text style={[styles.meta, { color: palette.muted }]}>{role === 'driver' ? 'Tài xế' : 'Bus attendant'}</Text></View><TouchableOpacity accessibilityRole="button" onPress={() => setShowProfile(true)} style={styles.profile}><Text style={{ color: palette.text }}>Hồ sơ</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setAttempt(value => value + 1)} tintColor={colors.green} />}>
      <Text style={[styles.title, { color: palette.text }]}>Chuyến được phân công</Text>
      {loading ? <ActivityIndicator color={colors.green} style={styles.empty} /> : error ? <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={styles.back}><Text style={{ color: palette.text }}>Thử lại</Text></TouchableOpacity></View>
        : !trips.length ? <Text style={[styles.empty, { color: palette.muted }]}>Chưa có chuyến được phân công.</Text> : trips.map(trip => <View key={trip.tripId} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.name, { color: palette.text }]}>{trip.routeName}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>{formatCalendarDate(trip.date)} · {trip.time} · Slot {trip.slot}</Text>
          <Text style={[styles.meta, { color: palette.text }]}>{trip.vehicle} · {trip.booked}/{trip.capacity} chỗ</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>Tài xế: {trip.driver}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>Bus attendant: {trip.busAttendant || 'Chưa phân công'}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>{trip.status === 'PAUSED' ? 'Tạm dừng' : 'Đang mở'}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: expanded === trip.tripId }} onPress={() => setExpanded(expanded === trip.tripId ? null : trip.tripId)} style={styles.detailButton}><Text style={{ color: palette.text }}>{expanded === trip.tripId ? 'Thu gọn' : 'Chi tiết'}</Text></TouchableOpacity>
          {expanded === trip.tripId ? trip.stops.map(stop => <View key={stop.tripStopId} style={[styles.stop, { borderColor: palette.border }]}><Text style={[styles.stopName, { color: palette.text }]}>{stop.name}</Text><Text style={{ color: palette.muted }}>{stop.arrivalAt.slice(11, 16)}</Text></View>) : null}
        </View>)}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }, identity: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' }, meta: { fontSize: 13, lineHeight: 20, marginTop: 7 }, profile: { padding: 12 }, back: { padding: 18 },
  content: { padding: 20, paddingBottom: 32 }, title: { fontSize: 20, fontWeight: '700', marginBottom: 20 }, empty: { paddingVertical: 50, textAlign: 'center' },
  error: { color: colors.red, lineHeight: 22 }, card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 15 }, detailButton: { paddingVertical: 14, alignSelf: 'flex-end' },
  stop: { paddingVertical: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, stopName: { flex: 1, fontSize: 13 },
});
