import { useState, type FormEvent } from 'react'
import type { AdminWrite } from '../services/apiClient'

export default function UserCreateForm({ write, onBusy, onCreated, onClose }: { write: AdminWrite; onBusy: (busy: boolean) => void; onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '', role: 'DRIVER' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true); onBusy(true); setError('')
    try { await write('POST', '/admin/users', form); onCreated() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo tài khoản.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <form onSubmit={submit}><fieldset disabled={saving} className="operation-fields">
    <label>Họ tên<input required maxLength={150} autoComplete="off" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} /></label>
    <label>Email<input type="email" required maxLength={254} autoComplete="off" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
    <label>Tên đăng nhập<input required minLength={3} maxLength={100} pattern="[A-Za-z0-9_.\-]+" autoComplete="off" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label>
    <label>Mật khẩu<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
    <label>Vai trò<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="DRIVER">Tài xế</option><option value="BUS_ATTENDANT">Bus attendant</option><option value="LECTURER">Giảng viên</option><option value="STUDENT">Học sinh</option></select></label>
  </fieldset>{error ? <p role="alert" className="operation-error">{error}</p> : null}<div className="modal-actions"><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Hủy</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Đang tạo…' : 'Tạo tài khoản'}</button></div></form>
}
