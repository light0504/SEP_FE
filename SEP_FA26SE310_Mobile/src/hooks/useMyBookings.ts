import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ApiError } from '../services/apiClient';
import { getMyBookings } from '../services/studentBookingService';
import type { StudentBooking } from '../types/studentBookings';

export function useMyBookings() {
  const { apiGet } = useAppContext();
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setBookings([]);
    const load = async () => {
      try {
        const data = await getMyBookings(apiGet, controller.signal);
        if (!controller.signal.aborted) setBookings(data);
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason instanceof ApiError && reason.status === 403
          ? 'Tài khoản của bạn không có quyền xem danh sách đặt chỗ.'
          : reason instanceof ApiError && reason.status === 401
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : reason instanceof Error ? reason.message : 'Không thể tải danh sách đặt chỗ.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [apiGet, attempt]);

  return { bookings, loading, error, reload: () => setAttempt(value => value + 1) };
}
