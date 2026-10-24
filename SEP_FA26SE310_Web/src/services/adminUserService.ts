import type { AdminGet } from './apiClient'
import type { AdminUser, AdminUsersPage } from '../types/adminUsers'

const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
const isNullableString = (value: unknown) => value === null || typeof value === 'string'

function isUser(value: unknown): value is AdminUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<AdminUser>
  return isCount(user.userId) && typeof user.username === 'string' && typeof user.email === 'string'
    && typeof user.fullName === 'string' && typeof user.role === 'string' && typeof user.status === 'string'
    && typeof user.emailVerified === 'boolean' && typeof user.locked === 'boolean'
    && isNullableString(user.studentCode) && isNullableString(user.phone)
    && (user.preferredStopId === null || isCount(user.preferredStopId))
}

export async function getAdminUsers(request: AdminGet, page = 0, size = 20, signal?: AbortSignal): Promise<AdminUsersPage> {
  if (!isCount(page) || !Number.isSafeInteger(size) || size < 1) throw new Error('Thông tin phân trang không hợp lệ.')
  const data = await request<unknown>(`/admin/users?page=${page}&size=${size}`, signal)
  if (!data || typeof data !== 'object') throw new Error('Danh sách người dùng từ máy chủ không hợp lệ.')
  const result = data as Partial<AdminUsersPage>
  const metadata = result.page
  if (!Array.isArray(result.content) || !result.content.every(isUser) || !metadata
    || !isCount(metadata.number) || !isCount(metadata.totalElements) || !isCount(metadata.totalPages)
    || !Number.isSafeInteger(metadata.size) || metadata.size < 1 || result.content.length > metadata.size) {
    throw new Error('Danh sách người dùng hoặc thông tin phân trang từ máy chủ không hợp lệ.')
  }
  return result as AdminUsersPage
}
