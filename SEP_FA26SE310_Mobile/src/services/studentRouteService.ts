import type { AuthenticatedGet } from './apiClient';
import type { StudentRoute, StudentStop } from '../types/studentRoutes';

function isStop(value: unknown): value is StudentStop {
  if (!value || typeof value !== 'object') return false;
  const stop = value as Partial<StudentStop>;
  return Number.isSafeInteger(stop.stopId) && typeof stop.stopCode === 'string'
    && typeof stop.name === 'string' && stop.name.trim().length > 0 && typeof stop.address === 'string';
}

export async function getStudentRoutes(request: AuthenticatedGet, signal?: AbortSignal): Promise<StudentRoute[]> {
  const data = await request<unknown>('/student/routes', signal);
  if (!Array.isArray(data) || !data.every((value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const route = value as Partial<StudentRoute>;
    return Number.isSafeInteger(route.routeId) && typeof route.routeCode === 'string'
      && typeof route.name === 'string' && route.name.trim().length > 0
      && Array.isArray(route.stops) && route.stops.every(isStop);
  })) throw new Error('Danh sách tuyến xe từ máy chủ không hợp lệ.');
  return data as StudentRoute[];
}

export async function getStudentStops(request: AuthenticatedGet, routeId: number, signal?: AbortSignal): Promise<StudentStop[]> {
  const data = await request<unknown>(`/student/stops?routeId=${encodeURIComponent(routeId)}`, signal);
  if (!Array.isArray(data) || !data.every(isStop)) throw new Error('Danh sách điểm dừng từ máy chủ không hợp lệ.');
  return data;
}
