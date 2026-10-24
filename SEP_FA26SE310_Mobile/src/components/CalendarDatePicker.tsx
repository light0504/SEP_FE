import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { formatCalendarDate, getCalendarCells, isBookableDate, shiftCalendarMonth } from '../utils/calendarDate';

interface Props {
  visible: boolean;
  value: string;
  minimumDate: string;
  isDarkMode: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function CalendarDatePicker({ visible, value, minimumDate, isDarkMode, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(minimumDate.slice(0, 7));
  useEffect(() => {
    if (visible) setMonth((isBookableDate(value, minimumDate) ? value : minimumDate).slice(0, 7));
  }, [visible, value, minimumDate]);

  if (!visible) return null;
  const displayMonth = month < minimumDate.slice(0, 7) ? minimumDate.slice(0, 7) : month;
  const canGoBack = displayMonth > minimumDate.slice(0, 7);
  const cells = getCalendarCells(displayMonth, minimumDate);
  const [year, monthNumber] = displayMonth.split('-');
  const textColor = isDarkMode ? darkPalette.text : colors.ink;
  const mutedColor = isDarkMode ? darkPalette.muted : colors.muted;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng lịch" onPress={onClose} style={styles.scrim} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom), backgroundColor: isDarkMode ? darkPalette.surface : colors.white }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: textColor }]}>Chọn ngày</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đóng lịch" onPress={onClose} style={styles.iconButton}>
              <Text style={[styles.icon, { color: mutedColor }]}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.monthRow}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tháng trước" accessibilityState={{ disabled: !canGoBack }} disabled={!canGoBack} onPress={() => setMonth(shiftCalendarMonth(displayMonth, -1))} style={[styles.iconButton, !canGoBack && styles.disabled]}>
                <Text style={[styles.icon, { color: textColor }]}>‹</Text>
              </TouchableOpacity>
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.month, { color: textColor }]}>Tháng {Number(monthNumber)}, {year}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tháng sau" onPress={() => setMonth(shiftCalendarMonth(displayMonth, 1))} style={styles.iconButton}>
                <Text style={[styles.icon, { color: textColor }]}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {weekdays.map((day) => <View key={day} style={styles.cell}><Text style={[styles.weekday, { color: mutedColor }]}>{day}</Text></View>)}
              {cells.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} accessible={false} pointerEvents="none" style={styles.cell} />;
                const selected = date === value;
                const isToday = date === minimumDate;
                return <View key={date} style={styles.cell}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${formatCalendarDate(date)}${isToday ? ', hôm nay' : ''}`}
                    accessibilityState={{ selected }}
                    onPress={() => { if (isBookableDate(date)) onSelect(date); }}
                    style={[styles.day, isToday && styles.today, selected && styles.selected]}
                  >
                    <Text style={[styles.dayText, { color: selected ? colors.white : textColor }]}>{Number(date.slice(8))}</Text>
                  </TouchableOpacity>
                </View>;
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 18, 25, 0.42)' },
  sheet: { maxHeight: '90%', width: '100%', maxWidth: 480, alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 },
  title: { fontSize: 17, fontWeight: '800' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 29 }, disabled: { opacity: 0.25 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  month: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285714%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: 12, fontWeight: '700' },
  day: { width: '100%', maxWidth: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15, fontWeight: '600' },
  today: { borderWidth: 1, borderColor: colors.green },
  selected: { backgroundColor: colors.green },
});
