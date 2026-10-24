export interface AllowedEmail {
  email: string
  fullName: string
  role: string
  createdAt: string
  userId: number | null
}

export interface EmailAccessPage {
  content: AllowedEmail[]
  page: { number: number; size: number; totalElements: number; totalPages: number }
}

export interface EmailImportResult {
  totalRows: number
  imported: number
  skipped: number
  failed: number
  errors: { row: number; email: string; message: string }[]
}
