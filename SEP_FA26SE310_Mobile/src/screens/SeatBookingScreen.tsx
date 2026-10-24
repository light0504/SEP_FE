import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SubPageHeader } from '../components/SubPageHeader';
import { BusSeatMap } from '../components/BusSeatMap';
import { useAppContext } from '../context/AppContext';
import { ApiError } from '../services/apiClient';
import { createStudentBooking, getTripSeats } from '../services/studentTripService';
import type { AvailableSeat, CreateBooking, StudentTrip, TripStop } from '../types/studentTrips';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { formatBookingTimestamp } from '../utils/bookingPresentation';

interface Props { trip: StudentTrip; boarding: TripStop; alighting: TripStop; onBack: () => void; onBooked: () => void }

export function SeatBookingScreen({ trip, boarding, alighting, onBack, onBooked }: Props) {
  const { apiGet, apiPost, isDarkMode } = useAppContext();
  const [seats, setSeats] = useState<AvailableSeat[]>([]);
  const [seatId, setSeatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestRef = useRef<CreateBooking | null>(null);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const palette = isDarkMode ? darkPalette : { background: '#F2F4F8', surface: colors.white, text: colors.ink, muted: colors.muted, border: colors.line };

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSeats([]); setSeatId(null);
    getTripSeats(apiGet, trip.tripId, boarding.tripStopId, alighting.tripStopId, controller.signal)
      .then(data => { if (!controller.signal.aborted) setSeats(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không thể tải ghế.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiGet, trip.tripId, boarding.tripStopId, alighting.tripStopId, attempt]);

  const selectedSeat = seats.find(seat => seat.seatId === seatId && seat.status === 'AVAILABLE');
  const book = async () => {
    if (!selectedSeat || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError('');
    if (!requestRef.current || requestRef.current.seatId !== selectedSeat.seatId) {
      requestRef.current = { tripId: trip.tripId, boardingTripStopId: boarding.tripStopId, alightingTripStopId: alighting.tripStopId,
        seatId: selectedSeat.seatId, idempotencyKey: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}` };
    }
    try {
      const booking = await createStudentBooking(apiPost, requestRef.current);
      if (mounted.current) {
        Alert.alert(booking.status === 'CANCELLED' ? 'Đặt chỗ đã hủy' : 'Đặt chỗ thành công', `Ghế ${booking.seatCode}`);
        onBooked();
      }
    } catch (reason) {
      if (!mounted.current) return;
      if (reason instanceof ApiError && reason.status === 409) { requestRef.current = null; setSeatId(null); setAttempt(value => value + 1); Alert.alert('Không thể đặt chỗ', reason.message); }
      else setError(reason instanceof Error ? reason.message : 'Không thể đặt chỗ.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return <View style={[styles.screen, { backgroundColor: palette.background }]}>
    <SubPageHeader title="Chọn ghế" onBack={() => { if (!savingRef.current) onBack(); }} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.route, { color: palette.text }]}>{boarding.name} → {alighting.name}</Text>
      <Text style={[styles.meta, { color: palette.muted }]}>{formatBookingTimestamp(boarding.arrivalAt)} · Slot {trip.slot}</Text>
      <Text style={[styles.meta, { color: palette.muted }]}>{trip.vehicle} · {trip.driver}</Text>
      {loading ? <ActivityIndicator style={styles.loading} color={colors.green} /> : <>
        <View style={styles.legend}><Text style={{ color: palette.muted }}>□ Trống</Text><Text style={{ color: colors.green }}>■ Đang chọn</Text><Text style={{ color: palette.muted }}>▧ Đã đặt</Text></View>
        {seats.length ? <BusSeatMap seats={seats} selectedId={seatId} disabled={saving} palette={palette}
          onSelect={id => { setSeatId(id); setError(''); }} /> : null}
        {!error && seats.every(seat => seat.status !== 'AVAILABLE') ? <Text style={[styles.empty, { color: palette.muted }]}>Không còn ghế trống.</Text> : null}
      </>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <TouchableOpacity accessibilityRole="button" disabled={loading || saving} onPress={() => { requestRef.current = null; setAttempt(value => value + 1); }} style={styles.reload}><Text style={{ color: palette.muted }}>Tải lại ghế</Text></TouchableOpacity>
    </ScrollView>
    <View style={[styles.footer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <TouchableOpacity accessibilityRole="button" disabled={!selectedSeat || saving || loading} onPress={() => { void book(); }} style={[styles.confirm, (!selectedSeat || saving || loading) && styles.disabled]}>
        <Text style={styles.confirmText}>{saving ? 'Đang đặt…' : selectedSeat ? `Đặt ghế ${selectedSeat.seatCode}` : 'Chọn ghế'}</Text>
      </TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 20, paddingBottom: 30 }, route: { fontSize: 17, fontWeight: '700', lineHeight: 25 },
  meta: { marginTop: 8, fontSize: 13 }, loading: { marginVertical: 50 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginVertical: 25 },
  empty: { textAlign: 'center', marginTop: 30 }, error: { color: colors.red, marginTop: 20, lineHeight: 21 },
  reload: { padding: 15, alignItems: 'center', marginTop: 10 }, footer: { padding: 16, borderTopWidth: 1 },
  confirm: { padding: 17, backgroundColor: colors.green, borderRadius: 14, alignItems: 'center' }, confirmText: { color: colors.white, fontWeight: '700' }, disabled: { opacity: 0.5 },
});
