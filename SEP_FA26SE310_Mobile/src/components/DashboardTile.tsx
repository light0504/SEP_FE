import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';

interface Props {
  title: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
  onPress: () => void;
}

export function DashboardTile({ title, icon, iconColor, iconBackground, onPress }: Props) {
  const { isDarkMode } = useAppContext();
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.tile, isDarkMode && { backgroundColor: darkPalette.surface, borderColor: darkPalette.border }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text style={[styles.title, isDarkMode && { color: darkPalette.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { width: '48%', minHeight: 150, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 17, borderWidth: 1, borderColor: '#EBEEF1', shadowColor: '#14273B', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  iconBox: { width: 72, height: 72, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  icon: { fontSize: 32, fontWeight: '700' },
  title: { color: '#394653', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
