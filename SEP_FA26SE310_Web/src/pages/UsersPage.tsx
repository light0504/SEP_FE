import { useEffect, useState } from 'react'
import { ApiError, type AdminDownload, type AdminGet, type AdminWrite } from '../services/apiClient'
import Modal from '../components/Modal'
import UserCreateForm from '../components/UserCreateForm'
import EmailAccessPanel from '../components/EmailAccessPanel'
import '../styles/emailAccess.css'
import '../styles/operations.css'
import { getAdminUsers } from '../services/adminUserService'
import type { AdminUsersPage } from '../types/adminUsers'

const roleLabels: Record<string, string> = { ADMIN: 'Quản trị viên', STUDENT: 'Học sinh', DRIVER: 'Tài xế', BUS_ATTENDANT: 'Bus attendant', LECTURER: 'Giảng viên' }

export default function UsersPage({ request, write, download }: { request: AdminGet; write: AdminWrite; download: AdminDownload }) {
  const [view, setView] = useState<'accounts' | 'emails'>('accounts')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [attempt, setAttempt] = useState(0)
  const [data, setData] = useState<AdminUsersPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (view !== 'accounts') return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setData(null)
    const load = async () => {
      try {
        const result = await getAdminUsers(request, page, size, controller.signal)
        if (controller.signal.aborted) return
        if (page > 0 && page >= result.page.totalPages) {
          setPage(Math.max(0, result.page.totalPages - 1))
          return
        }
        setData(result)
      } catch (reason) {
        if (controller.signal.aborted) return
        const denied = reason instanceof ApiError && reason.status === 403
        setError(denied ? 'Tài khoản của bạn không có quyền xem danh sách người dùng.'
          : reason instanceof Error ? reason.message : 'Không thể tải danh sách người dùng.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [request, page, size, attempt, view])

  const totalPages = data?.page.totalPages ?? 0
  const totalElements = data?.page.totalElements ?? 0
  const start = data?.content.length ? data.page.number * data.page.size + 1 : 0
  const end = data?.content.length ? start + data.content.length - 1 : 0

  return <>
    <div className="users-view-switch" role="group" aria-label="Quản lý người dùng">
      <button type="button" aria-pressed={view === 'accounts'} onClick={() => setView('accounts')}>Tài khoản</button>
      <button type="button" aria-pressed={view === 'emails'} onClick={() => setView('emails')}>Email được phép</button>
    </div>
    {view === 'emails' ? <EmailAccessPanel request={request} write={write} download={download} /> : <section className="panel table-panel users-panel" aria-busy={loading}>
    <div className="panel-heading table-heading users-heading">
      <h2>Danh sách người dùng</h2>
      <div className="users-actions"><button className="secondary-button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>Tải lại</button><button className="primary-button" onClick={() => setCreating(true)}>Tạo tài khoản</button></div>
    </div>
    <div className="users-toolbar">
      <label>Số dòng mỗi trang <select value={size} disabled={loading} onChange={event => { setSize(Number(event.target.value)); setPage(0) }}>
        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
      </select></label>
      {data ? <span>{totalElements.toLocaleString('vi-VN')} tài khoản</span> : null}
    </div>
    {loading ? <div className="users-message" role="status">Đang tải danh sách người dùng…</div> : error ? <div className="users-message users-error" role="alert">
      <p>{error}</p>
      <button className="secondary-button" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
    </div> : <>
      <div className="table-scroll"><table className="users-table">
        <caption className="users-sr-only">Danh sách người dùng hệ thống Fbus</caption>
        <thead><tr><th scope="col">NGƯỜI DÙNG</th><th scope="col">EMAIL / MÃ HỌC SINH</th><th scope="col">ĐIỆN THOẠI</th><th scope="col">VAI TRÒ</th><th scope="col">TRẠNG THÁI</th><th scope="col">XÁC MINH EMAIL</th><th scope="col">TÀI KHOẢN</th><th scope="col">ĐIỂM ĐÓN ƯU TIÊN</th></tr></thead>
        <tbody>{data?.content.length ? data.content.map(user => <tr key={user.userId}>
          <td><strong>{user.fullName || user.username}</strong><small>@{user.username} · ID {user.userId}</small></td>
          <td>{user.email}<small>{user.studentCode || '—'}</small></td>
          <td>{user.phone || '—'}</td>
          <td><span className="users-role">{roleLabels[user.role] || user.role}</span></td>
          <td><span className={`status ${user.status === 'ACTIVE' ? 'status-live' : 'status-paused'}`}><i />{user.status === 'ACTIVE' ? 'Hoạt động' : user.status}</span></td>
          <td>{user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
          <td><span className={user.locked ? 'users-locked' : ''}>{user.locked ? 'Đã khóa' : 'Không khóa'}</span></td>
          <td>{user.preferredStopId === null ? '—' : `ID ${user.preferredStopId}`}</td>
        </tr>) : <tr><td className="empty-state" colSpan={8}>Chưa có người dùng nào.</td></tr>}</tbody>
      </table></div>
      <div className="users-pagination">
        <span aria-live="polite">Hiển thị {start}–{end} / {totalElements} người dùng</span>
        <div><button className="secondary-button" disabled={!data || page <= 0} onClick={() => setPage(value => value - 1)}>← Trước</button>
          <span>{totalPages ? `Trang ${(data?.page.number ?? page) + 1} / ${totalPages}` : 'Chưa có trang dữ liệu'}</span>
          <button className="secondary-button" disabled={!data || page + 1 >= totalPages} onClick={() => setPage(value => value + 1)}>Sau →</button></div>
      </div>
    </>}
    {creating ? <Modal title="Tạo tài khoản" busy={saving} onClose={() => setCreating(false)}><UserCreateForm write={write} onBusy={setSaving} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setPage(Math.floor(totalElements / size)); setAttempt(value => value + 1) }} /></Modal> : null}
  </section>}
  </>
}
