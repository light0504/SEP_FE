import { useState } from 'react'
import AdminPasswordForm from './components/auth/AdminPasswordForm'
import logo from './assets/logo.png'
import './styles/adminLogin.css'

export default function AdminLoginScreen({ onLogin, notice }: { onLogin: (username: string, password: string) => Promise<void>; notice?: string }) {
  const [method, setMethod] = useState<'google' | 'password'>('google')
  const [googleMessage, setGoogleMessage] = useState('')

  return <main className="portal-login-page">
    <div className="portal-login-shell">
      <section className="portal-login-hero" aria-label="FPT University Fbus">
        <div className="portal-login-shape portal-login-shape-top" aria-hidden="true" />
        <div className="portal-login-shape portal-login-shape-left" aria-hidden="true" />
        <div className="portal-login-shape portal-login-shape-right" aria-hidden="true" />
        <div className="portal-login-shape portal-login-shape-bottom" aria-hidden="true" />
        <div className="portal-login-identity">
          <img className="portal-login-logo" src={logo} alt="FPT University" width={120} height={120} />
          <p className="portal-login-university">FPT University</p>
          <p className="portal-login-product">Fbus</p>
        </div>
      </section>

      <section className="portal-login-sheet" aria-labelledby="portal-login-title">
        {notice ? <div className="portal-login-message portal-login-error" role="alert">{notice}</div> : null}
        {method === 'google' ? <>
          <h1 id="portal-login-title">Đăng nhập</h1>
          <button className="portal-login-google" type="button" onClick={() => setGoogleMessage('Google chưa khả dụng.')}>
            <span className="portal-login-google-icon" aria-hidden="true">G</span>
            <span>Đăng nhập bằng Google</span>
          </button>
          {googleMessage ? <p className="portal-login-message portal-login-info" role="status">{googleMessage}</p> : null}
          <div className="portal-login-or"><span />HOẶC<span /></div>
          <button className="portal-login-password-link" type="button" onClick={() => { setGoogleMessage(''); setMethod('password') }}>
            Dùng tài khoản / mật khẩu <span>Tạm thời</span>
          </button>
        </> : <AdminPasswordForm onLogin={onLogin} onBack={() => setMethod('google')} />}
      </section>
    </div>
  </main>
}
