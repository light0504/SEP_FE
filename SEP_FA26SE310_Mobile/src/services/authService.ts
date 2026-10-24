import { API_BASE_URL, ApiError } from './apiClient';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  fullName?: string;
  email?: string;
  roles: string[];
}

interface ApiEnvelope {
  statusCode?: number;
  message?: string;
  data?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    fullName?: string;
    email?: string;
    roles?: string[];
  } | null;
}

function decodeClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return {};
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bitBuffer = 0;
    let bitCount = 0;
    const bytes: number[] = [];
    for (const char of payload) {
      if (char === '=') break;
      const value = alphabet.indexOf(char);
      if (value < 0) return {};
      bitBuffer = (bitBuffer << 6) | value;
      bitCount += 6;
      if (bitCount >= 8) {
        bitCount -= 8;
        bytes.push((bitBuffer >> bitCount) & 0xff);
      }
    }
    const utf8Json = bytes.map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join('');
    return JSON.parse(decodeURIComponent(utf8Json)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function post(path: string, body: unknown, accessToken?: string): Promise<ApiEnvelope> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    let response: Response;
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
      });
    } catch {
      throw new Error(controller.signal.aborted ? 'Máy chủ phản hồi chậm. Vui lòng thử lại.' : 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }

    const result = await response.json().catch(() => null) as ApiEnvelope | null;
    if (!response.ok || !result || (result.statusCode !== undefined && result.statusCode >= 400)) {
      throw new ApiError(result?.message || 'Yêu cầu không thành công. Vui lòng thử lại.', response.ok ? result?.statusCode ?? response.status : response.status);
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginWithPassword(username: string, password: string): Promise<AuthSession> {
  const result = await post('/login', { username: username.trim(), password });
  const data = result.data;
  const accessToken = data?.accessToken || data?.token;
  if (!accessToken || !data?.refreshToken) throw new Error('Máy chủ trả về phiên đăng nhập không hợp lệ.');

  const claims = decodeClaims(accessToken);
  const claimRoles = Array.isArray(claims.roles) ? claims.roles.filter((role): role is string => typeof role === 'string') : [];
  return {
    accessToken,
    refreshToken: data.refreshToken,
    fullName: data.fullName || (typeof claims.fullName === 'string' ? claims.fullName : undefined),
    email: data.email || (typeof claims.email === 'string' ? claims.email : undefined),
    roles: data.roles || claimRoles,
  };
}

export async function refreshAuthSession(refreshToken: string): Promise<AuthSession> {
  const result = await post('/refresh-token', { refreshToken });
  const data = result.data;
  const accessToken = data?.accessToken || data?.token;
  if (!accessToken) throw new Error('Máy chủ không trả về access token mới.');
  const claims = decodeClaims(accessToken);
  const claimRoles = Array.isArray(claims.roles) ? claims.roles.filter((role): role is string => typeof role === 'string') : [];
  return {
    accessToken,
    refreshToken: data?.refreshToken || refreshToken,
    fullName: data?.fullName || (typeof claims.fullName === 'string' ? claims.fullName : undefined),
    email: data?.email || (typeof claims.email === 'string' ? claims.email : undefined),
    roles: data?.roles || claimRoles,
  };
}

export async function logoutCurrentDevice(session: AuthSession): Promise<void> {
  try {
    await post('/session/logout', undefined, session.accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !session.refreshToken) throw error;
    const renewed = await refreshAuthSession(session.refreshToken);
    await post('/session/logout', undefined, renewed.accessToken);
  }
}
