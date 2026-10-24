import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { useStudentRoutes } from '../hooks/useStudentRoutes';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';

export function PreferredStopSetting() {
  const { profile, isDarkMode, isSigningOut } = useAppContext();
  const [open, setOpen] = useState(false);
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chọn điểm đón ưu tiên" disabled={isSigningOut} onPress={() => setOpen(true)} style={[styles.settingRow, isDarkMode && { borderTopColor: darkPalette.border }]}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, isDarkMode && { color: darkPalette.text }]}>Điểm đón ưu tiên</Text>
        <Text style={[styles.settingValue, isDarkMode && { color: darkPalette.muted }]}>{profile.preferredStop || 'Chọn điểm đón'}</Text>
      </View>
      <Text style={[styles.chevron, isDarkMode && { color: darkPalette.muted }]}>›</Text>
    </TouchableOpacity>
    {open ? <PreferredStopPicker onClose={() => setOpen(false)} /> : null}
  </>;
}

function PreferredStopPicker({ onClose }: { onClose: () => void }) {
  const { isDarkMode, savePreferredStop } = useAppContext();
  const { isDemo, routes, routeId, selectRoute, routesLoading, routesError, stops, stopsLoading, stopsError, retryRoutes, retryStops } = useStudentRoutes();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const selectedStop = stops.find((stop) => stop.stopId === selectedId);
  const canSave = Boolean(selectedStop && !routesLoading && !stopsLoading && !routesError && !stopsError && !saving);
  const close = () => { if (!saving) onClose(); };

  const save = async () => {
    if (!selectedStop || !canSave) return;
    setSaving(true);
    setError('');
    try {
      await savePreferredStop(selectedStop);
      onClose();
      Alert.alert('Đã lưu điểm đón', isDemo ? `${selectedStop.name} · Demo` : selectedStop.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu điểm đón. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  return <Modal visible transparent animationType="slide" onRequestClose={close}>
    <View style={styles.modalRoot}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng chọn điểm đón" disabled={saving} onPress={close} style={styles.scrim} />
      <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom) }, isDarkMode && { backgroundColor: darkPalette.surface }]}>
        <View style={styles.heading}>
          <Text style={[styles.title, isDarkMode && { color: darkPalette.text }]}>Điểm đón ưu tiên</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đóng" disabled={saving} onPress={close} style={styles.closeButton}><Text style={styles.chevron}>×</Text></TouchableOpacity>
        </View>
        {routesLoading || stopsLoading ? <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={[styles.hint, isDarkMode && { color: darkPalette.muted }]}>Đang tải...</Text></View> : null}
        {routesError || stopsError ? <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.errorText}>{routesError || stopsError}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={routesError ? retryRoutes : retryStops} style={styles.retryButton}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity>
        </View> : null}
        {!routesLoading && !routesError && routes.length === 0 ? <Text style={[styles.hint, isDarkMode && { color: darkPalette.muted }]}>Chưa có tuyến xe khả dụng.</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeList} contentContainerStyle={styles.routeListContent}>
          {routes.map((route) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: routeId === route.routeId, disabled: saving }} disabled={saving} key={route.routeId} onPress={() => {
            if (route.routeId !== routeId) { setSelectedId(null); setError(''); selectRoute(route.routeId); }
          }} style={[styles.routeChip, isDarkMode && { borderColor: darkPalette.border }, routeId === route.routeId && styles.routeSelected]}>
            <Text style={[styles.routeText, isDarkMode && { color: darkPalette.text }, routeId === route.routeId && styles.routeSelectedText]}>{route.name}</Text>
          </TouchableOpacity>)}
        </ScrollView>
        <ScrollView style={styles.stopList} keyboardShouldPersistTaps="handled">
          {stops.map((stop) => <TouchableOpacity accessibilityRole="radio" accessibilityState={{ checked: selectedId === stop.stopId, disabled: saving }} disabled={saving} key={stop.stopId} onPress={() => { setSelectedId(stop.stopId); setError(''); }} style={[styles.stopRow, isDarkMode && { borderBottomColor: darkPalette.border }]}>
            <View style={styles.settingCopy}>
              <Text style={[styles.stopName, isDarkMode && { color: darkPalette.text }]}>{stop.name}</Text>
              {stop.address ? <Text style={[styles.stopAddress, isDarkMode && { color: darkPalette.muted }]}>{stop.address}</Text> : null}
            </View>
            <Text style={[styles.radio, selectedId === stop.stopId && styles.radioSelected]}>{selectedId === stop.stopId ? '●' : '○'}</Text>
          </TouchableOpacity>)}
          {routeId !== null && !stopsLoading && !stopsError && stops.length === 0 ? <Text style={[styles.hint, isDarkMode && { color: darkPalette.muted }]}>Tuyến này chưa có điểm dừng.</Text> : null}
        </ScrollView>
        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !canSave, busy: saving }} disabled={!canSave} onPress={() => { void save(); }} style={[styles.saveButton, !canSave && styles.disabled]}>
          {saving ? <ActivityIndicator color={colors.white} /> : null}
          <Text style={styles.saveText}>{saving ? 'Đang lưu…' : 'Lưu điểm đón'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  settingRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line },
  settingCopy: { flex: 1, paddingRight: 10 }, settingTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  settingValue: { color: colors.muted, fontSize: 12, marginTop: 6 }, chevron: { color: '#89949D', fontSize: 26 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,18,25,0.42)' },
  sheet: { maxHeight: '85%', backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.ink, fontSize: 18, fontWeight: '800' }, closeButton: { paddingHorizontal: 10, paddingVertical: 4 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginVertical: 8 }, loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeList: { flexGrow: 0, marginVertical: 10 }, routeListContent: { gap: 8 }, routeChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  routeSelected: { backgroundColor: colors.green, borderColor: colors.green }, routeText: { color: colors.ink, fontSize: 12 }, routeSelectedText: { color: colors.white },
  stopList: { flexGrow: 0, maxHeight: 300 }, stopRow: { minHeight: 64, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  stopName: { color: colors.ink, fontSize: 14, fontWeight: '600' }, stopAddress: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }, radio: { color: '#89949D', fontSize: 24 }, radioSelected: { color: colors.green },
  errorBox: { marginVertical: 8 }, errorText: { color: '#C34C4C', fontSize: 12, lineHeight: 18, marginVertical: 8 }, retryButton: { alignSelf: 'flex-start', paddingVertical: 8 }, retryText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  saveButton: { marginTop: 18, minHeight: 50, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, disabled: { opacity: 0.5 }, saveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
