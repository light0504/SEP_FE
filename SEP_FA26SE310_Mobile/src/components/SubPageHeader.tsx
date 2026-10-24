import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { useAppContext } from '../context/AppContext';

interface Props { title: string; onBack: () => void }

export function SubPageHeader({ title, onBack }: Props) {
  const { isDarkMode } = useAppContext();
  return (
    <View style={[styles.header, isDarkMode && { backgroundColor: darkPalette.surface, borderBottomColor: darkPalette.border }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backIcon, isDarkMode && { color: darkPalette.text }]}>‹</Text>
      </TouchableOpacity>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, isDarkMode && { color: darkPalette.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line },
  backButton: { width: 40, height: 48, justifyContent: 'center' }, backIcon: { color: colors.ink, fontSize: 36, lineHeight: 40 },
  titleBlock: { marginLeft: 8 }, title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
});
