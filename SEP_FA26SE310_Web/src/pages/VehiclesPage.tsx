import { useEffect, useState, type FormEvent } from 'react'
import type { AdminGet, AdminWrite } from '../services/apiClient'
import type { StaffMember, Vehicle } from '../types/transport'
import Modal from '../components/Modal'
import '../styles/operations.css'

const blank = { licensePlate: '', capacity: '45', driverId: '', busAttendantId: '', status: 'ACTIVE' }
export default function VehiclesPage({ request, write }: { request: AdminGet; write: AdminWrite }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    Promise.all([request<Vehicle[]>('/admin/vehicles', controller.signal), request<StaffMember[]>('/admin/staff', controller.signal)])
      .then(([data, people]) => { if (!controller.signal.aborted) { setVehicles(data); setStaff(people) } })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách xe.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [request, attempt])
  const drivers = staff.filter(person => person.role === 'DRIVER')
  const attendants = staff.filter(person => person.role === 'BUS_ATTENDANT')
  const open = (vehicle?: Vehicle) => {
    setEditing(vehicle?.vehicleId ?? 'new'); setFormError(''); setNotice('')
    setForm(vehicle ? { licensePlate: vehicle.licensePlate, capacity: String(vehicle.capacity), driverId: String(vehicle.driverId), busAttendantId: vehicle.busAttendantId ? String(vehicle.busAttendantId) : '', status: vehicle.status } : { ...blank })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || editing === null) return
    setSaving(true); setFormError('')
    try {
      await write(editing === 'new' ? 'POST' : 'PUT', editing === 'new' ? '/admin/vehicles' : `/admin/vehicles/${editing}`, {
        licensePlate: form.licensePlate, capacity: Number(form.capacity), driverId: Number(form.driverId),
        busAttendantId: form.busAttendantId ? Number(form.busAttendantId) : null, status: form.status,
      })
      setEditing(null); setNotice('Đã lưu xe'); setAttempt(value => value + 1)
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Không thể lưu xe.') }
    finally { setSaving(false) }
  }
  return <>
    <div className="operation-toolbar"><button className="secondary-button" disabled={loading || saving} onClick={() => setAttempt(value => value + 1)}>Tải lại</button><button className="primary-button" disabled={loading || Boolean(error)} onClick={() => open()}>Thêm xe</button></div>
    {notice ? <p role="status" className="operation-notice">{notice}</p> : null}
    {error ? <p role="alert" className="operation-error">{error}</p> : null}
    {loading ? <section className="panel users-message" role="status">Đang tải…</section> : !error ? <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>BIỂN SỐ</th><th>SỐ GHẾ</th><th>TÀI XẾ</th><th>BUS ATTENDANT</th><th>TRẠNG THÁI</th><th></th></tr></thead><tbody>
      {vehicles.length ? vehicles.map(vehicle => <tr key={vehicle.vehicleId}><td><strong>{vehicle.licensePlate}</strong></td><td>{vehicle.capacity}</td><td>{vehicle.driverName}</td><td>{vehicle.busAttendantName || 'Chưa phân công'}</td><td>{vehicle.status === 'ACTIVE' ? 'Đang sử dụng' : 'Ngừng sử dụng'}</td><td><button className="text-button" aria-label={`Sửa xe ${vehicle.licensePlate}`} onClick={() => open(vehicle)}>Sửa</button></td></tr>) : <tr><td colSpan={6} className="empty-state">Chưa có xe.</td></tr>}
    </tbody></table></div></section> : null}
    {editing !== null ? <Modal title={editing === 'new' ? 'Thêm xe' : 'Sửa xe'} busy={saving} onClose={() => setEditing(null)}>
      <form onSubmit={submit}><fieldset disabled={saving} className="operation-fields">
        <div className="form-row"><label>Biển số<input required maxLength={30} value={form.licensePlate} onChange={event => setForm({ ...form, licensePlate: event.target.value })} /></label><label>Số ghế<input type="number" required min={1} max={100} value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} /></label></div>
        <label>Tài xế<select required value={form.driverId} onChange={event => setForm({ ...form, driverId: event.target.value })}><option value="">Chọn tài xế</option>{drivers.map(person => <option key={person.userId} value={person.userId}>{person.fullName} · {person.email}</option>)}</select></label>
        {!drivers.length ? <p>Chưa có tài xế. Tạo tài khoản tại Người dùng.</p> : null}
        <label>Bus attendant<select value={form.busAttendantId} onChange={event => setForm({ ...form, busAttendantId: event.target.value })}><option value="">Chưa phân công</option>{attendants.map(person => <option key={person.userId} value={person.userId}>{person.fullName} · {person.email}</option>)}</select></label>
        <label>Trạng thái<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="ACTIVE">Đang sử dụng</option><option value="INACTIVE">Ngừng sử dụng</option></select></label>
      </fieldset>{formError ? <p role="alert" className="operation-error">{formError}</p> : null}<div className="modal-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => setEditing(null)}>Hủy</button><button className="primary-button" type="submit" disabled={saving || !drivers.length}>{saving ? 'Đang lưu…' : 'Lưu'}</button></div></form>
    </Modal> : null}
  </>
}
