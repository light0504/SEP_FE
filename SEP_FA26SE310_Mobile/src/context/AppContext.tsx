import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { mockProfile, mockTrips } from '../data/mockTrips';
import { cancelReservation, checkIn, reserveSeat } from '../services/bookingService';
import { AuthSession, loginWithPassword, logoutCurrentDevice, refreshAuthSession } from '../services/authService';
import { AuthenticatedGet, AuthenticatedPut, createAuthenticatedGet, createAuthenticatedPut, createAuthenticatedPost } from '../services/apiClient';
import { updatePreferredStop } from '../services/studentProfileService';
import type { StudentStop } from '../types/studentRoutes';
import { AppRole, ReservationResult, Trip, UserProfile } from '../types';

interface AppContextValue {
  isAuthenticated: boolean;
  role: AppRole;
  isDarkMode: boolean;
  profile: UserProfile;
  trips: Trip[];
  authSession: AuthSession | null;
  signInDemo: (role: AppRole) => void;
  signInWithPassword: (username: string, password: string) => Promise<void>;
  refreshSession: () => Promise<AuthSession>;
  apiGet: AuthenticatedGet;
  apiPost: AuthenticatedPut;
  apiPut: AuthenticatedPut;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
  toggleDarkMode: () => void;
  updateProfile: (profile: UserProfile) => void;
  savePreferredStop: (stop: StudentStop) => Promise<void>;
  reserve: (tripId: string) => ReservationResult;
  cancel: (tripId: string) => void;
  checkInTrip: (tripId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<AppRole>('student');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);
  const renewalRef = useRef<Promise<AuthSession> | null>(null);
  const signingOutRef = useRef(false);
  const sessionGenerationRef = useRef(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const applySession = useCallback((session: AuthSession, fallbackEmail = '') => {
    const nextRole: AppRole | null = session.roles.includes('DRIVER') ? 'driver'
      : session.roles.includes('BUS_ATTENDANT') ? 'bus-attendant'
      : session.roles.includes('LECTURER') ? 'lecturer'
      : session.roles.includes('STUDENT') ? 'student' : null;
    if (!nextRole) throw new Error('Tài khoản không có quyền sử dụng mobile.');
    setRole(nextRole);
    setProfile((current) => ({
      ...current,
      name: session.fullName || current.name,
      email: session.email || (fallbackEmail.includes('@') ? fallbackEmail.trim() : current.email),
    }));
    sessionRef.current = session;
    setAuthSession(session);
    setIsAuthenticated(true);
  }, []);

  const refreshSession = useCallback((): Promise<AuthSession> => {
    if (signingOutRef.current) return Promise.reject(new Error('Đang đăng xuất. Vui lòng chờ.'));
    const current = sessionRef.current;
    if (!current?.refreshToken) return Promise.reject(new Error('Không tìm thấy refresh token. Vui lòng đăng nhập lại.'));
    if (renewalRef.current) return renewalRef.current;
    const renewal = refreshAuthSession(current.refreshToken).then((session) => {
      if (sessionRef.current !== current) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.');
      const merged = { ...session, fullName: session.fullName || current.fullName, email: session.email || current.email };
      applySession(merged);
      return merged;
    }).finally(() => {
      if (renewalRef.current === renewal) renewalRef.current = null;
    });
    renewalRef.current = renewal;
    return renewal;
  }, [applySession]);

  const apiGet = useMemo(() => createAuthenticatedGet(() => sessionRef.current, refreshSession), [refreshSession]);
  const apiPut = useMemo(() => createAuthenticatedPut(() => sessionRef.current, refreshSession), [refreshSession]);
  const apiPost = useMemo(() => createAuthenticatedPost(() => sessionRef.current, refreshSession), [refreshSession]);

  const savePreferredStop = useCallback(async (stop: StudentStop): Promise<void> => {
    if (signingOutRef.current) throw new Error('Đang đăng xuất. Vui lòng chờ.');
    const generation = sessionGenerationRef.current;
    if (sessionRef.current) await updatePreferredStop(apiPut, stop.stopId);
    if (generation !== sessionGenerationRef.current || signingOutRef.current) throw new Error('Phiên đăng nhập đã thay đổi.');
    setProfile((current) => ({ ...current, preferredStop: stop.name, preferredStopId: stop.stopId }));
  }, [apiPut]);

  const signOut = useCallback(async (): Promise<void> => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    sessionGenerationRef.current += 1;
    setIsSigningOut(true);
    let warning = '';
    try {
      const pending = renewalRef.current;
      if (pending) await pending.catch(() => undefined);
      const session = sessionRef.current;
      sessionRef.current = null;
      renewalRef.current = null;
      if (session) await logoutCurrentDevice(session);
    } catch {
      warning = 'Đã thoát trên thiết bị. Máy chủ chưa xác nhận đăng xuất.';
    } finally {
      sessionRef.current = null;
      renewalRef.current = null;
      setAuthSession(null);
      setIsAuthenticated(false);
      setProfile(mockProfile);
      setTrips(mockTrips);
      setRole('student');
      signingOutRef.current = false;
      setIsSigningOut(false);
    }
    if (warning) Alert.alert('Thông báo đăng xuất', warning);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    isAuthenticated,
    role,
    isDarkMode,
    profile,
    trips,
    authSession,
    isSigningOut,
    signInDemo: (nextRole) => { sessionGenerationRef.current += 1; sessionRef.current = null; renewalRef.current = null; setAuthSession(null); setRole(nextRole); setIsAuthenticated(true); },
    signInWithPassword: async (username, password) => {
      const session = await loginWithPassword(username, password);
      sessionGenerationRef.current += 1;
      setProfile((current) => ({ ...current, preferredStop: '', preferredStopId: undefined }));
      applySession(session, username);
    },
    refreshSession,
    apiGet,
    apiPost,
    apiPut,
    signOut,
    toggleDarkMode: () => setIsDarkMode((current) => !current),
    updateProfile: setProfile,
    savePreferredStop,
    reserve: (tripId) => {
      const update = reserveSeat(trips, tripId);
      setTrips(update.trips);
      return update.result;
    },
    cancel: (tripId) => setTrips((current) => cancelReservation(current, tripId)),
    checkInTrip: (tripId) => setTrips((current) => checkIn(current, tripId)),
  }), [apiGet, apiPost, apiPut, applySession, authSession, isAuthenticated, isDarkMode, isSigningOut, profile, refreshSession, role, savePreferredStop, signOut, trips]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside AppProvider');
  return context;
}
