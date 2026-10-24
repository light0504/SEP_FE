import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';

interface Props { title: string; onPress: () => void; secondary?: boolean }

export function PrimaryButton({ title, onPress, secondary = false }: Props) {
  const { isDarkMode } = useAppContext();
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.button, secondary && styles.secondary, isDarkMode && secondary && { backgroundColor: darkPalette.accentSoft }]}>
      <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.green, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 17, alignItems: 'center' },
  secondary: { backgroundColor: colors.pale },
  text: { color: colors.white, fontSize: 12, fontWeight: '800' },
  secondaryText: { color: colors.green },
});
