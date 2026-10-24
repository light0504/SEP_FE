export interface AdminUser {
  userId: number
  username: string
  email: string
  studentCode: string | null
  fullName: string
  phone: string | null
  preferredStopId: number | null
  status: string
  emailVerified: boolean
  locked: boolean
  role: string
}

export interface AdminUsersPage {
  content: AdminUser[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}
