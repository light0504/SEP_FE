import { useMemo, useState } from 'react'
import type { ApiTrip } from '../types/transport'
import { addDays, dateLabel, startOfWeek, todayVN, weekdays } from '../utils/calendar'
import Modal from './Modal'

export default function WeeklyTripCalendar({ trips, week, setWeek, busy, error, onToggle }: {
  trips: ApiTrip[]; week: string; setWeek: (week: string) => void; busy: boolean; error: string; onToggle: (trip: ApiTrip) => void;
}) {
  const [cell, setCell] = useState<{ date: string; slot: number } | null>(null)
  const [query, setQuery] = useState('')
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index))
  const filtered = useMemo(() => trips.filter(trip => `${trip.tripCode} ${trip.routeName} ${trip.vehicle} ${trip.driver} ${trip.busAttendant || ''}`.toLowerCase().includes(query.toLowerCase())), [trips, query])
  const matches = (date: string, slot: number) => filtered.filter(trip => trip.date === date && trip.slot === slot).sort((a, b) => a.time.localeCompare(b.time))
  const details = cell ? matches(cell.date, cell.slot) : []
  return <section className="panel weekly-calendar">
    <div className="week-toolbar">
      <div className="week-navigation"><button className="secondary-button" aria-label="Tuần trước" onClick={() => setWeek(addDays(week, -7))}>‹</button><button className="secondary-button" onClick={() => setWeek(startOfWeek(todayVN()))}>Tuần này</button><button className="secondary-button" aria-label="Tuần sau" onClick={() => setWeek(addDays(week, 7))}>›</button></div>
      <strong>{dateLabel(week)} – {dateLabel(days[6])}</strong>
      <input type="date" aria-label="Chọn tuần" value={week} onChange={event => { if (event.target.value) setWeek(startOfWeek(event.target.value)) }} />
    </div>
    <div className="table-tools"><label className="search-box"><input aria-label="Tìm chuyến trong lịch" placeholder="Tìm tuyến, biển số, nhân sự…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="table-scroll"><table className="week-table"><caption className="users-sr-only">Số chuyến theo ngày và slot trong tuần</caption><thead><tr><th scope="col">SLOT</th>{days.map((day, index) => <th key={day} scope="col" className={day === todayVN() ? 'current-day' : ''}>{weekdays[index]}<small>{dateLabel(day).slice(0, 5)}</small></th>)}</tr></thead><tbody>
      {[1, 2, 3, 4, 5, 6].map(slot => <tr key={slot}><th scope="row">Slot {slot}</th>{days.map(day => {
        const items = matches(day, slot), paused = items.filter(item => item.status === 'PAUSED').length
        return <td key={day} className={day === todayVN() ? 'current-day' : ''}><button className={`calendar-slot ${items.length ? 'has-trips' : ''}`} disabled={!items.length} aria-label={`${dateLabel(day)}, slot ${slot}, ${items.length} chuyến`} onClick={() => setCell({ date: day, slot })}><strong>{items.length ? `${items.length} chuyến` : '—'}</strong>{paused ? <small>{paused} tạm dừng</small> : null}</button></td>
      })}</tr>)}
    </tbody></table></div>
    {cell ? <Modal title={`${dateLabel(cell.date)} · Slot ${cell.slot}`} busy={busy} onClose={() => setCell(null)}>
      {error ? <p role="alert" className="operation-error">{error}</p> : null}
      <div className="trip-details-list">{details.map(trip => <article key={trip.tripId} className="trip-detail-card">
        <h3>{trip.routeName}</h3><p className="trip-code">{trip.tripCode}</p>
        <dl className="vehicle-summary"><div><dt>Giờ</dt><dd>{trip.time} → {trip.arrivalTime}</dd></div><div><dt>Xe</dt><dd>{trip.vehicle}</dd></div><div><dt>Tài xế</dt><dd>{trip.driver}</dd></div><div><dt>Bus attendant</dt><dd>{trip.busAttendant || 'Chưa phân công'}</dd></div><div><dt>Chỗ đặt</dt><dd>{trip.booked}/{trip.capacity}</dd></div><div><dt>Trạng thái</dt><dd>{trip.status === 'PAUSED' ? 'Tạm dừng' : 'Đang mở'}</dd></div></dl>
        <ol className="trip-stop-details">{trip.stops.map(stop => <li key={stop.tripStopId}><span>{stop.name}</span><time>{stop.arrivalAt.slice(11, 16)}</time></li>)}</ol>
        <button className="secondary-button" disabled={busy} onClick={() => onToggle(trip)}>{trip.status === 'PAUSED' ? 'Mở chuyến' : 'Tạm dừng'}</button>
      </article>)}{!details.length ? <p>Không có chuyến phù hợp.</p> : null}</div>
    </Modal> : null}
  </section>
}
