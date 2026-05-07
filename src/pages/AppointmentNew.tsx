import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import { DURATION_OPTIONS } from '../types'
import { today } from '../utils/dates'

const SOURCES = [
  { key: 'walkin', label: 'Walk-in' },
  { key: 'treatwell', label: 'Treatwell' },
  { key: 'phone', label: 'Phone' },
]

export default function AppointmentNew() {
  const { user } = useAuth()
  const { salon, salonUser } = useSalon()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [date, setDate] = useState(params.get('date') || today())
  const [time, setTime] = useState(params.get('time') || '09:00')
  const [duration, setDuration] = useState(60)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [service, setService] = useState('')
  const [source, setSource] = useState('walkin')
  const [staff, setStaff] = useState(salonUser?.full_name || '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !salon) return
    setLoading(true); setError('')
    const { error: err } = await supabase.from('appointments').insert({
      date, time, duration,
      client_name: clientName,
      client_phone: clientPhone || null,
      service, source,
      staff: staff || null,
      notes: notes || null,
      status: 'upcoming',
      user_id: user.id,
      salon_id: salon.id,
    })
    if (err) { setError(err.message); setLoading(false); return }
    navigate(`/diary?date=${date}`)
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" required value={time} onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white">
            {DURATION_OPTIONS.map(d => (
              <option key={d} value={d}>{d >= 60 ? `${d / 60}h${d % 60 > 0 ? ` ${d % 60}m` : ''}` : `${d}m`}</option>
            ))}
          </select>
        </div>

        {/* Client */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+353..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        {/* Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <input type="text" required value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Haircut & Colour"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Booking Source</label>
          <div className="flex gap-2">
            {SOURCES.map(s => (
              <button key={s.key} type="button" onClick={() => setSource(s.key)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                  source === s.key
                    ? s.key === 'walkin' ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : s.key === 'treatwell' ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
            <input type="text" value={staff} onChange={e => setStaff(e.target.value)} placeholder="Optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            {loading ? 'Saving…' : 'Save Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
