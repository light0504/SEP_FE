import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SubPageHeader } from '../components/SubPageHeader';
import { TripCard } from '../components/TripCard';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { darkPalette } from '../theme/darkPalette';
import { useStudentRoutes } from '../hooks/useStudentRoutes';
import { CalendarDatePicker } from '../components/CalendarDatePicker';
import { useTodayDate } from '../hooks/useTodayDate';
import { formatCalendarDate, isBookableDate } from '../utils/calendarDate';
import { searchStudentTrips } from '../services/studentTripService';
import type { StudentTrip } from '../types/studentTrips';
import { SeatBookingScreen } from './SeatBookingScreen';

type PickerType = 'route' | 'origin' | 'destination' | 'date' | 'slot';
interface PickerOption { value: string; label: string; description?: string }

interface Props { onBack: () => void }

export function TripSearchScreen({ onBack }: Props) {
  const { trips, reserve, isDarkMode, apiGet } = useAppContext();
  const {
    isDemo, routes, routeId, selectRoute, routesLoading, routesError,
    stops, stopsLoading, stopsError, retryRoutes, retryStops,
  } = useStudentRoutes();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [slot, setSlot] = useState('');
  const [picker, setPicker] = useState<PickerType | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const searchController = useRef<AbortController | null>(null);
  const [liveTrips, setLiveTrips] = useState<StudentTrip[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [bookingTrip, setBookingTrip] = useState<StudentTrip | null>(null);
  const today = useTodayDate();

  const selectedRoute = routes.find((route) => route.routeId === routeId);
  const originStop = stops.find((stop) => String(stop.stopId) === origin);
  const destinationStop = stops.find((stop) => String(stop.stopId) === destination);
  const slots = ['1', '2', '3', '4', '5', '6'];
  const validDirection = isDemo || stops.findIndex(stop => String(stop.stopId) === destination) > stops.findIndex(stop => String(stop.stopId) === origin);
  const requiredComplete = Boolean(selectedRoute && originStop && destinationStop && isBookableDate(travelDate, today) && origin !== destination && validDirection
    && !routesLoading && !stopsLoading && !routesError && !stopsError);
  const results = useMemo(() => hasSearched && isDemo ? trips.filter((trip) => trip.from === originStop?.name
    && trip.to === destinationStop?.name
    && trip.date === travelDate
    && (!slot || trip.slot === Number(slot))) : [], [destinationStop?.name, hasSearched, isDemo, originStop?.name, slot, travelDate, trips]);

  useEffect(() => {
    setOrigin('');
    setDestination('');
    setHasSearched(false);
    setIsSearchCollapsed(false);
  }, [routeId]);

  useEffect(() => {
    searchController.current?.abort();
    setSearchLoading(false); setLiveTrips([]); setSearchError('');
    return () => searchController.current?.abort();
  }, [routeId, origin, destination, travelDate, slot]);

  useEffect(() => {
    if (travelDate && !isBookableDate(travelDate, today)) {
      setTravelDate('');
      setHasSearched(false);
      setIsSearchCollapsed(false);
    }
  }, [today, travelDate]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [isSearchCollapsed]);

  const pickerTitle = picker === 'route' ? 'Chọn tuyến xe'
    : picker === 'origin' ? 'Chọn điểm xuất phát'
    : picker === 'destination' ? 'Chọn điểm đến'
      : 'Chọn slot';
  const stopOptions = stops.map((stop) => ({ value: String(stop.stopId), label: stop.name, description: stop.address }));
  const pickerOptions: PickerOption[] = picker === 'route' ? routes.map((route) => ({ value: String(route.routeId), label: route.name, description: route.routeCode }))
    : picker === 'origin' ? (isDemo ? stopOptions : stopOptions.slice(0, -1))
    : picker === 'destination' ? stopOptions.filter((stop, index) => stop.value !== origin && (isDemo || index > stops.findIndex(point => String(point.stopId) === origin)))
      : slots.map((value) => ({ value, label: `Slot ${value}` }));
  const selectedValue = picker === 'route' ? (routeId === null ? '' : String(routeId))
    : picker === 'origin' ? origin
    : picker === 'destination' ? destination
      : slot;

  const handleSelect = (value: string) => {
    if (picker === 'route') {
      selectRoute(Number(value));
      if (Number(value) !== routeId) { setOrigin(''); setDestination(''); }
    }
    if (picker === 'origin') {
      setOrigin(value);
      if (value === destination || (!isDemo && stops.findIndex(stop => String(stop.stopId) === value) >= stops.findIndex(stop => String(stop.stopId) === destination))) setDestination('');
    }
    if (picker === 'destination') setDestination(value);
    if (picker === 'date') {
      if (!isBookableDate(value)) return;
      setTravelDate(value);
    }
    if (picker === 'slot') setSlot(value);
    setHasSearched(false);
    setPicker(null);
  };

  const handleSearch = async () => {
    if (travelDate && !isBookableDate(travelDate)) {
      setTravelDate('');
      setHasSearched(false);
      setIsSearchCollapsed(false);
      Alert.alert('Chọn lại ngày', 'Ngày khởi hành phải từ hôm nay trở đi.');
      return;
    }
    if (!requiredComplete) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn điểm xuất phát, điểm đến và ngày khởi hành.');
      return;
    }
    setHasSearched(true);
    setIsSearchCollapsed(true);
    if (isDemo || !originStop || !destinationStop || !selectedRoute) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setSearchLoading(true); setSearchError(''); setLiveTrips([]);
    try {
      const found = await searchStudentTrips(apiGet, { date: travelDate, routeId: selectedRoute.routeId,
        boardingStopId: originStop.stopId, alightingStopId: destinationStop.stopId, ...(slot ? { slot: Number(slot) } : {}) }, controller.signal);
      if (!controller.signal.aborted) setLiveTrips(found);
    } catch (reason) {
      if (!controller.signal.aborted) setSearchError(reason instanceof Error ? reason.message : 'Không thể tìm chuyến.');
    } finally {
      if (!controller.signal.aborted) setSearchLoading(false);
    }
  };

  const boarding = bookingTrip?.stops.find(stop => stop.stopId === originStop?.stopId);
  const alighting = bookingTrip?.stops.find(stop => stop.stopId === destinationStop?.stopId);
  if (bookingTrip && boarding && alighting) return <SeatBookingScreen trip={bookingTrip} boarding={boarding} alighting={alighting}
    onBack={() => setBookingTrip(null)} onBooked={() => { setBookingTrip(null); void handleSearch(); }} />;

  const handleReserve = (tripId: string) => {
    const result = reserve(tripId);
    if (result === 'booked') Alert.alert('Đặt chỗ thành công');
    else if (result === 'waitlist') Alert.alert('Đã vào danh sách chờ');
    else if (result === 'already-reserved') Alert.alert('Bạn đã đăng ký chuyến này');
  };

  return (
    <View style={[styles.screen, isDarkMode && { backgroundColor: darkPalette.background }]}>
      <SubPageHeader title="Tìm chuyến xe" onBack={onBack} />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={isSearchCollapsed ? [0] : undefined} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.searchPanel, isSearchCollapsed && styles.stickyPanel, isDarkMode && { backgroundColor: darkPalette.background, borderBottomColor: darkPalette.border }]}>
          {isSearchCollapsed ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Sửa tìm kiếm: ${originStop?.name} đến ${destinationStop?.name}, ${formatCalendarDate(travelDate)}, ${slot ? `slot ${slot}` : 'tất cả slot'}`}
              accessibilityState={{ expanded: false }}
              onPress={() => setIsSearchCollapsed(false)}
              style={styles.searchSummary}
            >
              <View style={styles.summaryCopy}>
                <Text numberOfLines={1} style={[styles.summaryRoute, isDarkMode && { color: darkPalette.text }]}>{originStop?.name} → {destinationStop?.name}</Text>
                <Text style={[styles.summaryDate, isDarkMode && { color: darkPalette.muted }]}>{formatCalendarDate(travelDate)} · {slot ? `Slot ${slot}` : 'Tất cả slot'}{isDemo ? ' · Demo' : ''}</Text>
              </View>
              <Text style={[styles.editSearch, isDarkMode && { color: darkPalette.text }]}>Sửa</Text>
            </TouchableOpacity>
          ) : <>
            {isDemo ? <Text style={[styles.infoNote, isDarkMode && { color: darkPalette.muted }]}>Demo</Text> : null}
            <SelectField label="Tuyến xe" required value={selectedRoute?.name || ''} placeholder={routesLoading ? 'Đang tải tuyến xe...' : 'Chọn tuyến xe'} disabled={routesLoading || routes.length === 0} isDarkMode={isDarkMode} onPress={() => setPicker('route')} />
            {routesLoading ? <View style={styles.loadingRow}><ActivityIndicator color={colors.green} /><Text style={[styles.loadingText, isDarkMode && { color: darkPalette.muted }]}>Đang tải tuyến xe...</Text></View> : null}
            {routesError ? <LoadError message={routesError} onRetry={retryRoutes} isDarkMode={isDarkMode} /> : null}
            {!routesLoading && !routesError && routes.length === 0 ? <Text style={[styles.infoNote, isDarkMode && { color: darkPalette.muted }]}>Hiện chưa có tuyến xe khả dụng.</Text> : null}
            <SelectField label="Điểm xuất phát" required value={originStop?.name || ''} placeholder={stopsLoading ? 'Đang tải điểm dừng...' : 'Chọn điểm xuất phát'} disabled={stopsLoading || stops.length === 0} isDarkMode={isDarkMode} onPress={() => setPicker('origin')} />
            <SelectField label="Điểm đến" required value={destinationStop?.name || ''} placeholder="Chọn điểm đến" disabled={stopsLoading || !originStop || stops.length < 2} isDarkMode={isDarkMode} onPress={() => setPicker('destination')} />
            {stopsLoading ? <View style={styles.loadingRow}><ActivityIndicator color={colors.green} /><Text style={[styles.loadingText, isDarkMode && { color: darkPalette.muted }]}>Đang tải điểm dừng...</Text></View> : null}
            {stopsError ? <LoadError message={stopsError} onRetry={retryStops} isDarkMode={isDarkMode} /> : null}
            {selectedRoute && !stopsLoading && !stopsError && stops.length < 2 ? <Text style={[styles.infoNote, isDarkMode && { color: darkPalette.muted }]}>Tuyến này chưa có đủ hai điểm dừng để chọn hành trình.</Text> : null}
            <SelectField label="Ngày" required value={formatCalendarDate(travelDate)} placeholder="Chọn ngày khởi hành" isDarkMode={isDarkMode} onPress={() => setPicker('date')} />
            <SelectField label="Slot" value={slot ? `Slot ${slot}` : ''} placeholder="Tất cả slot" isDarkMode={isDarkMode} onPress={() => setPicker('slot')} onClear={slot ? () => { setSlot(''); setHasSearched(false); } : undefined} />

            <TouchableOpacity accessibilityRole="button" disabled={!requiredComplete || searchLoading} onPress={() => { void handleSearch(); }} style={[styles.searchButton, (!requiredComplete || searchLoading) && styles.searchButtonDisabled]}>
              <Text style={styles.searchButtonText}>Tìm chuyến</Text>
            </TouchableOpacity>
            <Text style={[styles.requiredNote, isDarkMode && { color: darkPalette.muted }]}>* Bắt buộc</Text>
          </>}
        </View>

        <View style={styles.resultsContent}>
          {hasSearched && !isDemo ? searchLoading ? <View style={[styles.emptyState, isDarkMode && { backgroundColor: darkPalette.surface }]}><ActivityIndicator color={colors.green} /><Text style={[styles.emptyText, isDarkMode && { color: darkPalette.muted }]}>Đang tìm chuyến…</Text></View>
            : searchError ? <LoadError message={searchError} onRetry={() => { void handleSearch(); }} isDarkMode={isDarkMode} />
            : <View style={styles.results}>
              <View style={styles.resultsHeading}><Text style={[styles.resultsTitle, isDarkMode && { color: darkPalette.text }]}>Chuyến xe</Text><Text style={[styles.resultsCount, isDarkMode && { color: darkPalette.muted }]}>{liveTrips.length} chuyến</Text></View>
              {liveTrips.map(trip => {
                const start = trip.stops.find(stop => stop.stopId === originStop?.stopId);
                const end = trip.stops.find(stop => stop.stopId === destinationStop?.stopId);
                if (!start || !end) return null;
                return <TripCard key={trip.tripId} trip={{ id: String(trip.tripId), from: start.name, to: end.name,
                  date: start.arrivalAt.slice(0, 10), time: start.arrivalAt.slice(11, 16), arrival: end.arrivalAt.slice(11, 16),
                  slot: trip.slot, bus: trip.vehicle, seats: trip.availableSeats, totalSeats: trip.capacity }}
                  action={() => setBookingTrip(trip)} actionLabel={trip.availableSeats ? 'Chọn ghế' : 'Hết ghế'} actionDisabled={trip.availableSeats === 0} />;
              })}
              {!liveTrips.length ? <View style={[styles.emptyState, isDarkMode && { backgroundColor: darkPalette.surface }]}><Text style={[styles.emptyTitle, isDarkMode && { color: darkPalette.text }]}>Không tìm thấy chuyến phù hợp</Text></View> : null}
            </View> : null}
          {hasSearched && isDemo ? (
            <View style={styles.results}>
              <View style={styles.resultsHeading}><Text style={[styles.resultsTitle, isDarkMode && { color: darkPalette.text }]}>Kết quả chuyến xe</Text><Text style={[styles.resultsCount, isDarkMode && { color: darkPalette.muted }]}>{results.length} chuyến</Text></View>
              {results.map((trip) => <TripCard key={trip.id} trip={trip} action={() => handleReserve(trip.id)} />)}
              {results.length === 0 ? <View style={[styles.emptyState, isDarkMode && { backgroundColor: darkPalette.surface }]}><Text style={styles.emptyIcon}>⌕</Text><Text style={[styles.emptyTitle, isDarkMode && { color: darkPalette.text }]}>Không tìm thấy chuyến phù hợp</Text></View> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <OptionPicker
        visible={picker !== null && picker !== 'date'}
        title={pickerTitle}
        options={pickerOptions}
        selectedValue={selectedValue}
        isDarkMode={isDarkMode}
        onClose={() => setPicker(null)}
        onSelect={handleSelect}
        emptyMessage="Không có lựa chọn phù hợp."
      />
      <CalendarDatePicker
        visible={picker === 'date'}
        value={travelDate}
        minimumDate={today}
        isDarkMode={isDarkMode}
        onClose={() => setPicker(null)}
        onSelect={handleSelect}
      />
    </View>
  );
}

function LoadError({ message, onRetry, isDarkMode }: { message: string; onRetry: () => void; isDarkMode: boolean }) {
  return <View accessibilityRole="alert" style={[styles.errorBox, isDarkMode && { backgroundColor: darkPalette.surface }]}>
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity>
  </View>;
}

function SelectField({ label, value, placeholder, required = false, disabled = false, isDarkMode, onPress, onClear }: {
  label: string; value: string; placeholder: string; required?: boolean; disabled?: boolean; isDarkMode: boolean; onPress: () => void; onClear?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, isDarkMode && { color: darkPalette.muted }]}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>
      <View style={[styles.fieldControl, disabled && styles.fieldDisabled, isDarkMode && { backgroundColor: darkPalette.input, borderColor: darkPalette.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={styles.fieldButton}>
          <Text style={[styles.fieldValue, !value && styles.placeholder, isDarkMode && { color: value ? darkPalette.text : darkPalette.muted }]}>{value || placeholder}</Text>
          <Text style={[styles.chevron, isDarkMode && { color: darkPalette.muted }]}>⌄</Text>
        </TouchableOpacity>
        {onClear ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Hủy chọn slot" onPress={onClear} style={styles.clearButton}><Text style={styles.clearText}>×</Text></TouchableOpacity> : null}
      </View>
    </View>
  );
}

function OptionPicker({ visible, title, options, selectedValue, isDarkMode, onClose, onSelect, emptyMessage }: {
  visible: boolean; title: string; options: PickerOption[]; selectedValue: string; isDarkMode: boolean; onClose: () => void; onSelect: (value: string) => void; emptyMessage: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.scrim} />
        <View style={[styles.pickerSheet, isDarkMode && { backgroundColor: darkPalette.surface }]}>
          <View style={styles.pickerHeader}><Text style={[styles.pickerTitle, isDarkMode && { color: darkPalette.text }]}>{title}</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeText}>×</Text></TouchableOpacity></View>
          <ScrollView style={styles.optionList} keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const selected = selectedValue === option.value;
              return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }} key={option.value} onPress={() => onSelect(option.value)} style={[styles.option, isDarkMode && { borderBottomColor: darkPalette.border }]}>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionText, isDarkMode && { color: darkPalette.text }, selected && styles.optionSelected]}>{option.label}</Text>
                  {option.description ? <Text style={[styles.optionDescription, isDarkMode && { color: darkPalette.muted }]}>{option.description}</Text> : null}
                </View>
                {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
              </TouchableOpacity>;
            })}
            {options.length === 0 ? <Text style={[styles.infoNote, isDarkMode && { color: darkPalette.muted }]}>{emptyMessage}</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F4F8' }, scroll: { flex: 1 }, content: { paddingBottom: 30 },
  searchPanel: { paddingHorizontal: 20, paddingTop: 18, backgroundColor: '#F2F4F8' },
  stickyPanel: { paddingTop: 0, borderBottomWidth: 1, borderBottomColor: '#DDE3E8', zIndex: 1 },
  searchSummary: { minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryCopy: { flex: 1, minWidth: 0 }, summaryRoute: { color: '#263A4D', fontSize: 14, fontWeight: '700' },
  summaryDate: { color: '#788692', fontSize: 12, marginTop: 5 }, editSearch: { color: colors.green, fontSize: 13, fontWeight: '700' },
  resultsContent: { paddingHorizontal: 20, paddingTop: 12 },
  infoNote: { color: '#788692', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }, loadingText: { color: '#788692', fontSize: 12 },
  errorBox: { backgroundColor: '#FFF1F0', borderRadius: 12, padding: 12, marginBottom: 14 }, errorText: { color: '#D95A5A', fontSize: 12, lineHeight: 18 }, retryButton: { paddingVertical: 10, alignSelf: 'flex-start' }, retryText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  fieldDisabled: { opacity: 0.5 }, optionContent: { flex: 1, paddingVertical: 12, paddingRight: 12 }, optionDescription: { color: '#788692', fontSize: 11, lineHeight: 16, marginTop: 4 },
  field: { marginBottom: 14 }, fieldLabel: { color: '#475764', fontSize: 12, fontWeight: '700', marginBottom: 7 }, required: { color: '#D95A5A' },
  fieldControl: { height: 54, borderWidth: 1, borderColor: '#DDE3E8', backgroundColor: colors.white, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  fieldButton: { flex: 1, height: '100%', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldValue: { color: '#263A4D', fontSize: 14, flex: 1 }, placeholder: { color: '#98A3AC' }, chevron: { color: '#687783', fontSize: 20, marginLeft: 10 }, clearButton: { width: 36, alignItems: 'center', justifyContent: 'center' }, clearText: { color: '#98A3AC', fontSize: 23 },
  searchButton: { height: 53, borderRadius: 14, marginTop: 8, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }, searchButtonDisabled: { opacity: 0.45 }, searchButtonText: { color: colors.white, fontSize: 14, fontWeight: '800', letterSpacing: 1.2 }, requiredNote: { color: '#96A0A8', fontSize: 10, marginTop: 8, marginBottom: 12 },
  results: { marginTop: 12 }, resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, resultsTitle: { color: '#263A4D', fontSize: 16, fontWeight: '800' }, resultsCount: { color: '#82909B', fontSize: 11 },
  emptyState: { minHeight: 190, backgroundColor: colors.white, borderRadius: 18, padding: 22, alignItems: 'center', justifyContent: 'center' }, emptyIcon: { color: '#8BA2B2', fontSize: 34, marginBottom: 8 }, emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' }, emptyText: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 7 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 18, 25, 0.42)' }, pickerSheet: { maxHeight: '72%', backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 19, paddingBottom: 24 }, pickerHeader: { paddingHorizontal: 21, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pickerTitle: { color: '#263A4D', fontSize: 16, fontWeight: '800' }, closeText: { color: '#89949D', fontSize: 27 }, optionList: { paddingHorizontal: 20 }, option: { minHeight: 51, borderBottomWidth: 1, borderBottomColor: '#EEF1F3', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionText: { color: '#394A58', fontSize: 14 }, optionSelected: { color: colors.green, fontWeight: '800' }, optionCheck: { color: colors.green, fontSize: 16, fontWeight: '800' },
});
