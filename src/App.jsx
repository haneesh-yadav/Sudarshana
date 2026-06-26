import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Home from './pages/Home'
import ThreadsPage from './pages/Threads'
import SecurityPosturePage from './pages/SecurityPosture'
import ReportsPage from './pages/Reports'
import AuditLogsPage from './pages/AuditLogs'
import LandingPage from './components/Main'
import OauthCallback from './auth/OauthCallback'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Toast from './components/Toast'
import './App.css'

/**
 * App.jsx
 * Centralized layout with react-router-dom URL-based routing.
 */

function Layout({ children, title }) {
  const scrollRef = useRef(null)
  const [fadeTop, setFadeTop] = useState(false)
  const [fadeBottom, setFadeBottom] = useState(false)
  const location = useLocation()

  const updateFade = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    setFadeTop(scrollTop > 4)
    setFadeBottom(scrollTop + clientHeight < scrollHeight - 4)
  }

  // Reset scroll to top on page change, and recompute fade state whenever
  // the page's content changes size (e.g. a drawer opening doesn't affect
  // this, but switching pages does).
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
    updateFade()
  }, [location.pathname])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => updateFade())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    document.body.classList.add('dashboard-active')
    return () => {
      document.body.classList.remove('dashboard-active')
    }
  }, [])

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar title={title} />
        <div
          className={
            "page-content" +
            (fadeTop ? " has-fade-top" : "") +
            (fadeBottom ? " has-fade-bottom" : "")
          }
          ref={scrollRef}
          onScroll={updateFade}
        >
          {children}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toast />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<ProtectedRoute><Layout title="Dashboard"><Home /></Layout></ProtectedRoute>} />
          <Route path="/threads" element={<ProtectedRoute><Layout title="Threads"><ThreadsPage /></Layout></ProtectedRoute>} />
          <Route path="/security-posture" element={<ProtectedRoute><Layout title="Security Posture"><SecurityPosturePage /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout title="Reports"><ReportsPage /></Layout></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><Layout title="Audit Logs"><AuditLogsPage /></Layout></ProtectedRoute>} />
          <Route path="/oauth/callback" element={<OauthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App