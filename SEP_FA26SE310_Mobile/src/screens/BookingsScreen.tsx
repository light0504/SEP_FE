import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { TripCard } from '../components/TripCard';
import { BookingCard } from '../components/BookingCard';
import { useMyBookings } from '../hooks/useMyBookings';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';

interface Props { onFindTrips: () => void }

export function BookingsScreen({ onFindTrips }: Props) {
  const { authSession } = useAppContext();
  return authSession ? <LiveBookingsScreen onFindTrips={onFindTrips} /> : <DemoBookingsScreen onFindTrips={onFindTrips} />;
}

function LiveBookingsScreen({ onFindTrips }: Props) {
  const { isDarkMode, apiPut } = useAppContext();
  const { bookings, loading, error, reload } = useMyBookings();
  const [cancelling, setCancelling] = useState(false);
  const cancellingRef = useRef(false);
  const confirmCancel = (id: number) => Alert.alert('Hủy đặt chỗ?', 'Ghế sẽ được trả lại.', [
    { text: 'Giữ chỗ', style: 'cancel' },
    { text: 'Hủy đặt chỗ', style: 'destructive', onPress: () => {
      if (cancellingRef.current) return;
      cancellingRef.current = true; setCancelling(true);
      void apiPut(`/student/bookings/${id}/cancel`, {}).then(reload)
        .catch(reason => Alert.alert('Không thể hủy', reason instanceof Error ? reason.message : 'Vui lòng thử lại.'))
        .finally(() => { cancellingRef.current = false; setCancelling(false); });
    } },
  ]);
  const cancelledCount = bookings.filter(booking => booking.status === 'CANCELLED').length;

  return <ScrollView style={isDarkMode && { backgroundColor: darkPalette.background }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}
    refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.green} colors={[colors.green]} />}>
    <AppHeader title="Chỗ của tôi" />
    <View style={styles.listHeading}>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} onPress={reload} style={[styles.reloadButton, loading && styles.reloadDisabled]}><Text style={styles.reloadText}>↻ Tải lại</Text></TouchableOpacity>
    </View>
    {!loading && !error ? <View style={styles.summary}>
      <Text style={styles.number}>{bookings.length.toString().padStart(2, '0')}</Text>
      <View><Text style={styles.summaryTitle}>Tổng số đặt chỗ</Text>{cancelledCount ? <Text style={styles.caption}>{cancelledCount} đã hủy</Text> : null}</View>
    </View> : null}
    {loading ? <View accessibilityRole="progressbar" accessibilityLabel="Đang tải danh sách đặt chỗ" style={[styles.empty, isDarkMode && { backgroundColor: darkPalette.surface }]}>
      <ActivityIndicator size="large" color={colors.green} /><Text style={[styles.loadingText, isDarkMode && { color: darkPalette.muted }]}>Đang tải danh sách đặt chỗ…</Text>
    </View> : error ? <View style={[styles.empty, isDarkMode && { backgroundColor: darkPalette.surface }]}>
      <Text accessibilityRole="alert" style={[styles.emptyCopy, isDarkMode && { color: darkPalette.muted }]}>{error}</Text><PrimaryButton title="Thử lại" onPress={reload} />
    </View> : bookings.length === 0 ? <View style={[styles.empty, isDarkMode && { backgroundColor: darkPalette.surface }]}>
      <Text style={styles.emptyIcon}>⌁</Text><Text style={[styles.emptyTitle, isDarkMode && { color: darkPalette.text }]}>Chưa có đặt chỗ nào</Text>
      <PrimaryButton title="Tìm chuyến xe" onPress={onFindTrips} />
    </View> : bookings.map(booking => <BookingCard key={booking.bookingId} booking={booking} busy={cancelling}
      onCancel={booking.status === 'RESERVED' && (!booking.departureAt || new Date(`${booking.departureAt}+07:00`).getTime() > Date.now()) ? () => confirmCancel(booking.bookingId) : undefined} />)}
  </ScrollView>;
}

function DemoBookingsScreen({ onFindTrips }: Props) {
  const { trips, cancel, checkInTrip, isDarkMode } = useAppContext();
  const myTrips = trips.filter((trip) => trip.status);

  const confirmCancel = (tripId: string) => Alert.alert('Hủy đặt chỗ?', undefined, [
    { text: 'Giữ chỗ', style: 'cancel' },
    { text: 'Hủy chỗ', style: 'destructive', onPress: () => cancel(tripId) },
  ]);

  const handleCheckIn = (tripId: string) => {
    checkInTrip(tripId);
    Alert.alert('Check-in thành công');
  };

  return (
    <ScrollView style={isDarkMode && { backgroundColor: darkPalette.background }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <AppHeader title="Chỗ của tôi" />
      <View style={styles.summary}><Text style={styles.number}>{myTrips.length.toString().padStart(2, '0')}</Text><Text style={styles.summaryTitle}>Đã đăng ký</Text></View>
      {myTrips.length === 0 ? (
        <View style={[styles.empty, isDarkMode && { backgroundColor: darkPalette.surface }]}><Text style={styles.emptyIcon}>⌁</Text><Text style={[styles.emptyTitle, isDarkMode && { color: darkPalette.text }]}>Chưa có chuyến xe nào</Text><PrimaryButton title="Tìm chuyến xe" onPress={onFindTrips} /></View>
      ) : myTrips.map((trip) => (
        <View key={trip.id}>
          <TripCard trip={trip} action={() => trip.status === 'booked' ? handleCheckIn(trip.id) : undefined} actionLabel={trip.status === 'waitlist' ? 'Đang chờ' : trip.status === 'boarded' ? 'Đã check-in ✓' : 'Check-in'} />
          {trip.status === 'booked' || trip.status === 'waitlist' ? <TouchableOpacity onPress={() => confirmCancel(trip.id)} style={styles.cancelLink}><Text style={styles.cancelText}>Hủy đăng ký</Text></TouchableOpacity> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 14 }, reloadButton: { paddingVertical: 10, paddingHorizontal: 6 }, reloadText: { color: colors.green, fontSize: 12, fontWeight: '700' }, reloadDisabled: { opacity: 0.5 }, loadingText: { color: colors.muted, fontSize: 12, marginTop: 16 },
  summary: { padding: 18, backgroundColor: colors.green, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  number: { color: '#F4CC78', fontSize: 34, fontWeight: '900' }, summaryTitle: { color: colors.white, fontSize: 14, fontWeight: '800' }, caption: { color: '#D0E1D6', fontSize: 10, marginTop: 4 },
  empty: { minHeight: 270, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 43, color: '#B8C9BF', marginBottom: 10 }, emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 16 }, emptyCopy: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 7, marginBottom: 18 },
  cancelLink: { marginTop: -5, marginBottom: 14, alignSelf: 'flex-end', paddingHorizontal: 5 }, cancelText: { color: colors.red, fontSize: 11, fontWeight: '700' },
});
