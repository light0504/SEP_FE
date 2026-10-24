import { useEffect, useRef, useState } from 'react'
import type { AdminDownload, AdminGet, AdminWrite } from '../services/apiClient'
import type { EmailAccessPage } from '../types/emailAccess'
import Modal from './Modal'
import EmailImportForm from './EmailImportForm'
import '../styles/emailAccess.css'

const roles: Record<string, string> = { STUDENT: 'Học sinh', LECTURER: 'Giảng viên', DRIVER: 'Tài xế', BUS_ATTENDANT: 'Bus attendant' }

export default function EmailAccessPanel({ request, write, download }: { request: AdminGet; write: AdminWrite; download: AdminDownload }) {
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [data, setData] = useState<EmailAccessPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const downloadController = useRef<AbortController | null>(null)

  useEffect(() => () => downloadController.current?.abort(), [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(''); setData(null)
    request<EmailAccessPage>(`/admin/email-access?page=${page}&size=20`, controller.signal)
      .then(result => { if (!controller.signal.aborted) { if (page > 0 && page >= result.page.totalPages) setPage(Math.max(0, result.page.totalPages - 1)); else setData(result) } })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không thể tải email.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [request, page, attempt])

  async function downloadTemplate() {
    if (downloadController.current) return
    const controller = new AbortController(); downloadController.current = controller
    setDownloading(true); setDownloadError('')
    try {
      const blob = await download('/admin/email-access/template', controller.signal)
      if (controller.signal.aborted) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = 'fbus-email-template.xlsx'
      document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (reason) { if (!controller.signal.aborted) setDownloadError(reason instanceof Error ? reason.message : 'Không thể tải mẫu.') }
    finally { if (!controller.signal.aborted) setDownloading(false); downloadController.current = null }
  }

  const count = data?.page.totalElements ?? 0
  return <section className="panel table-panel users-panel" aria-busy={loading}>
    <div className="panel-heading table-heading users-heading"><h2>Email được phép đăng nhập</h2>
      <div className="users-actions"><button className="secondary-button" disabled={loading || saving} onClick={() => setAttempt(value => value + 1)}>Tải lại</button><button className="secondary-button" disabled={downloading} onClick={() => { void downloadTemplate() }}>{downloading ? 'Đang tải…' : 'Tải mẫu Excel'}</button><button className="primary-button" onClick={() => setImporting(true)}>Nhập Excel</button></div>
    </div>
    <p className="email-access-note">Đăng nhập Google chưa khả dụng.</p>
    {downloadError ? <p role="alert" className="operation-error">{downloadError}</p> : null}
    {loading ? <div role="status" className="users-message">Đang tải…</div> : error ? <div role="alert" className="users-message users-error"><p>{error}</p><button className="secondary-button" onClick={() => setAttempt(value => value + 1)}>Thử lại</button></div> : <>
      <div className="table-scroll"><table className="users-table"><caption className="users-sr-only">Email được phép đăng nhập</caption>
        <thead><tr><th scope="col">EMAIL</th><th scope="col">HỌ TÊN</th><th scope="col">VAI TRÒ</th><th scope="col">TÀI KHOẢN</th></tr></thead>
        <tbody>{data?.content.length ? data.content.map(item => <tr key={item.email}><td>{item.email}</td><td>{item.fullName || '—'}</td><td>{roles[item.role] || item.role}</td><td>{item.userId === null ? 'Chưa tạo' : `ID ${item.userId}`}</td></tr>) : <tr><td colSpan={4} className="empty-state">Chưa có email.</td></tr>}</tbody>
      </table></div>
      <div className="users-pagination"><span aria-live="polite">{count.toLocaleString('vi-VN')} email</span><div>
        <button className="secondary-button" disabled={page <= 0} onClick={() => setPage(value => value - 1)}>← Trước</button>
        <span>Trang {data?.page.totalPages ? page + 1 : 0} / {data?.page.totalPages ?? 0}</span>
        <button className="secondary-button" disabled={!data || page + 1 >= data.page.totalPages} onClick={() => setPage(value => value + 1)}>Sau →</button>
      </div></div>
    </>}
    {importing ? <Modal title="Nhập email từ Excel" busy={saving} onClose={() => setImporting(false)}><EmailImportForm write={write} onBusy={setSaving} onClose={() => setImporting(false)} onImported={() => { setPage(0); setAttempt(value => value + 1) }} /></Modal> : null}
  </section>
}
