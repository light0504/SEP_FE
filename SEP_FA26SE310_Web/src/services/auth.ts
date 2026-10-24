import { API_BASE_URL } from './apiClient'

export type AdminSession = {
  accessToken: string
  refreshToken: string
  roles: string[]
  expiresAt: number | null
  fullName: string
  email: string
}

type ApiResponse = {
  statusCode?: number
  message?: string
  data?: { token?: string; accessToken?: string; refreshToken?: string; roles?: string[] } | null
}

class AuthApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

function readTokenClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    if (!payload) return {}
    const json = decodeURIComponent(Array.from(atob(payload), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

function sessionFromResponse(response: ApiResponse, fallbackRefreshToken = ''): AdminSession {
  const accessToken = response.data?.accessToken || response.data?.token
  if (!accessToken) throw new Error('Máy chủ không trả về access token.')
  const claims = readTokenClaims(accessToken)
  const roles = response.data?.roles || (Array.isArray(claims.roles) ? claims.roles.filter((role): role is string => typeof role === 'string') : [])
  if (!roles.includes('ADMIN')) throw new Error('Tài khoản không có quyền quản trị.')
  return {
    accessToken,
    refreshToken: response.data?.refreshToken || fallbackRefreshToken,
    roles,
    expiresAt: typeof claims.exp === 'number' ? claims.exp * 1000 : null,
    fullName: typeof claims.fullName === 'string' ? claims.fullName : 'Quản trị viên',
    email: typeof claims.email === 'string' ? claims.email : '',
  }
}

async function post(path: string, body: unknown, accessToken?: string): Promise<ApiResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  try {
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          Accept: accessToken ? '*/*' : 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: body === undefined ? '' : JSON.stringify(body),
        signal: controller.signal,
      })
    } catch {
      throw new Error(controller.signal.aborted ? 'Máy chủ phản hồi chậm. Vui lòng thử lại.' : 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.')
    }
    const result = await response.json().catch(() => null) as ApiResponse | null
    if (!response.ok || !result || (result.statusCode !== undefined && result.statusCode >= 400)) {
      throw new AuthApiError(result?.message || 'Yêu cầu không thành công. Vui lòng thử lại.', response.ok ? result?.statusCode ?? response.status : response.status)
    }
    return result
  } finally {
    clearTimeout(timeout)
  }
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  return sessionFromResponse(await post('/login', { username: username.trim(), password }))
}

export async function refreshAdminSession(session: AdminSession): Promise<AdminSession> {
  if (!session.refreshToken) throw new Error('Không có refresh token. Vui lòng đăng nhập lại.')
  return sessionFromResponse(await post('/refresh-token', { refreshToken: session.refreshToken }), session.refreshToken)
}

export async function logoutAdmin(session: AdminSession): Promise<void> {
  try {
    await post('/session/logout', undefined, session.accessToken)
  } catch (error) {
    if (!(error instanceof AuthApiError) || error.status !== 401 || !session.refreshToken) throw error
    const renewed = await refreshAdminSession(session)
    await post('/session/logout', undefined, renewed.accessToken)
  }
}
