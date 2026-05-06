import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LogSale from './pages/LogSale'
import Expenses from './pages/Expenses'
import History from './pages/History'
import Reports from './pages/Reports'
import Diary from './pages/Diary'
import AppointmentNew from './pages/AppointmentNew'
import AppointmentDetail from './pages/AppointmentDetail'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/diary" element={<ProtectedLayout><Diary /></ProtectedLayout>} />
          <Route path="/appointments/new" element={<ProtectedLayout><AppointmentNew /></ProtectedLayout>} />
          <Route path="/appointments/:id" element={<ProtectedLayout><AppointmentDetail /></ProtectedLayout>} />
          <Route path="/log" element={<ProtectedLayout><LogSale /></ProtectedLayout>} />
          <Route path="/expenses" element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
          <Route path="/history" element={<ProtectedLayout><History /></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
