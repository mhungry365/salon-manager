import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

function CompleteProfile({ user, onComplete }: { user: any; onComplete: () => void }) {
  const [salonName, setSalonName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data: salonData, error: salonErr } = await supabase
        .from('salons')
        .insert({ name: salonName, email: user.email, status: 'active', owner_id: user.id })
        .select()
        .single()
      if (salonErr) throw salonErr

      const { error: suErr } = await supabase.from('salon_users').insert({
        salon_id: salonData.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        full_name: fullName,
        email: user.email,
      })
      if (suErr) throw suErr

      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Profile</h2>
        <p className="text-sm text-gray-500 mb-4">You're logged in, but we need to create your salon to continue.</p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name</label>
            <input type="text" required value={salonName} onChange={e => setSalonName(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
          </div>
          <button disabled={loading} className="w-full bg-pink-500 text-white font-medium py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-60">{loading ? 'Creating...' : 'Create Salon'}</button>
        </form>
      </div>
    </div>
  )
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const { salon, salonUser, loading: salonLoading, refreshSalon } = useSalon()

  if (authLoading || salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // No salon record at all → allow user to create one!
  if (!salonUser) {
    return <CompleteProfile user={session.user} onComplete={refreshSalon} />
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
