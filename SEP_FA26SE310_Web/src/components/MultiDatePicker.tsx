import { useState } from 'react'
import { dateLabel, shiftMonth, todayVN, weekdays } from '../utils/calendar'

export default function MultiDatePicker({ value, onChange }: { value: string[]; onChange: (dates: string[]) => void }) {
  const today = todayVN()
  const [month, setMonth] = useState((value[0] || today).slice(0, 7))
  const shown = month < today.slice(0, 7) ? today.slice(0, 7) : month
  const date = new Date(`${shown}-01T00:00:00Z`)
  const leading = (date.getUTCDay() + 6) % 7
  const days = new Date(`${shiftMonth(shown, 1)}-01T00:00:00Z`)
  days.setUTCDate(0)
  const cells = Array.from({ length: Math.ceil((leading + days.getUTCDate()) / 7) * 7 }, (_, index) => index - leading + 1)
  const toggle = (date: string) => onChange(value.includes(date) ? value.filter(item => item !== date) : [...value, date].sort())
  return <div className="multi-date-picker">
    <div className="month-navigation"><button type="button" aria-label="Tháng trước" disabled={shown <= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(shown, -1))}>‹</button><strong>Tháng {Number(shown.slice(5))}, {shown.slice(0, 4)}</strong><button type="button" aria-label="Tháng sau" onClick={() => setMonth(shiftMonth(shown, 1))}>›</button></div>
    <div className="month-grid">{weekdays.map(day => <span className="weekday" key={day}>{day}</span>)}{cells.map((day, index) => {
      const key = `${shown}-${String(day).padStart(2, '0')}`
      if (day < 1 || day > days.getUTCDate() || key < today) return <span key={`blank-${index}`} />
      const selected = value.includes(key)
      return <button type="button" key={key} aria-label={dateLabel(key)} aria-pressed={selected} disabled={!selected && value.length >= 90} className={selected ? 'day selected' : 'day'} onClick={() => toggle(key)}>{day}</button>
    })}</div>
    <div className="selected-dates-heading"><strong>{value.length} ngày</strong><button type="button" className="text-button" disabled={!value.length} onClick={() => onChange([])}>Bỏ chọn</button></div>
    <div className="selected-dates">{value.map(date => <button type="button" key={date} aria-label={`Bỏ ngày ${dateLabel(date)}`} onClick={() => toggle(date)}>{dateLabel(date)} ×</button>)}</div>
  </div>
}
