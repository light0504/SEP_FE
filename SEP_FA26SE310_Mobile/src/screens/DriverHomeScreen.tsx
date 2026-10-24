import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardTile } from '../components/DashboardTile';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { DriverReportScreen } from './DriverReportScreen';

type PassengerStatus = 'confirmed' | 'boarded' | 'no-show' | 'released';
type DriverPage = 'home' | 'trip' | 'passengers' | 'reports';
interface Passenger { id: string; name: string; studentId: string; stop: string; status: PassengerStatus }

const initialPassengers: Passenger[] = [
  { id: 'P01', name: 'Nguyễn Minh Anh', studentId: 'SE180101', stop: 'Campus Q9', status: 'confirmed' },
  { id: 'P02', name: 'Trần Gia Hân', studentId: 'SE180215', stop: 'Campus Q9', status: 'confirmed' },
  { id: 'P03', name: 'Lê Hoàng Nam', studentId: 'SE180322', stop: 'Khu Công nghệ cao', status: 'confirmed' },
  { id: 'P04', name: 'Phạm Khánh Linh', studentId: 'SE180408', stop: 'Khu Công nghệ cao', status: 'boarded' },
];

const statusLabels: Record<PassengerStatus, string> = {
  confirmed: 'Đã xác nhận',
  boarded: 'Đã lên xe',
  'no-show': 'No-show',
  released: 'Đã giải phóng ghế',
};

export function DriverHomeScreen() {
  const { signOut, isSigningOut, isDarkMode } = useAppContext();
  const [page, setPage] = useState<DriverPage>('home');
  const [passengers, setPassengers] = useState(initialPassengers);
  const [lastIssue, setLastIssue] = useState('');
  const palette = isDarkMode ? darkPalette : null;
  const boardedCount = passengers.filter((passenger) => passenger.status === 'boarded').length;
  const confirmedCount = passengers.filter((passenger) => passenger.status === 'confirmed').length;

  const updateStatus = (passengerId: string, status: PassengerStatus) => {
    setPassengers((current) => current.map((passenger) => passenger.id === passengerId ? { ...passenger, status } : passenger));
  };

  const markNoShow = (passenger: Passenger) => Alert.alert('Xác nhận no-show', `Ghi nhận ${passenger.name} không có mặt?`, [
    { text: 'Quay lại', style: 'cancel' },
    { text: 'Xác nhận', style: 'destructive', onPress: () => updateStatus(passenger.id, 'no-show') },
  ]);

  const releaseSeat = (passenger: Passenger) => Alert.alert('Giải phóng ghế', 'Chuyển ghế cho danh sách chờ ở điểm kế tiếp?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Giải phóng', onPress: () => {
      updateStatus(passenger.id, 'released');
      Alert.alert('Đã giải phóng ghế · Demo');
    } },
  ]);

  const statusStyle = (status: PassengerStatus) => status === 'boarded' ? styles.statusBoarded
    : status === 'no-show' ? styles.statusNoShow
      : status === 'released' ? styles.statusReleased : styles.statusConfirmed;

  const pageTitle: Record<DriverPage, string> = { home: 'Chế độ tài xế', trip: 'Chi tiết chuyến xe', passengers: 'Danh sách hành khách', reports: 'Báo cáo sự cố' };

  return (
    <View style={[styles.screen, palette && { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        {page !== 'home' ? <TouchableOpacity accessibilityRole="button" onPress={() => setPage('home')} style={styles.backButton}><Text style={styles.backText}>‹</Text></TouchableOpacity> : null}
        <View style={styles.headerProfile}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View><Text style={styles.headerTitle}>{pageTitle[page]}</Text></View>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đăng xuất" accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }} disabled={isSigningOut} onPress={() => { void signOut(); }} style={[styles.logout, isSigningOut && { opacity: 0.6 }]}><Text style={styles.logoutText}>{isSigningOut ? 'Đang thoát…' : 'Đăng xuất'}</Text></TouchableOpacity>
      </View>

      {page === 'reports' ? <DriverReportScreen onBack={() => setPage('home')} lastReport={lastIssue} onSubmitReport={(summary) => { setLastIssue(summary); setPage('home'); Alert.alert('Đã lưu báo cáo · Demo'); }} /> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {page === 'home' ? <>
          <View style={styles.onlineTag}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Ca sáng · Demo</Text></View>
          <View style={styles.sectionHeading}><View style={styles.sectionMarker}/><Text style={[styles.sectionTitle, palette && { color: palette.text }]}>ĐIỀU HÀNH CHUYẾN XE</Text></View>
          <View style={styles.tileGrid}>
            <DashboardTile title="Chuyến hiện tại" icon="↔" iconColor="#1976B9" iconBackground="#E4F2FB" onPress={() => setPage('trip')} />
            <DashboardTile title="Danh sách hành khách" icon="♙" iconColor="#E69600" iconBackground="#FFF1D9" onPress={() => setPage('passengers')} />
            <DashboardTile title="Báo cáo sự cố" icon="⚑" iconColor="#D95A5A" iconBackground="#FCE7E5" onPress={() => setPage('reports')} />
            <DashboardTile title="Hỗ trợ điều phối" icon="✆" iconColor="#7955D9" iconBackground="#EEE9FF" onPress={() => Alert.alert('Hỗ trợ điều phối', 'Liên hệ quản lý tuyến qua kênh nội bộ (demo).')} />
          </View>
          <View style={styles.sectionHeading}><View style={styles.sectionMarker}/><Text style={[styles.sectionTitle, palette && { color: palette.text }]}>TÌNH HÌNH CHUYẾN HÔM NAY</Text></View>
        </> : null}
        {page === 'trip' ? <View style={styles.sectionHeading}><View style={styles.sectionMarker}/><Text style={[styles.sectionTitle, palette && { color: palette.text }]}>THÔNG TIN TUYẾN</Text></View> : null}
        {page !== 'passengers' ? <>
        {page === 'trip' ? <View style={styles.onlineTag}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Ca sáng · Demo</Text></View> : null}

        {page === 'trip' ? <View style={styles.tripPanel}>
          <View style={styles.tripPanelTop}><Text style={styles.tripEyebrow}>CHUYẾN HIỆN TẠI</Text><Text style={styles.busTag}>F-Bus 01</Text></View>
          <Text style={styles.tripName}>Campus Q9 → Campus Tân Uyên</Text>
          <View style={styles.tripMeta}><Text style={styles.tripMetaText}>06:30 khởi hành</Text><Text style={styles.tripMetaText}>45 chỗ</Text></View>
          <View style={styles.stopTimeline}><View style={styles.timelineItem}><View style={styles.timelineDot} /><Text style={styles.stopName}>Campus Q9</Text><Text style={styles.stopState}>Điểm hiện tại</Text></View><View style={styles.timelineConnector} /><View style={styles.timelineItem}><View style={[styles.timelineDot, styles.nextStopDot]} /><Text style={styles.stopName}>Khu Công nghệ cao</Text><Text style={styles.stopState}>Điểm tiếp theo</Text></View><View style={styles.timelineConnector} /><View style={styles.timelineItem}><View style={[styles.timelineDot, styles.finalStopDot]} /><Text style={styles.stopName}>Campus Tân Uyên</Text><Text style={styles.stopState}>Điểm cuối</Text></View></View>
        </View> : null}

        <View style={styles.statsRow}>
          <StatCard value={`${boardedCount}`} label="Đã lên xe" palette={palette} />
          <StatCard value={`${confirmedCount}`} label="Chờ đón" palette={palette} />
          <StatCard value={`${passengers.filter((passenger) => passenger.status === 'released').length}`} label="Ghế mở" palette={palette} />
        </View>
        </> : null}

        {page === 'passengers' ? <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, palette && { color: palette.text }]}>Hành khách tại điểm đón</Text><Text style={[styles.passengerCount, palette && { color: palette.muted }]}>{passengers.length} người</Text></View> : null}
        {page === 'passengers' ? <View style={styles.statsRow}><StatCard value={`${boardedCount}`} label="Đã lên xe" palette={palette}/><StatCard value={`${confirmedCount}`} label="Chờ đón" palette={palette}/><StatCard value={`${passengers.filter((passenger) => passenger.status === 'no-show').length}`} label="Vắng mặt" palette={palette}/></View> : null}
        {page === 'home' ? <TouchableOpacity onPress={() => setPage('trip')} style={[styles.tripLink, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.tripLinkTitle, palette && { color: palette.text }]}>F-Bus 01 · Campus Q9 → Tân Uyên</Text><Text style={[styles.tripLinkSubtitle, palette && { color: palette.muted }]}>06:30</Text></TouchableOpacity> : null}
        {page === 'passengers' ? passengers.map((passenger) => (
          <View key={passenger.id} style={[styles.passengerCard, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.passengerTop}>
              <View style={styles.passengerAvatar}><Text style={styles.passengerInitial}>{passenger.name.split(' ').slice(-1)[0]?.[0] ?? 'S'}</Text></View>
              <View style={styles.passengerInfo}><Text style={[styles.passengerName, palette && { color: palette.text }]}>{passenger.name}</Text><Text style={[styles.studentId, palette && { color: palette.muted }]}>{passenger.studentId} · {passenger.stop}</Text></View>
              <Text style={[styles.statusPill, statusStyle(passenger.status)]}>{statusLabels[passenger.status]}</Text>
            </View>
            {passenger.status === 'confirmed' ? <View style={styles.actions}><TouchableOpacity onPress={() => updateStatus(passenger.id, 'boarded')} style={styles.boardedButton}><Text style={styles.boardedButtonText}>Đã lên xe</Text></TouchableOpacity><TouchableOpacity onPress={() => markNoShow(passenger)} style={styles.noShowButton}><Text style={styles.noShowButtonText}>No-show</Text></TouchableOpacity></View> : null}
            {passenger.status === 'no-show' ? <TouchableOpacity onPress={() => releaseSeat(passenger)} style={styles.releaseButton}><Text style={styles.releaseText}>Giải phóng ghế cho điểm kế tiếp</Text></TouchableOpacity> : null}
          </View>
        )) : null}

      </ScrollView>}
    </View>
  );
}

function StatCard({ value, label, palette }: { value: string; label: string; palette: typeof darkPalette | null }) {
  return <View style={[styles.statCard, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.statValue, palette && { color: palette.text }]}>{value}</Text><Text style={[styles.statLabel, palette && { color: palette.muted }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F4F8' },
  header: { minHeight: 82, backgroundColor: '#19324A', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 11 }, logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.white }, headerTitle: { color: colors.white, fontSize: 16, fontWeight: '800' }, headerSubtitle: { color: '#B9C7D4', fontSize: 10, marginTop: 3 },
  logout: { paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#28445D', borderRadius: 10 }, logoutText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  content: { padding: 18, paddingBottom: 30 }, homeGreeting: { color: '#19324A', fontSize: 21, fontWeight: '800' }, homeSubtitle: { color: '#7A8794', fontSize: 12, marginTop: 4 }, onlineTag: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, marginBottom: 8 }, onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22AA77' }, onlineText: { color: '#758390', fontSize: 11, fontWeight: '600' },
  backButton: { width: 30, height: 42, justifyContent: 'center', marginRight: 5 }, backText: { color: colors.white, fontSize: 34, lineHeight: 38 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginTop: 11, marginBottom: 13, gap: 9 }, sectionMarker: { width: 5, height: 24, backgroundColor: '#E99A0C', borderRadius: 3 }, tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 8 }, pageDescription: { color: '#7A8794', fontSize: 11, lineHeight: 17, marginBottom: 13 },
  tripLink: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: '#E9EDF0', padding: 14, marginTop: 1 }, tripLinkTitle: { color: '#293D50', fontSize: 11, fontWeight: '800' }, tripLinkSubtitle: { color: '#82909D', fontSize: 9, marginTop: 6 },
  tripPanel: { backgroundColor: '#19324A', borderRadius: 19, padding: 17, marginBottom: 13 }, tripPanelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, tripEyebrow: { color: '#A8BBCB', fontSize: 9, fontWeight: '800', letterSpacing: 1 }, busTag: { color: '#F7C768', fontSize: 10, fontWeight: '800' }, tripName: { color: colors.white, fontSize: 17, fontWeight: '800', marginTop: 8 }, tripMeta: { flexDirection: 'row', gap: 16, marginTop: 5 }, tripMetaText: { color: '#B9C7D4', fontSize: 10 },
  stopTimeline: { marginTop: 17, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#36516A' }, timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 26 }, timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#F7C768' }, nextStopDot: { backgroundColor: '#7CB6E1' }, finalStopDot: { backgroundColor: '#A8BBCB' }, stopName: { color: colors.white, fontSize: 10, fontWeight: '700', width: 160 }, stopState: { color: '#A8BBCB', fontSize: 9 }, timelineConnector: { height: 9, marginLeft: 4, borderLeftWidth: 1, borderColor: '#688198', borderStyle: 'dashed' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 9, marginBottom: 20 }, statCard: { flex: 1, minHeight: 69, backgroundColor: colors.white, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9EDF0' }, statValue: { color: '#213A50', fontSize: 20, fontWeight: '900' }, statLabel: { color: '#80909D', fontSize: 9, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, sectionTitle: { color: '#263A4D', fontSize: 15, fontWeight: '800' }, passengerCount: { color: '#82909B', fontSize: 10 },
  passengerCard: { padding: 13, backgroundColor: colors.white, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EBEEF1' }, passengerTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, passengerAvatar: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#E2EDF4', alignItems: 'center', justifyContent: 'center' }, passengerInitial: { color: '#285A7D', fontSize: 15, fontWeight: '800' }, passengerInfo: { flex: 1 }, passengerName: { color: '#293D50', fontSize: 11, fontWeight: '800' }, studentId: { color: '#8A97A1', fontSize: 9, marginTop: 3 }, statusPill: { fontSize: 8, fontWeight: '800', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 }, statusConfirmed: { color: '#A26914', backgroundColor: '#FFF1D9' }, statusBoarded: { color: '#11835D', backgroundColor: '#DDF8ED' }, statusNoShow: { color: '#B63F45', backgroundColor: '#FCE7E5' }, statusReleased: { color: '#5F54A5', backgroundColor: '#EEE9FF' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 11 }, boardedButton: { flex: 1, backgroundColor: colors.green, borderRadius: 9, paddingVertical: 9, alignItems: 'center' }, boardedButtonText: { color: colors.white, fontSize: 10, fontWeight: '800' }, noShowButton: { width: 90, borderWidth: 1, borderColor: '#E7A6A5', borderRadius: 9, paddingVertical: 8, alignItems: 'center' }, noShowButtonText: { color: '#B63F45', fontSize: 10, fontWeight: '700' }, releaseButton: { marginTop: 10, backgroundColor: '#EEE9FF', borderRadius: 9, paddingVertical: 9, alignItems: 'center' }, releaseText: { color: '#5F54A5', fontSize: 10, fontWeight: '800' },
  issueButton: { minHeight: 51, marginTop: 6, paddingHorizontal: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: '#EBEEF1', borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, issueIcon: { color: '#D98500', fontSize: 17 }, issueText: { flex: 1, color: '#3F5060', fontSize: 11, fontWeight: '700' }, issueArrow: { color: '#8A97A1', fontSize: 21 }, issueStatus: { textAlign: 'center', color: '#7B8995', fontSize: 10, marginTop: 8 },
});
