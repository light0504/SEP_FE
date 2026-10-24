import type { AuthenticatedPut } from './apiClient';

export async function updatePreferredStop(request: AuthenticatedPut, stopId: number): Promise<number> {
  if (!Number.isSafeInteger(stopId) || stopId <= 0) throw new Error('Điểm đón không hợp lệ. Vui lòng chọn lại.');
  const savedId = await request<unknown>('/student/profile/preferred-stop', { stopId });
  if (savedId !== stopId) throw new Error('Máy chủ chưa xác nhận điểm đón đã chọn. Vui lòng thử lại.');
  return stopId;
}
