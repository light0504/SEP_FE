import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { Trip } from '../types';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';
import { formatCalendarDate } from '../utils/calendarDate';

interface Props { trip: Trip; action: () => void; actionLabel?: string; actionDisabled?: boolean }

export function TripCard({ trip, action, actionLabel, actionDisabled = false }: Props) {
  const { isDarkMode } = useAppContext();
  const full = trip.seats === 0;
  return (
    <View style={[styles.card, isDarkMode && { backgroundColor: darkPalette.surface, borderColor: darkPalette.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.date, isDarkMode && { color: darkPalette.muted }]}>{formatCalendarDate(trip.date)}</Text>
        <Text style={[styles.pill, full && styles.fullPill]}>{full ? 'Hết chỗ' : `Còn ${trip.seats} ghế`}</Text>
      </View>
      <View style={styles.routeRow}>
        <View style={styles.timeBlock}><Text style={[styles.time, isDarkMode && { color: darkPalette.text }]}>{trip.time}</Text><Text style={[styles.caption, isDarkMode && { color: darkPalette.muted }]}>Điểm đón</Text></View>
        <View style={styles.routeLine}><View style={styles.dot} /><View style={styles.dash} /><View style={[styles.dot, styles.endDot]} /></View>
        <View style={styles.destination}><Text style={[styles.place, isDarkMode && { color: darkPalette.text }]}>{trip.from}</Text><Text style={[styles.place, isDarkMode && { color: darkPalette.text }]}>{trip.to}</Text></View>
        <View style={styles.arrival}><Text style={[styles.time, isDarkMode && { color: darkPalette.text }]}>{trip.arrival}</Text><Text style={[styles.caption, isDarkMode && { color: darkPalette.muted }]}>Đến nơi</Text></View>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.bus, isDarkMode && { color: darkPalette.muted }]}>▰  {trip.bus} · Slot {trip.slot}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: actionDisabled }} disabled={actionDisabled} onPress={action} style={[styles.action, actionDisabled && { opacity: 0.5 }]}>
          <Text style={styles.actionText}>{actionLabel ?? (full ? 'Vào danh sách chờ' : 'Đặt chỗ')}  ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15, backgroundColor: colors.white, borderRadius: 19, marginBottom: 12, borderWidth: 1, borderColor: '#EDF0ED' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  date: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  pill: { color: colors.green, backgroundColor: colors.pale, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '700' },
  fullPill: { color: colors.orange, backgroundColor: colors.orangePale },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  timeBlock: { width: 48 },
  time: { fontSize: 16, color: colors.ink, fontWeight: '800' },
  caption: { fontSize: 9, color: colors.muted, marginTop: 3 },
  routeLine: { width: 20, alignItems: 'center', marginHorizontal: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  endDot: { backgroundColor: '#E8A94D' },
  dash: { height: 21, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: '#BAC7BF' },
  destination: { flex: 1, justifyContent: 'space-between', height: 52 },
  place: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  arrival: { alignItems: 'flex-end' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 11, borderTopWidth: 1, borderColor: colors.line },
  bus: { color: colors.muted, fontSize: 10 },
  action: { backgroundColor: colors.pale, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 10 },
  actionText: { color: colors.green, fontSize: 10, fontWeight: '800' },
});
