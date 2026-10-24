import { useId, useState, type FormEvent } from 'react'
import type { AdminWrite } from '../services/apiClient'
import type { ApiRoute, ApiTrip, StaffMember, Vehicle } from '../types/transport'
import { todayVN } from '../utils/calendar'
import MultiDatePicker from './MultiDatePicker'

export default function TripCreateForm({ routes, vehicles, staff, write, onBusy, onCreated, onClose }: {
  routes: ApiRoute[]; vehicles: Vehicle[]; staff: StaffMember[]; write: AdminWrite; onBusy: (value: boolean) => void; onCreated: (trips: ApiTrip[]) => void; onClose: () => void;
}) {
  const available = vehicles.filter(vehicle => vehicle.status === 'ACTIVE')
  const [routeId, setRouteId] = useState(routes[0] ? String(routes[0].routeId) : '')
  const [vehicleId, setVehicleId] = useState('')
  const [details, setDetails] = useState({ vehicle: '', capacity: '45', driver: '', busAttendant: '' })
  const driversList = useId(), attendantsList = useId()
  const [dates, setDates] = useState<string[]>([todayVN()])
  const [time, setTime] = useState('07:00')
  const [slot, setSlot] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const vehicle = available.find(item => String(item.vehicleId) === vehicleId)
  const staffLabel = (person: StaffMember) => `${person.fullName} (${person.email})`
  const findPerson = (value: string, role: StaffMember['role'], defaultId?: number | null) => {
    const text = value.trim().toLowerCase()
    const exact = staff.find(person => person.role === role && staffLabel(person).toLowerCase() === text)
    if (exact) return exact
    const matches = staff.filter(person => person.role === role && person.fullName.trim().toLowerCase() === text)
    return matches.find(person => person.userId === defaultId) || (matches.length === 1 ? matches[0] : undefined)
  }
  const selectVehicle = (id: string) => {
    setVehicleId(id)
    const selected = available.find(item => String(item.vehicleId) === id)
    if (selected) setDetails({ vehicle: selected.licensePlate, capacity: String(selected.capacity), driver: selected.driverName, busAttendant: selected.busAttendantName || '' })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !dates.length) return
    setSaving(true); onBusy(true); setError('')
    try {
      const driver = findPerson(details.driver, 'DRIVER', vehicle?.driverId)
      const attendant = findPerson(details.busAttendant, 'BUS_ATTENDANT', vehicle?.busAttendantId)
      const created = await write<ApiTrip[]>('POST', '/admin/trips/batch', {
        routeId: Number(routeId), vehicleId: vehicle?.vehicleId ?? null, dates, time, slot: Number(slot),
        vehicle: details.vehicle.trim(), capacity: Number(details.capacity),
        driver: driver?.fullName || details.driver.trim(), driverId: driver?.userId ?? null,
        busAttendant: attendant?.fullName || details.busAttendant.trim(), busAttendantId: attendant?.userId ?? null,
      })
      onCreated(created)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo chuyến.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <form onSubmit={submit}>
    <fieldset disabled={saving} className="operation-fields">
      <label>Tuyến xe<select required value={routeId} onChange={event => setRouteId(event.target.value)}><option value="">Chọn tuyến</option>{routes.map(route => <option key={route.routeId} value={route.routeId}>{route.name}</option>)}</select></label>
      <label>Xe có sẵn<select value={vehicleId} onChange={event => selectVehicle(event.target.value)}><option value="">Nhập thủ công</option>{available.map(item => <option key={item.vehicleId} value={item.vehicleId}>{item.licensePlate} · {item.capacity} ghế</option>)}</select></label>
      <div className="form-row"><label>Biển số<input required maxLength={30} value={details.vehicle} onChange={event => {
        const plate = event.target.value
        setDetails({ ...details, vehicle: plate })
        if (vehicle && plate.replace(/\s+/g, '').toUpperCase() !== vehicle.licensePlate) setVehicleId('')
      }} /></label><label>Số ghế<input type="number" required min={1} max={100} value={details.capacity} onChange={event => setDetails({ ...details, capacity: event.target.value })} /></label></div>
      <label>Tài xế<input required list={driversList} maxLength={420} autoComplete="off" value={details.driver} onChange={event => setDetails({ ...details, driver: event.target.value })} /></label>
      <datalist id={driversList}>{staff.filter(person => person.role === 'DRIVER').map(person => <option key={person.userId} value={staffLabel(person)} />)}</datalist>
      <label>Bus attendant<input list={attendantsList} maxLength={420} autoComplete="off" value={details.busAttendant} onChange={event => setDetails({ ...details, busAttendant: event.target.value })} /></label>
      <datalist id={attendantsList}>{staff.filter(person => person.role === 'BUS_ATTENDANT').map(person => <option key={person.userId} value={staffLabel(person)} />)}</datalist>
      <div className="form-row"><label>Giờ khởi hành<input type="time" required value={time} onChange={event => setTime(event.target.value)} /></label><label>Slot<select value={slot} onChange={event => setSlot(event.target.value)}>{[1, 2, 3, 4, 5, 6].map(item => <option key={item}>{item}</option>)}</select></label></div>
      <h3 className="field-heading">Ngày chạy · tối đa 90 ngày</h3>
      <MultiDatePicker value={dates} onChange={setDates} />
    </fieldset>
    {error ? <p role="alert" className="operation-error">{error}</p> : null}
    <div className="modal-actions"><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Hủy</button><button type="submit" className="primary-button" disabled={saving || !dates.length}>{saving ? 'Đang tạo…' : `Tạo ${dates.length} chuyến`}</button></div>
  </form>
}
