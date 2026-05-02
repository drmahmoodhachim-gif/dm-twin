import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { AuthPage } from './pages/AuthPage'
import { ClinicPage } from './pages/ClinicPage'
import { MePage } from './pages/MePage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ResearchPage } from './pages/ResearchPage'
import { TermsPage } from './pages/TermsPage'
import './App.css'

function DefaultRedirect() {
  const { role, session, loading } = useAuth()
  if (loading) return <main className="auth-page">Loading...</main>
  if (!session) return <Navigate to="/auth" replace />

  if (role === 'researcher' || role === 'admin') return <Navigate to="/research" replace />
  if (role === 'clinician') return <Navigate to="/clinic" replace />
  return <Navigate to="/me" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/research"
        element={
          <ProtectedRoute roles={['researcher', 'admin']}>
            <AppLayout>
              <ResearchPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clinic"
        element={
          <ProtectedRoute roles={['clinician', 'admin']}>
            <AppLayout>
              <ClinicPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/me"
        element={
          <ProtectedRoute roles={['patient', 'admin']}>
            <AppLayout>
              <MePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <AppLayout>
            <PrivacyPage />
          </AppLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <AppLayout>
            <TermsPage />
          </AppLayout>
        }
      />
      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
