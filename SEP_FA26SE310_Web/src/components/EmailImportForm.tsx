import { useRef, useState, type FormEvent } from 'react'
import type { AdminWrite } from '../services/apiClient'
import type { EmailImportResult } from '../types/emailAccess'

export default function EmailImportForm({ write, onBusy, onImported, onClose }: {
  write: AdminWrite; onBusy: (busy: boolean) => void; onImported: () => void; onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<EmailImportResult | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || !file) return
    if (!/\.(xlsx|xls)$/i.test(file.name)) { setError('Chọn tệp .xlsx hoặc .xls.'); return }
    if (file.size === 0 || file.size > 2 * 1024 * 1024) { setError('Tệp Excel phải từ 1 byte đến 2 MB.'); return }
    savingRef.current = true; setSaving(true); onBusy(true); setError('')
    try {
      const body = new FormData(); body.append('file', file)
      const imported = await write<EmailImportResult>('POST', '/admin/email-access/import', body)
      setResult(imported); onImported()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể nhập email.') }
    finally { savingRef.current = false; setSaving(false); onBusy(false) }
  }

  return result ? <div>
    <p role="status" className="email-import-summary">Đã thêm <strong>{result.imported}</strong> · Bỏ qua <strong>{result.skipped}</strong> · Lỗi <strong>{result.failed}</strong> / {result.totalRows} dòng</p>
    {result.errors.length ? <div className="table-scroll email-import-errors" tabIndex={0} role="region" aria-label="Các dòng lỗi"><table>
      <thead><tr><th scope="col">Dòng</th><th scope="col">Email</th><th scope="col">Lỗi</th></tr></thead>
      <tbody>{result.errors.map(item => <tr key={item.row}><td>{item.row}</td><td>{item.email || '—'}</td><td>{item.message}</td></tr>)}</tbody>
    </table></div> : null}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { setResult(null); setFile(null) }}>Nhập tệp khác</button><button type="button" className="primary-button" onClick={onClose}>Đóng</button></div>
  </div> : <form onSubmit={submit}>
    <fieldset className="operation-fields" disabled={saving}>
      <label>Tệp Excel<input type="file" required accept=".xlsx,.xls" onChange={event => { setFile(event.target.files?.[0] ?? null); setError('') }} /></label>
      <p className="email-import-limit">.xlsx, .xls · Tối đa 2 MB / 2.000 dòng</p>
    </fieldset>
    {error ? <p role="alert" className="operation-error">{error}</p> : null}
    <div className="modal-actions"><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Hủy</button><button type="submit" className="primary-button" disabled={saving || !file}>{saving ? 'Đang nhập…' : 'Nhập email'}</button></div>
  </form>
}
