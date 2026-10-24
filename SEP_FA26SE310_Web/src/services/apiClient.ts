import type { AdminSession } from './auth'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type AdminGet = <T>(path: string, signal?: AbortSignal) => Promise<T>
export type AdminWrite = <T>(method: 'POST' | 'PUT', path: string, body: unknown, signal?: AbortSignal) => Promise<T>
export type AdminDownload = (path: string, signal?: AbortSignal) => Promise<Blob>

async function get<T>(path: string, accessToken: string, signal?: AbortSignal, method = 'GET', body?: unknown, binary = false): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abort)
  const timeout = setTimeout(abort, 60_000)
  const multipart = body instanceof FormData
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Accept: '*/*', Authorization: `Bearer ${accessToken}`, ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
    if (binary && response.ok) {
      if (!response.headers.get('Content-Type')?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) throw new ApiError('Máy chủ trả về tệp không hợp lệ.', response.status)
      return await response.blob() as T
    }
    const result = await response.json().catch(() => null) as { statusCode?: number; message?: string; data?: T | null } | null
    if (!response.ok || (result?.statusCode !== undefined && result.statusCode >= 400)) {
      throw new ApiError(result?.message || 'Không thể tải dữ liệu.', response.ok ? result?.statusCode ?? response.status : response.status)
    }
    if (!result || result.data === undefined || result.data === null) throw new ApiError('Máy chủ trả về dữ liệu không hợp lệ.', response.status)
    return result.data
  } catch (error) {
    if (signal?.aborted || error instanceof ApiError) throw error
    if (controller.signal.aborted) throw new Error('Máy chủ phản hồi chậm. Vui lòng thử lại.')
    throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.')
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

function createAdminRequest(getSession: () => AdminSession | null, refreshSession: () => Promise<AdminSession>) {
  return async <T>(path: string, signal?: AbortSignal, method = 'GET', body?: unknown, binary = false): Promise<T> => {
    const session = getSession()
    if (!session) throw new Error('Vui lòng đăng nhập quản trị để xem dữ liệu.')
    try {
      return await get<T>(path, session.accessToken, signal, method, body, binary)
    } catch (error) {
      if (signal?.aborted || !(error instanceof ApiError) || error.status !== 401) throw error
      const current = getSession()
      if (!current || current.refreshToken !== session.refreshToken) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng mở lại trang.')
      const renewed = current.accessToken !== session.accessToken ? current : await refreshSession()
      return get<T>(path, renewed.accessToken, signal, method, body, binary)
    }
  }
}

export function createAdminGet(getSession: () => AdminSession | null, refreshSession: () => Promise<AdminSession>): AdminGet {
  const request = createAdminRequest(getSession, refreshSession)
  return <T>(path: string, signal?: AbortSignal) => request<T>(path, signal)
}

export function createAdminWrite(getSession: () => AdminSession | null, refreshSession: () => Promise<AdminSession>): AdminWrite {
  const request = createAdminRequest(getSession, refreshSession)
  return <T>(method: 'POST' | 'PUT', path: string, body: unknown, signal?: AbortSignal) => request<T>(path, signal, method, body)
}

export function createAdminDownload(getSession: () => AdminSession | null, refreshSession: () => Promise<AdminSession>): AdminDownload {
  const request = createAdminRequest(getSession, refreshSession)
  return (path: string, signal?: AbortSignal) => request<Blob>(path, signal, 'GET', undefined, true)
}
