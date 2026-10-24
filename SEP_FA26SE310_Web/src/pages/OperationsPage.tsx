import { useEffect, useState, type FormEvent } from 'react'
import type { Page } from '../types'
import type { AdminGet, AdminWrite } from '../services/apiClient'
import type { ApiRoute, ApiTrip, StopInfo, Vehicle, StaffMember } from '../types/transport'
import Modal from '../components/Modal'
import TripCreateForm from '../components/TripCreateForm'
import WeeklyTripCalendar from '../components/WeeklyTripCalendar'
import { startOfWeek, todayVN } from '../utils/calendar'
import '../styles/operations.css'

type FormKind = 'stop' | 'route' | 'trip' | null
type RoutePoint = { stopId: string; offsetMinutes: number }
const message = (error: unknown) => error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'

export default function OperationsPage({ page, request, write }: { page: Exclude<Page, 'users' | 'vehicles'>; request: AdminGet; write: AdminWrite }) {
  const [routes, setRoutes] = useState<ApiRoute[]>([])
  const [stops, setStops] = useState<StopInfo[]>([])
  const [trips, setTrips] = useState<ApiTrip[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [week, setWeek] = useState(() => startOfWeek(todayVN()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [form, setForm] = useState<FormKind>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [newStop, setNewStop] = useState({ stopCode: '', name: '', address: '' })
  const [newRoute, setNewRoute] = useState({ routeCode: '', name: '' })
  const [points, setPoints] = useState<RoutePoint[]>([{ stopId: '', offsetMinutes: 0 }, { stopId: '', offsetMinutes: 60 }])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    Promise.all([request<ApiRoute[]>('/admin/routes', controller.signal), request<StopInfo[]>('/admin/stops', controller.signal), request<ApiTrip[]>('/admin/trips', controller.signal), request<Vehicle[]>('/admin/vehicles', controller.signal), request<StaffMember[]>('/admin/staff', controller.signal)])
      .then(([routeData, stopData, tripData, vehicleData, staffData]) => {
        if (controller.signal.aborted) return
        setRoutes(routeData); setStops(stopData); setTrips(tripData); setVehicles(vehicleData); setStaff(staffData)
      }).catch(reason => {
        if (controller.signal.aborted) return
        setError(message(reason)); setRoutes([]); setStops([]); setTrips([]); setVehicles([]); setStaff([])
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [request, attempt, page])

  const open = (kind: FormKind) => {
    setFormError(''); setNotice(''); setForm(kind)
  }
  const close = () => { if (!busy) { setForm(null); setFormError('') } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setFormError('')
    try {
      if (form === 'stop') {
        await write('POST', '/admin/stops', newStop)
        setNewStop({ stopCode: '', name: '', address: '' }); setNotice('Đã tạo điểm dừng')
      } else if (form === 'route') {
        await write('POST', '/admin/routes', { ...newRoute, stops: points.map(point => ({ stopId: Number(point.stopId), offsetMinutes: point.offsetMinutes })) })
        setNewRoute({ routeCode: '', name: '' }); setPoints([{ stopId: '', offsetMinutes: 0 }, { stopId: '', offsetMinutes: 60 }]); setNotice('Đã tạo tuyến')
      }
      setForm(null); setAttempt(value => value + 1)
    } catch (reason) { setFormError(message(reason)) }
    finally { setBusy(false) }
  }
  async function toggle(trip: ApiTrip) {
    if (busy) return
    setBusy(true); setNotice(''); setError('')
    try {
      const updated = await write<ApiTrip>('PUT', `/admin/trips/${trip.tripId}/status`, { status: trip.status === 'PAUSED' ? 'SCHEDULED' : 'PAUSED' })
      setTrips(current => current.map(item => item.tripId === trip.tripId ? updated : item))
    } catch (reason) { setError(message(reason)) }
    finally { setBusy(false) }
  }
  const changePoint = (index: number, patch: Partial<RoutePoint>) => setPoints(current => current.map((point, i) => i === index ? { ...point, ...patch } : point))
  const movePoint = (index: number, direction: number) => setPoints(current => {
    const next = [...current], target = index + direction
    const stop = next[index].stopId; next[index] = { ...next[index], stopId: next[target].stopId }; next[target] = { ...next[target], stopId: stop }
    return next
  })

  if (page === 'reports') return <section className="panel users-message">Báo cáo chưa khả dụng.</section>
  return <>
    <div className="operation-toolbar">
      <button className="secondary-button" disabled={loading || busy} onClick={() => setAttempt(value => value + 1)}>Tải lại</button>
      <div>
        {page === 'routes' ? <><button className="secondary-button" disabled={loading || Boolean(error)} onClick={() => open('stop')}>Thêm điểm dừng</button><button className="primary-button" disabled={loading || stops.length < 2 || Boolean(error)} onClick={() => open('route')}>Tạo tuyến</button></>
          : <button className="primary-button" disabled={loading || routes.length === 0 || Boolean(error)} onClick={() => open('trip')}>Tạo chuyến</button>}
      </div>
    </div>
    {notice ? <p role="status" className="operation-notice">{notice}</p> : null}
    {error ? <p role="alert" className="operation-error">{error}</p> : null}
    {loading ? <section className="panel users-message" role="status">Đang tải…</section> : !error || trips.length || stops.length ? <>
      {page === 'overview' ? <section className="metric-grid">
        {[['Tuyến xe', routes.length], ['Chuyến xe', trips.length], ['Điểm dừng', stops.length], ['Chỗ đang giữ', trips.reduce((sum, trip) => sum + trip.booked, 0)]].map(([label, value]) => <article className="metric-card" key={label}><div className="metric-top">{label}</div><strong className="metric-value">{value}</strong></article>)}
      </section> : null}
      {page === 'routes' ? <>
        <section className="route-grid">{routes.map(route => <article className="panel route-card" key={route.routeId}>
          <span className="route-code">{route.routeCode}</span><h2>{route.name}</h2>
          <div className="stop-list">{route.stops.map((stop, index) => <div className="stop" key={stop.stopId}><span className={`stop-dot ${index === 0 ? 'start' : index === route.stops.length - 1 ? 'end' : ''}`} /><span>{stop.name}<small> · +{stop.offsetMinutes} phút</small></span></div>)}</div>
        </article>)}</section>
        {!routes.length ? <section className="panel users-message">Chưa có tuyến xe.</section> : null}
        <section className="panel stop-directory"><h2>Điểm dừng</h2>{stops.length ? stops.map(stop => <div key={stop.stopId}><strong>{stop.name}</strong><small>{stop.stopCode} · {stop.address}</small></div>) : <p>Chưa có điểm dừng.</p>}</section>
      </> : <WeeklyTripCalendar trips={trips} week={week} setWeek={setWeek} busy={busy} error={error} onToggle={trip => { void toggle(trip) }} />}
    </> : null}

    {form ? <Modal title={form === 'stop' ? 'Thêm điểm dừng' : form === 'route' ? 'Tạo tuyến' : 'Tạo chuyến'} busy={busy} onClose={close}>
      {form === 'trip' ? <TripCreateForm routes={routes} vehicles={vehicles} staff={staff} write={write} onBusy={setBusy} onClose={close} onCreated={created => { setForm(null); if (created[0]) setWeek(startOfWeek(created[0].date)); setNotice(`Đã tạo ${created.length} chuyến`); setAttempt(value => value + 1) }} /> : <form onSubmit={submit}>
        <fieldset disabled={busy} className="operation-fields">
          {form === 'stop' ? <>
            <label>Mã điểm dừng<input required pattern="[A-Za-z0-9_-]+" maxLength={60} value={newStop.stopCode} onChange={event => setNewStop({ ...newStop, stopCode: event.target.value })} /></label>
            <label>Tên điểm dừng<input required maxLength={150} value={newStop.name} onChange={event => setNewStop({ ...newStop, name: event.target.value })} /></label>
            <label>Địa chỉ<input required maxLength={300} value={newStop.address} onChange={event => setNewStop({ ...newStop, address: event.target.value })} /></label>
          </> : form === 'route' ? <>
            <label>Mã tuyến<input required pattern="[A-Za-z0-9_-]+" maxLength={60} value={newRoute.routeCode} onChange={event => setNewRoute({ ...newRoute, routeCode: event.target.value })} /></label>
            <label>Tên tuyến<input required maxLength={150} value={newRoute.name} onChange={event => setNewRoute({ ...newRoute, name: event.target.value })} /></label>
            {points.map((point, index) => <div className="route-point" key={index}>
              <label>Điểm {index + 1}<select required value={point.stopId} onChange={event => changePoint(index, { stopId: event.target.value })}><option value="">Chọn điểm dừng</option>{stops.filter(stop => String(stop.stopId) === point.stopId || !points.some(p => p.stopId === String(stop.stopId))).map(stop => <option key={stop.stopId} value={stop.stopId}>{stop.name}</option>)}</select></label>
              <label>Phút từ điểm đầu<input type="number" required min={index === 0 ? 0 : points[index - 1].offsetMinutes + 1} max={1440} readOnly={index === 0} value={point.offsetMinutes} onChange={event => changePoint(index, { offsetMinutes: Number(event.target.value) })} /></label>
              <div className="point-actions"><button type="button" aria-label={`Đưa điểm ${index + 1} lên`} disabled={index === 0} onClick={() => movePoint(index, -1)}>↑</button><button type="button" aria-label={`Đưa điểm ${index + 1} xuống`} disabled={index === points.length - 1} onClick={() => movePoint(index, 1)}>↓</button><button type="button" aria-label={`Xóa điểm ${index + 1}`} disabled={points.length <= 2} onClick={() => setPoints(current => current.filter((_, i) => i !== index).map((p, i) => i === 0 ? { ...p, offsetMinutes: 0 } : p))}>×</button></div>
            </div>)}
            <button type="button" className="secondary-button" disabled={points.length >= 30 || points.length >= stops.length} onClick={() => setPoints(current => [...current, { stopId: '', offsetMinutes: current[current.length - 1].offsetMinutes + 30 }])}>Thêm điểm</button>
          </> : null}
        </fieldset>
        {formError ? <p role="alert" className="operation-error">{formError}</p> : null}
        <div className="modal-actions"><button type="button" className="secondary-button" disabled={busy} onClick={close}>Hủy</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button></div>
      </form>}
    </Modal> : null}
  </>
}
