import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from '../components/BottomTabBar';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { TabKey } from '../types';
import { BookingsScreen } from '../screens/BookingsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TripSearchScreen } from '../screens/TripSearchScreen';
import { DriverHomeScreen } from '../screens/DriverHomeScreen';
import { CrewHomeScreen } from '../screens/CrewHomeScreen';
import { PasswordLoginScreen } from '../screens/PasswordLoginScreen';

type AppRoute = TabKey | 'trip-search' | 'notifications';
type LoginRoute = 'methods' | 'password';

export function AppNavigator() {
  const { isAuthenticated, signInDemo, signInWithPassword, trips, isDarkMode, role, authSession } = useAppContext();
  const [route, setRoute] = useState<AppRoute>('home');
  const [loginRoute, setLoginRoute] = useState<LoginRoute>('methods');

  if (!isAuthenticated) return (
    <SafeAreaView style={styles.safe}>
      {loginRoute === 'methods'
        ? <LoginScreen onSignIn={(nextRole) => { signInDemo(nextRole); setRoute('home'); }} onPasswordLogin={() => setLoginRoute('password')} />
        : <PasswordLoginScreen onBack={() => setLoginRoute('methods')} onSubmit={async (username, password) => { await signInWithPassword(username, password); setRoute('home'); }} />}
    </SafeAreaView>
  );

  if (authSession && (role === 'driver' || role === 'bus-attendant')) {
    return <SafeAreaView style={[styles.safe, isDarkMode && { backgroundColor: darkPalette.background }]}><CrewHomeScreen /></SafeAreaView>;
  }
  if (role === 'driver') {
    return <SafeAreaView style={[styles.safe, isDarkMode && { backgroundColor: darkPalette.background }]}><DriverHomeScreen /></SafeAreaView>;
  }

  const hasBookings = trips.some((trip) => trip.status !== undefined);
  const tabRoute = route === 'trip-search' || route === 'notifications' ? 'home' : route;
  return (
    <SafeAreaView style={[styles.safe, isDarkMode && { backgroundColor: darkPalette.background }]}>
      {route === 'home' ? <HomeScreen onOpenBookings={() => setRoute('bookings')} onOpenProfile={() => setRoute('profile')} onOpenTripSearch={() => setRoute('trip-search')} onOpenNotifications={() => setRoute('notifications')} /> : null}
      {route === 'bookings' ? <BookingsScreen onFindTrips={() => setRoute('trip-search')} /> : null}
      {route === 'profile' ? <ProfileScreen /> : null}
      {route === 'trip-search' ? <TripSearchScreen onBack={() => setRoute('home')} /> : null}
      {route === 'notifications' ? <NotificationsScreen onBack={() => setRoute('home')} /> : null}
      {route !== 'trip-search' && route !== 'notifications' ? <BottomTabBar activeTab={tabRoute} onChange={setRoute} showBookingsBadge={hasBookings} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas } });
