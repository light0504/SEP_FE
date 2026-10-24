import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Page } from './types'
import OperationsPage from './pages/OperationsPage'
import AdminLoginScreen from './AdminLoginScreen'
import { loginAdmin, logoutAdmin, refreshAdminSession, type AdminSession } from './services/auth'
import { createAdminDownload, createAdminGet, createAdminWrite } from './services/apiClient'
import UsersPage from './pages/UsersPage'
import VehiclesPage from './pages/VehiclesPage'

const nav: { id: Page; icon: string; label: string }[] = [
  { id: 'overview', icon: '▦', label: 'Tổng quan' },
  { id: 'trips', icon: '↔', label: 'Quản lý chuyến xe' },
  { id: 'routes', icon: '⌖', label: 'Tuyến & điểm dừng' },
  { id: 'vehicles', icon: '▣', label: 'Quản lý xe' },
  { id: 'users', icon: '♙', label: 'Người dùng' },
  { id: 'reports', icon: '▥', label: 'Báo cáo' },
]


export default function App() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const sessionRef = useRef<AdminSession | null>(null)
  const refreshRef = useRef<Promise<AdminSession> | null>(null)
  const signingOutRef = useRef(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutWarning, setLogoutWarning] = useState('')
  const [page, setPage] = useState<Page>('overview')
  const [mobileNav, setMobileNav] = useState(false)

  const updateAdminSession = useCallback((session: AdminSession | null) => {
    sessionRef.current = session
    setAdminSession(session)
  }, [])

  const refreshSession = useCallback((): Promise<AdminSession> => {
    const current = sessionRef.current
    if (!current || signingOutRef.current) return Promise.reject(new Error('Phiên đăng nhập không khả dụng. Vui lòng đăng nhập lại.'))
    if (refreshRef.current) return refreshRef.current
    const pending = refreshAdminSession(current).then(session => {
      if (sessionRef.current !== current) throw new Error('Phiên đăng nhập đã thay đổi.')
      updateAdminSession(session)
      return session
    }).finally(() => {
      if (refreshRef.current === pending) refreshRef.current = null
    })
    refreshRef.current = pending
    return pending
  }, [updateAdminSession])

  const apiGet = useMemo(() => createAdminGet(() => sessionRef.current, refreshSession), [refreshSession])
  const apiWrite = useMemo(() => createAdminWrite(() => sessionRef.current, refreshSession), [refreshSession])
  const apiDownload = useMemo(() => createAdminDownload(() => sessionRef.current, refreshSession), [refreshSession])

  useEffect(() => {
    if (!adminSession?.expiresAt || isSigningOut) return
    let cancelled = false
    const refreshIn = Math.max(0, adminSession.expiresAt - Date.now() - 60_000)
    const timer = window.setTimeout(() => {
      if (signingOutRef.current) return
      void refreshSession().catch(() => {
        if (!cancelled && !signingOutRef.current && sessionRef.current === adminSession) updateAdminSession(null)
      })
    }, refreshIn)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [adminSession, isSigningOut, refreshSession, updateAdminSession])

  async function handleSignOut() {
    const original = sessionRef.current
    if (!original || signingOutRef.current) return
    signingOutRef.current = true
    setIsSigningOut(true)
    setLogoutWarning('')
    try {
      const pending = refreshRef.current
      const session = pending ? await pending.catch(() => original) : original
      await logoutAdmin(session)
    } catch {
      setLogoutWarning('Đã thoát trên thiết bị. Máy chủ chưa xác nhận đăng xuất.')
    } finally {
      updateAdminSession(null)
      refreshRef.current = null
      setPage('overview')
      setMobileNav(false)
      signingOutRef.current = false
      setIsSigningOut(false)
    }
  }

  if (!adminSession) return <AdminLoginScreen notice={logoutWarning} onLogin={async (username, password) => { setLogoutWarning(''); updateAdminSession(await loginAdmin(username, password)) }} />

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('overview') }}><span className="brand-mark">S</span><span>Seat<span className="brand-light">Chain</span></span></a>

      <div className="workspace"><span className="workspace-dot" /> FU HCM ↔ FU Tân Uyên </div>

      <nav>{nav.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'selected' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false) }}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-row"><div className="avatar">AD</div><div><strong>{adminSession.fullName}</strong><small>{adminSession.email}</small></div></div></div>
    </aside>
    {mobileNav && <button className="backdrop" aria-label="Đóng menu" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}>☰</button><div className="breadcrumbs">FU HCM ↔ FU Tân Uyên <span>/</span> <strong>{nav.find((item) => item.id === page)?.label}</strong></div><div className="top-actions"><div className="top-avatar">AD</div><button className="signout-button" disabled={isSigningOut} aria-busy={isSigningOut} onClick={() => { void handleSignOut() }}>{isSigningOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div></header>
      <div className="content">
        <div className="page-heading"><h1>{nav.find(item => item.id === page)?.label}</h1></div>
        {page === 'users' ? <UsersPage request={apiGet} write={apiWrite} download={apiDownload} /> : page === 'vehicles' ? <VehiclesPage request={apiGet} write={apiWrite} /> : <OperationsPage page={page} request={apiGet} write={apiWrite} />}
      </div>
    </main>
  </div>
}
