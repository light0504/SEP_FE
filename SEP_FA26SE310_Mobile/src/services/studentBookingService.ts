import type { AuthenticatedGet } from './apiClient';
import type { StudentBooking } from '../types/studentBookings';

const isId = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isNullableText = (value: unknown) => value === null || isText(value);

export function isBooking(value: unknown): value is StudentBooking {
  if (!value || typeof value !== 'object') return false;
  const booking = value as Partial<StudentBooking>;
  return isId(booking.bookingId) && isId(booking.tripId) && isId(booking.boardingStopId)
    && isId(booking.alightingStopId) && isId(booking.seatId)
    && isText(booking.bookingCode) && isText(booking.tripCode) && isText(booking.boardingStop)
    && isText(booking.alightingStop) && isText(booking.seatCode) && isText(booking.status)
    && isText(booking.reservedAt) && isNullableText(booking.checkedInAt) && isNullableText(booking.cancelledAt);
}

export async function getMyBookings(request: AuthenticatedGet, signal?: AbortSignal): Promise<StudentBooking[]> {
  const data = await request<unknown>('/student/bookings/my', signal);
  if (!Array.isArray(data) || !data.every(isBooking)) throw new Error('Danh sách đặt chỗ từ máy chủ không hợp lệ. Vui lòng thử lại.');
  return data;
}
