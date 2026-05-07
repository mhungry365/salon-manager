import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function StaffInvite() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // Verify the invite code (salon_id) exists
      const { data: salon, error: salonErr } = await supabase
        .from('salons')
        .select('id, name, status')
        .eq('id', inviteCode.trim())
        .single()
      if (salonErr || !salon) throw new Error('Invalid invite code. Please check with your salon manager.')
      if ((salon as any).status === 'suspended') throw new Error('This salon account is suspended.')

      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr) throw authErr
      const userId = authData.user?.id
      if (!userId) throw new Error('Failed to create account')

      // Create salon_users record (staff, pending)
      const { error: suErr } = await supabase.from('salon_users').insert({
        salon_id: (salon as any).id,
        user_id: userId,
        role: 'staff',
        status: 'pending',
        full_name: fullName,
        email,
      })
      if (suErr) throw suErr

      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-yellow-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account is pending approval from your salon manager. You will be notified once approved.
          </p>
          <Link to="/login" className="block w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm text-center">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
            <Scissors className="text-pink-500" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Your Salon</h1>
          <p className="text-gray-500 text-sm mt-1">Use the invite code from your manager</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
            <input type="text" required value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Paste your invite code"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <p className="text-xs text-gray-400 mt-1">Get this from your salon owner or manager</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            {loading ? 'Creating account…' : 'Request to Join'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-pink-500 hover:text-pink-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
