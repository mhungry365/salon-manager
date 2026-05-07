import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSalon } from '../contexts/SalonContext'

export default function Settings() {
  const { salon, refreshSalon } = useSalon()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (salon) {
      setName(salon.name)
      setPhone(salon.phone || '')
      setAddress(salon.address || '')
    }
  }, [salon])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!salon) return
    setLoading(true); setError('')
    const { error: err } = await supabase
      .from('salons')
      .update({ name, phone: phone || null, address: address || null })
      .eq('id', salon.id)
    if (err) setError(err.message)
    else {
      await refreshSalon()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Salon Settings</h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={18} /> Settings saved.
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {salon && (
        <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Staff Invite Code</h2>
          <p className="text-xs text-gray-500 mb-2">Share this code with staff members so they can join your salon:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 break-all">{salon.id}</code>
            <button
              onClick={() => navigator.clipboard.writeText(salon.id)}
              className="shrink-0 text-xs bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
