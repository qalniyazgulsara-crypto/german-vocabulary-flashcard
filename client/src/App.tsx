import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import CategoryPage from './pages/CategoryPage'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const location = useLocation()
  const inAuth = location.pathname.startsWith('/auth')
  return (
    <Layout showActions={!inAuth}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/category/:id"
          element={
            <PrivateRoute>
              <CategoryPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
