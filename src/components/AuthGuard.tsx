import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const { salon, salonUser, loading: salonLoading } = useSalon()

  if (authLoading || salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // No salon record at all → shouldn't happen in normal flow
  if (!salonUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <p className="text-gray-600 text-sm">No salon linked to this account. Contact support.</p>
        </div>
      </div>
    )
  }

  // Staff account pending approval
  if (salonUser.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Awaiting Approval</h2>
          <p className="text-gray-500 text-sm">Your account is pending approval from your salon manager.</p>
        </div>
      </div>
    )
  }

  // Salon suspended
  if (salon?.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-500 text-sm">Your account has been suspended. Contact support.</p>
        </div>
      </div>
    )
  }

  // Salon pending (owner waiting for super-admin approval)
  if (salon?.status === 'pending' && salonUser.role === 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Registration Received</h2>
          <p className="text-gray-500 text-sm">Your salon has been registered. You will receive an email once your account is approved.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
