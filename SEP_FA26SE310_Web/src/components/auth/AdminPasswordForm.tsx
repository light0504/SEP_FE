import { useRef, useState, type FormEvent } from 'react'

interface Props {
  onLogin: (username: string, password: string) => Promise<void>
  onBack: () => void
}

export default function AdminPasswordForm({ onLogin, onBack }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (!username.trim() || !password) {
      setError('Nhập tài khoản và mật khẩu.')
      return
    }
    submitting.current = true
    setError('')
    setBusy(true)
    try {
      await onLogin(username.trim(), password)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <form className="portal-login-password-form" onSubmit={submit}>
    <button className="portal-login-back" type="button" onClick={onBack} disabled={busy}><span aria-hidden="true">‹</span> Quay lại</button>
    <h1 id="portal-login-title">Đăng nhập tài khoản</h1>
    <label className="portal-login-label" htmlFor="admin-username">TÊN ĐĂNG NHẬP HOẶC EMAIL</label>
    <input className="portal-login-input" id="admin-username" autoComplete="username" autoCapitalize="none" autoCorrect="off" autoFocus required disabled={busy} value={username} onChange={event => setUsername(event.target.value)} placeholder="username / email" />
    <label className="portal-login-label" htmlFor="admin-password">MẬT KHẨU</label>
    <div className="portal-login-password-control">
      <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu" />
      <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} disabled={busy} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
    </div>
    {error ? <div className="portal-login-message portal-login-error" role="alert">{error}</div> : null}
    <button className="portal-login-submit" type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Đang xác thực…' : 'Đăng nhập'}</button>
  </form>
}
