import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';

interface Props { title: string }

export function AppHeader({ title }: Props) {
  const { isDarkMode } = useAppContext();
  const palette = isDarkMode ? darkPalette : null;
  return (
    <View style={[styles.container, palette && { backgroundColor: palette.background }]}>
      <View>
        <Text style={[styles.title, palette && { color: palette.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
});
