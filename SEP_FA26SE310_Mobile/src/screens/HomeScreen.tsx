import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardTile } from '../components/DashboardTile';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';

interface Props {
  onOpenBookings: () => void;
  onOpenProfile: () => void;
  onOpenTripSearch: () => void;
  onOpenNotifications: () => void;
}

export function HomeScreen({ onOpenBookings, onOpenProfile, onOpenTripSearch, onOpenNotifications }: Props) {
  const { profile, trips, isDarkMode, authSession, role } = useAppContext();
  const waitlistedCount = trips.filter((trip) => trip.status === 'waitlist').length;
  const firstName = profile.name.trim().split(/\s+/).slice(-2).join(' ') || 'Sinh viên';

  const openWaitlist = () => {
    if (authSession) { Alert.alert('Danh sách chờ chưa khả dụng'); return; }
    if (waitlistedCount > 0) onOpenBookings();
    else Alert.alert('Danh sách chờ', 'Bạn chưa tham gia danh sách chờ chuyến nào.');
  };

  return (
    <View style={[styles.screen, isDarkMode && { backgroundColor: darkPalette.background }]}>
      <View style={styles.profileHeader}>
        <View style={styles.headerIdentity}>
          <Image source={require('../assets/logo.png')} style={styles.avatar} resizeMode="contain" accessibilityLabel="FPT University logo" />
          <View style={styles.nameBlock}>
            <Text numberOfLines={1} style={styles.name}>{profile.name}</Text>
            <Text style={styles.school}>FPT University · {role === 'lecturer' ? 'Giảng viên' : 'Sinh viên'}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Thông báo" onPress={onOpenNotifications} style={styles.notificationButton}>
          <Text style={styles.bell}>🔔</Text>
          {waitlistedCount > 0 ? <View style={styles.notificationDot} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.greeting, isDarkMode && { color: darkPalette.text }]}>Xin chào, {firstName}</Text>

        <SectionHeading title="ĐẶT VÀ QUẢN LÝ CHỖ" />
        <View style={styles.tileGrid}>
          <DashboardTile title="Tìm chuyến xe" icon="⌕" iconColor="#1976B9" iconBackground="#E4F2FB" onPress={onOpenTripSearch} />
          <DashboardTile title="Chỗ của tôi" icon="▣" iconColor="#E69600" iconBackground="#FFF1D9" onPress={onOpenBookings} />
          <DashboardTile title="Danh sách chờ" icon="◷" iconColor="#7955D9" iconBackground="#EEE9FF" onPress={openWaitlist} />
          <DashboardTile title="Lịch sử" icon="✓" iconColor="#12A87B" iconBackground="#DDF8ED" onPress={onOpenBookings} />
        </View>

        <SectionHeading title="TÀI KHOẢN" />
        <View style={styles.tileGrid}>
          <DashboardTile title="Hồ sơ cá nhân" icon="◉" iconColor="#D95A5A" iconBackground="#FCE7E5" onPress={onOpenProfile} />
          <DashboardTile title="Thông báo" icon="🔔" iconColor="#E69600" iconBackground="#FFF1D9" onPress={onOpenNotifications} />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeading({ title }: { title: string }) {
  const { isDarkMode } = useAppContext();
  return <View style={styles.sectionHeading}><View style={styles.sectionMarker} /><Text style={[styles.sectionTitle, isDarkMode && { color: darkPalette.text }]}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F4F8' },
  profileHeader: { minHeight: 90, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12, backgroundColor: '#19324A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.white },
  nameBlock: { flex: 1 }, name: { color: colors.white, fontSize: 17, fontWeight: '800' }, school: { color: '#B9C7D4', fontSize: 11, marginTop: 3 },
  notificationButton: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  bell: { color: colors.white, fontSize: 24 }, notificationDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#F2A900', top: 9, right: 6, borderWidth: 1, borderColor: '#19324A' },
  content: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 28 },
  greeting: { color: '#19324A', fontSize: 21, fontWeight: '800', marginBottom: 20 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 13, gap: 9 }, sectionMarker: { width: 5, height: 25, backgroundColor: '#E99A0C', borderRadius: 3 }, sectionTitle: { color: '#24384B', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13, marginBottom: 19 },
});
