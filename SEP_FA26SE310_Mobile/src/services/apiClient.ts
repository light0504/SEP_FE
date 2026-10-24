import type { AuthSession } from './authService';
import { Platform } from 'react-native';

declare const process: { env: { EXPO_PUBLIC_API_BASE_URL?: string } };

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL
  || (Platform.OS === 'android' ? 'http://10.0.2.2:8081/api' : 'http://localhost:8081/api')).replace(/\/$/, '');

interface ApiEnvelope<T> {
  statusCode?: number;
  message?: string;
  data: T;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export type AuthenticatedGet = <T>(path: string, signal?: AbortSignal) => Promise<T>;
export type AuthenticatedPut = <T>(path: string, body: unknown, signal?: AbortSignal) => Promise<T>;

interface RequestOptions {
  method?: 'GET' | 'PUT' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}

type AuthenticatedRequest = <T>(path: string, options?: RequestOptions) => Promise<T>;

async function requestApi<T>(path: string, accessToken: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, 60_000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json', Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null) as ApiEnvelope<T> | null;
    if (!response.ok || (result?.statusCode !== undefined && result.statusCode >= 400)) {
      throw new ApiError(result?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.',
        response.ok ? result!.statusCode! : response.status);
    }
    if (!result || result.data === undefined || result.data === null) {
      throw new ApiError('Máy chủ trả về dữ liệu không hợp lệ.', response.status);
    }
    return result.data;
  } catch (error) {
    if (signal?.aborted || error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new Error('Máy chủ phản hồi chậm. Vui lòng thử lại.');
    throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function getApi<T>(path: string, accessToken: string, signal?: AbortSignal): Promise<T> {
  return requestApi<T>(path, accessToken, { signal });
}

function createAuthenticatedRequest(
  getSession: () => AuthSession | null,
  refreshSession: () => Promise<AuthSession>,
): AuthenticatedRequest {
  return async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { signal } = options;
    const session = getSession();
    if (!session) throw new Error('Vui lòng đăng nhập bằng tài khoản để tải dữ liệu.');
    try {
      return await requestApi<T>(path, session.accessToken, options);
    } catch (error) {
      if (signal?.aborted || !(error instanceof ApiError) || error.status !== 401) throw error;
      const current = getSession();
      if (!current || current.refreshToken !== session.refreshToken) {
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng mở lại trang.');
      }
      const renewed = current.accessToken !== session.accessToken ? current : await refreshSession();
      return requestApi<T>(path, renewed.accessToken, options);
    }
  };
}

export function createAuthenticatedGet(getSession: () => AuthSession | null, refreshSession: () => Promise<AuthSession>): AuthenticatedGet {
  const request = createAuthenticatedRequest(getSession, refreshSession);
  return <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal });
}

export function createAuthenticatedPut(getSession: () => AuthSession | null, refreshSession: () => Promise<AuthSession>): AuthenticatedPut {
  const request = createAuthenticatedRequest(getSession, refreshSession);
  return <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>(path, { method: 'PUT', body, signal });
}

export function createAuthenticatedPost(getSession: () => AuthSession | null, refreshSession: () => Promise<AuthSession>): AuthenticatedPut {
  const request = createAuthenticatedRequest(getSession, refreshSession);
  return <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>(path, { method: 'POST', body, signal });
}
