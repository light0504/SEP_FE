import type { AuthenticatedGet, AuthenticatedPut } from './apiClient';
import type { AvailableSeat, CreateBooking, StudentTrip, TripSearch } from '../types/studentTrips';
import type { StudentBooking } from '../types/studentBookings';
import { isBooking } from './studentBookingService';

export async function searchStudentTrips(request: AuthenticatedGet, filters: TripSearch, signal?: AbortSignal): Promise<StudentTrip[]> {
  const query = Object.entries(filters).filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&');
  const data = await request<StudentTrip[]>(`/student/trips?${query}`, signal);
  if (!Array.isArray(data) || !data.every(trip => Number.isSafeInteger(trip.tripId) && Array.isArray(trip.stops)
    && trip.stops.every(stop => Number.isSafeInteger(stop.tripStopId) && Number.isSafeInteger(stop.stopId)))) {
    throw new Error('Dữ liệu chuyến xe không hợp lệ.');
  }
  return data;
}

export async function getTripSeats(request: AuthenticatedGet, tripId: number, boarding: number, alighting: number, signal?: AbortSignal): Promise<AvailableSeat[]> {
  const data = await request<AvailableSeat[]>(`/student/trips/${tripId}/seats?boardingTripStopId=${boarding}&alightingTripStopId=${alighting}`, signal);
  if (!Array.isArray(data) || !data.every(seat => Number.isSafeInteger(seat.seatId) && typeof seat.seatCode === 'string' && ['AVAILABLE', 'BOOKED'].includes(seat.status))) {
    throw new Error('Dữ liệu ghế không hợp lệ.');
  }
  return data;
}

export async function createStudentBooking(request: AuthenticatedPut, input: CreateBooking): Promise<StudentBooking> {
  const result = await request<unknown>('/student/bookings', input);
  if (!isBooking(result)) throw new Error('Phản hồi đặt chỗ không hợp lệ. Vui lòng kiểm tra Chỗ của tôi trước khi đặt lại.');
  return result;
}
