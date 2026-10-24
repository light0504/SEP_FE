import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import type { StudentBooking } from '../types/studentBookings';
import { bookingStatusLabel, formatBookingTimestamp } from '../utils/bookingPresentation';

export function BookingCard({ booking, onCancel, busy = false }: { booking: StudentBooking; onCancel?: () => void; busy?: boolean }) {
  const { isDarkMode } = useAppContext();
  const palette = isDarkMode ? darkPalette : null;
  const cancelled = booking.status === 'CANCELLED';

  return <View style={[styles.card, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}>
    <View style={styles.topRow}>
      <Text style={[styles.eyebrow, palette && { color: palette.muted }]}>ĐẶT CHỖ #{booking.bookingId}</Text>
      <View style={[styles.status, cancelled && styles.cancelledStatus, palette && !cancelled && { backgroundColor: palette.input }]}>
        <Text style={[styles.statusText, cancelled && styles.cancelledText, palette && !cancelled && { color: palette.text }]}>{bookingStatusLabel(booking.status)}</Text>
      </View>
    </View>
    <Text selectable style={[styles.tripCode, palette && { color: palette.text }]}>{booking.tripCode}</Text>
    <View style={styles.route}>
      <View style={styles.timeline}><View style={styles.dot} /><View style={styles.connector} /><View style={[styles.dot, styles.endDot]} /></View>
      <View style={styles.stops}>
        <View><Text style={[styles.label, palette && { color: palette.muted }]}>ĐIỂM ĐÓN</Text><Text style={[styles.stopName, palette && { color: palette.text }]}>{booking.boardingStop}</Text></View>
        <View><Text style={[styles.label, palette && { color: palette.muted }]}>ĐIỂM TRẢ</Text><Text style={[styles.stopName, palette && { color: palette.text }]}>{booking.alightingStop}</Text></View>
      </View>
      <View style={[styles.seat, palette && { backgroundColor: palette.input }]}><Text style={[styles.label, palette && { color: palette.muted }]}>GHẾ</Text><Text style={[styles.seatCode, palette && { color: palette.text }]}>{booking.seatCode}</Text></View>
    </View>
    <View style={[styles.details, palette && { borderTopColor: palette.border }]}>
      {booking.departureAt ? <Detail label="Giờ đón" value={formatBookingTimestamp(booking.departureAt)} isDarkMode={isDarkMode} /> : null}
      <Detail label="Đặt lúc" value={formatBookingTimestamp(booking.reservedAt)} isDarkMode={isDarkMode} />
      {booking.checkedInAt ? <Detail label="Check-in lúc" value={formatBookingTimestamp(booking.checkedInAt)} isDarkMode={isDarkMode} /> : null}
      {booking.cancelledAt ? <Detail label="Hủy lúc" value={formatBookingTimestamp(booking.cancelledAt)} isDarkMode={isDarkMode} /> : null}
      <Text style={[styles.label, styles.codeLabel, palette && { color: palette.muted }]}>MÃ ĐẶT CHỖ</Text>
      <Text selectable style={[styles.bookingCode, palette && { color: palette.muted }]}>{booking.bookingCode}</Text>
    </View>
    {onCancel ? <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>{busy ? 'Đang xử lý…' : 'Hủy đặt chỗ'}</Text></TouchableOpacity> : null}
  </View>;
}

function Detail({ label, value, isDarkMode }: { label: string; value: string; isDarkMode: boolean }) {
  return <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, isDarkMode && { color: darkPalette.muted }]}>{label}</Text>
    <Text style={[styles.detailValue, isDarkMode && { color: darkPalette.text }]}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  cancelButton: { paddingVertical: 13, alignSelf: 'flex-end' }, cancelText: { color: colors.red, fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: colors.white, borderRadius: 19, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '700', flex: 1 },
  status: { maxWidth: '60%', backgroundColor: '#EEF2F5', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }, statusText: { color: '#526579', fontSize: 10, fontWeight: '700' }, cancelledStatus: { backgroundColor: '#FCE8E7' }, cancelledText: { color: '#B74C4C' },
  tripCode: { color: colors.ink, fontSize: 12, lineHeight: 19, fontWeight: '700', marginTop: 13 },
  route: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 }, timeline: { alignItems: 'center' }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }, endDot: { backgroundColor: '#E8A94D' }, connector: { height: 48, width: 1, backgroundColor: '#C7D2CB' },
  stops: { flex: 1, gap: 17 }, label: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }, stopName: { color: colors.ink, fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 4 },
  seat: { minWidth: 58, padding: 10, borderRadius: 12, backgroundColor: '#F1F6F2', alignItems: 'center' }, seatCode: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 5 },
  details: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }, detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 8 }, detailLabel: { color: colors.muted, fontSize: 11 }, detailValue: { flex: 1, textAlign: 'right', color: colors.ink, fontSize: 11 },
  codeLabel: { marginTop: 5, marginBottom: 6 }, bookingCode: { color: colors.muted, fontSize: 10, lineHeight: 17 },
});
