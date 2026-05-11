import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { SalonProvider } from './contexts/SalonContext'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import StaffInvite from './pages/StaffInvite'
import Dashboard from './pages/Dashboard'
import LogSale from './pages/LogSale'
import Expenses from './pages/Expenses'
import History from './pages/History'
import Reports from './pages/Reports'
import Diary from './pages/Diary'
import AppointmentNew from './pages/AppointmentNew'
import AppointmentDetail from './pages/AppointmentDetail'
import StaffManagement from './pages/StaffManagement'
import Settings from './pages/Settings'
import Clients from './pages/Clients'
import Services from './pages/Services'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SalonProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/staff/invite" element={<StaffInvite />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/diary" element={<ProtectedLayout><Diary /></ProtectedLayout>} />
            <Route path="/appointments/new" element={<ProtectedLayout><AppointmentNew /></ProtectedLayout>} />
            <Route path="/appointments/:id" element={<ProtectedLayout><AppointmentDetail /></ProtectedLayout>} />
            <Route path="/log" element={<ProtectedLayout><LogSale /></ProtectedLayout>} />
            <Route path="/expenses" element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
            <Route path="/history" element={<ProtectedLayout><History /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
            <Route path="/staff" element={<ProtectedLayout><StaffManagement /></ProtectedLayout>} />
            <Route path="/clients" element={<ProtectedLayout><Clients /></ProtectedLayout>} />
            <Route path="/services" element={<ProtectedLayout><Services /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SalonProvider>
    </AuthProvider>
  </QueryClientProvider>
  )
}
