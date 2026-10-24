import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';

const categories = ['Sự cố phương tiện', 'Vấn đề sức chứa', 'Trễ giờ / tuyến đường', 'Sự cố hành khách', 'Khác'];
const priorities = ['Thấp', 'Bình thường', 'Khẩn cấp'];

interface Props { onBack: () => void; onSubmitReport: (summary: string) => void; lastReport: string }

export function DriverReportScreen({ onBack, onSubmitReport, lastReport }: Props) {
  const { isDarkMode } = useAppContext();
  const palette = isDarkMode ? darkPalette : null;
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState('Bình thường');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submittedAt, setSubmittedAt] = useState('');

  const submit = () => {
    if (!description.trim()) return;
    const summary = `${category} · ${priority}`;
    setSubmittedAt(new Date().toLocaleString('vi-VN'));
    onSubmitReport(summary);
  };

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={[styles.formCard, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.label, palette && { color: palette.text }]}>LOẠI SỰ CỐ <Text style={styles.required}>*</Text></Text>
      <View style={styles.chipGroup}>{categories.map((item) => <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected, palette && { borderColor: palette.border }]}><Text style={[styles.chipText, category === item && styles.chipTextSelected, palette && { color: category === item ? '#fff' : palette.text }]}>{item}</Text></TouchableOpacity>)}</View>
      <Text style={[styles.label, palette && { color: palette.text }]}>MỨC ĐỘ ƯU TIÊN</Text>
      <View style={styles.priorityRow}>{priorities.map((item) => <TouchableOpacity key={item} onPress={() => setPriority(item)} style={[styles.priorityButton, priority === item && (item === 'Khẩn cấp' ? styles.priorityUrgent : styles.priorityActive), palette && { borderColor: palette.border }]}><Text style={[styles.priorityText, priority === item && styles.priorityTextActive]}>{item}</Text></TouchableOpacity>)}</View>
      <Text style={[styles.label, palette && { color: palette.text }]}>VỊ TRÍ / ĐIỂM DỪNG</Text>
      <TextInput value={location} onChangeText={setLocation} placeholder="Nhập vị trí" placeholderTextColor="#98A4AD" style={[styles.input, palette && { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]} />
      <Text style={[styles.label, palette && { color: palette.text }]}>MÔ TẢ CHI TIẾT <Text style={styles.required}>*</Text></Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Mô tả sự cố" placeholderTextColor="#98A4AD" style={[styles.input, styles.multiline, palette && { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]} multiline textAlignVertical="top" maxLength={500} />
      <Text style={styles.counter}>{description.length}/500 ký tự</Text>
      <View style={styles.reportContext}><Text style={styles.contextText}>FB-0624-01 · F-Bus 01 · Demo</Text></View>
      <TouchableOpacity onPress={submit} disabled={!description.trim()} style={[styles.submitButton, !description.trim() && styles.submitDisabled]}><Text style={styles.submitText}>Gửi báo cáo</Text></TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={styles.cancelButton}><Text style={styles.cancelText}>Quay lại</Text></TouchableOpacity>
    </View>
    <View style={[styles.historyCard, palette && { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.historyTitle, palette && { color: palette.text }]}>Báo cáo gần nhất</Text>{lastReport ? <><View style={styles.historyRow}><View style={styles.historyDot}/><View style={{ flex: 1 }}><Text style={[styles.historyCategory, palette && { color: palette.text }]}>{lastReport}</Text><Text style={styles.historyDate}>{submittedAt || 'Vừa gửi · FB-0624-01'}</Text></View><Text style={styles.historyStatus}>Đã lưu</Text></View></> : <Text style={[styles.emptyHistory, palette && { color: palette.muted }]}>Chưa có báo cáo</Text>}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 17, paddingBottom: 32 }, intro: { color: '#798792', fontSize: 11, lineHeight: 17, marginBottom: 13 }, formCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: '#E9EDF0', padding: 15 }, label: { color: '#304457', fontSize: 10, fontWeight: '800', letterSpacing: .35, marginBottom: 9, marginTop: 12 }, required: { color: '#D45353' }, chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8EC', borderRadius: 8, backgroundColor: '#fff' }, chipSelected: { backgroundColor: '#19324A', borderColor: '#19324A' }, chipText: { color: '#61717D', fontSize: 9, fontWeight: '600' }, chipTextSelected: { color: '#fff' }, priorityRow: { flexDirection: 'row', gap: 8 }, priorityButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8EC', borderRadius: 8, paddingVertical: 9 }, priorityActive: { backgroundColor: '#4E8E6E', borderColor: '#4E8E6E' }, priorityUrgent: { backgroundColor: '#C84D4D', borderColor: '#C84D4D' }, priorityText: { color: '#6E7D86', fontSize: 9, fontWeight: '700' }, priorityTextActive: { color: '#fff' }, input: { borderWidth: 1, borderColor: '#DDE5E9', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 10, backgroundColor: '#FBFCFD', fontSize: 11, color: '#304457' }, multiline: { minHeight: 105 }, counter: { textAlign: 'right', color: '#9AA5AB', fontSize: 8, marginTop: 5 }, reportContext: { flexDirection: 'row', gap: 8, backgroundColor: '#F1F6F9', padding: 10, borderRadius: 8, marginTop: 13 }, contextIcon: { color: '#4182A8', fontSize: 14 }, contextText: { flex: 1, color: '#697D89', fontSize: 9, lineHeight: 14 }, submitButton: { marginTop: 15, padding: 13, alignItems: 'center', backgroundColor: '#19324A', borderRadius: 10 }, submitDisabled: { opacity: .45 }, submitText: { color: '#fff', fontSize: 11, fontWeight: '800' }, cancelButton: { alignItems: 'center', padding: 11 }, cancelText: { color: '#75838D', fontSize: 10, fontWeight: '700' }, historyCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#E9EDF0', borderRadius: 15, padding: 14, marginTop: 13 }, historyTitle: { color: '#304457', fontSize: 12, fontWeight: '800' }, emptyHistory: { color: '#89969F', fontSize: 10, marginTop: 10 }, historyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 }, historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E6A449' }, historyCategory: { color: '#3C4C56', fontSize: 10, fontWeight: '700' }, historyDate: { color: '#97A1A8', fontSize: 8, marginTop: 4 }, historyStatus: { color: '#338363', backgroundColor: '#E5F4EB', borderRadius: 10, overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 7, fontSize: 8, fontWeight: '700' },
});
