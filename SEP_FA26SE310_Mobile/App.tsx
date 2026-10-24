import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { darkPalette } from './src/theme/darkPalette';
import { useAppContext } from './src/context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </AppProvider>
  );
}

function AppShell() {
  const { isDarkMode } = useAppContext();
  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? darkPalette.background : colors.canvas} />
      <AppNavigator />
    </>
  );
}
