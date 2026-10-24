import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { TabKey } from '../types';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';

interface Props { activeTab: TabKey; onChange: (tab: TabKey) => void; showBookingsBadge: boolean }
const items: { key: TabKey; icon: string; label: string }[] = [
  { key: 'home', icon: '⌂', label: 'Trang chủ' },
  { key: 'bookings', icon: '▤', label: 'Chỗ của tôi' },
  { key: 'profile', icon: '◉', label: 'Cá nhân' },
];

export function BottomTabBar({ activeTab, onChange, showBookingsBadge }: Props) {
  const { isDarkMode } = useAppContext();
  return (
    <View style={[styles.bar, isDarkMode && { backgroundColor: darkPalette.surface, borderTopColor: darkPalette.border }]}>
      {items.map((item) => {
        const active = item.key === activeTab;
        return (
          <TouchableOpacity key={item.key} onPress={() => onChange(item.key)} style={styles.item}>
            <View style={styles.iconWrap}>
              <Text style={[styles.icon, isDarkMode && { color: darkPalette.muted }, active && styles.activeIcon]}>{item.icon}</Text>
              {item.key === 'bookings' && showBookingsBadge ? <View style={styles.badge} /> : null}
            </View>
            <Text style={[styles.label, isDarkMode && { color: darkPalette.muted }, active && styles.activeLabel]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 72, borderTopColor: colors.line, borderTopWidth: 1, backgroundColor: colors.white, flexDirection: 'row', paddingBottom: 7, justifyContent: 'space-around' },
  item: { width: '33.33%', alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWrap: { position: 'relative' },
  icon: { fontSize: 23, color: '#89948D' },
  activeIcon: { color: colors.green },
  label: { color: '#89948D', fontSize: 9, fontWeight: '600' },
  activeLabel: { color: colors.green, fontWeight: '800' },
  badge: { position: 'absolute', top: 1, right: -5, width: 7, height: 7, borderRadius: 4, backgroundColor: '#E9A842' },
});
