import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trash2, CheckCircle, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import type { Appointment } from '../types'
import {
  STATUS_LABELS, APPOINTMENT_STATUSES, DURATION_OPTIONS,
  PAYMENT_LABELS,
} from '../types'
const SOURCE_LABELS: Record<string, string> = {
  walkin: 'Walk-in', treatwell: 'Treatwell', phone: 'Phone',
}

const PAYMENTS = [
  { key: 'cash', label: 'Cash' },
  { key: 'revolut', label: 'Revolut' },
  { key: 'tw_prepaid', label: 'TW Prepaid' },
  { key: 'tw_card', label: 'TW Card' },
]

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = Number(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  return `${hour % 12 || 12}:${m}${ampm}`
}

function formatDuration(d: number) {
  if (d < 60) return `${d}m`
  return d % 60 === 0 ? `${d / 60}h` : `${Math.floor(d / 60)}h ${d % 60}m`
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { salon } = useSalon()
  const navigate = useNavigate()

  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // edit state
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [service, setService] = useState('')
  const [source, setSource] = useState('walkin')
  const [staff, setStaff] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('upcoming')

  // conversion state
  const [showConvert, setShowConvert] = useState(false)
  const [convertAmount, setConvertAmount] = useState('')
  const [convertTip, setConvertTip] = useState('')
  const [convertPayment, setConvertPayment] = useState('cash')
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id || !salon) return
      const { data } = await supabase.from('appointments').select('*').eq('id', id).eq('salon_id', salon.id).single()
      if (data) {
        const a = data as Appointment
        setAppt(a)
        setDate(a.date); setTime(a.time); setDuration(a.duration)
        setClientName(a.client_name); setClientPhone(a.client_phone || '')
        setService(a.service); setSource(a.source)
        setStaff(a.staff || ''); setNotes(a.notes || '')
        setStatus(a.status)
      }
      setLoading(false)
    }
    load()
  }, [id, salon])

  const save = async () => {
    if (!id) return
    setSaving(true); setError('')
    const { error: err } = await supabase.from('appointments').update({
      date, time, duration,
      client_name: clientName,
      client_phone: clientPhone || null,
      service, source,
      staff: staff || null,
      notes: notes || null,
      status,
    }).eq('id', id)
    if (err) setError(err.message)
    else { setSuccess('Saved'); setAppt(a => a ? { ...a, date, time, duration, client_name: clientName, client_phone: clientPhone || null, service, source, staff: staff || null, notes: notes || null, status } : a); setTimeout(() => setSuccess(''), 2000) }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this appointment?')) return
    await supabase.from('appointments').delete().eq('id', id)
    navigate(`/diary?date=${date}`)
  }

  const handleConvert = async () => {
    if (!id || !user || !appt || !salon) return
    setConverting(true); setError('')
    const { data: rev, error: revErr } = await supabase.from('revenue_entries').insert({
      date: appt.date,
      source: appt.source,
      service: appt.service,
      amount: Number(convertAmount),
      tip: Number(convertTip) || 0,
      tip_payment: null,
      payment: convertPayment,
      staff: appt.staff || null,
      notes: `Converted from appointment: ${appt.client_name}`,
      user_id: user.id,
      salon_id: salon.id,
    }).select().single()
    if (revErr) { setError(revErr.message); setConverting(false); return }
    await supabase.from('appointments').update({ revenue_entry_id: (rev as any).id, status: 'completed' }).eq('id', id)
    setAppt(a => a ? { ...a, revenue_entry_id: (rev as any).id, status: 'completed' } : a)
    setStatus('completed')
    setShowConvert(false)
    setSuccess('Revenue entry created and appointment marked complete!')
    setTimeout(() => setSuccess(''), 4000)
    setConverting(false)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>
  if (!appt) return <div className="text-gray-500 text-sm py-10 text-center">Appointment not found.</div>

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/diary?date=${appt.date}`)} className="text-gray-500 hover:text-gray-700 text-sm">← Diary</button>
          <h1 className="text-2xl font-bold text-gray-900">Appointment</h1>
        </div>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-600 transition-colors p-2">
          <Trash2 size={18} />
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Revenue linked badge */}
      {appt.revenue_entry_id && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
          <CheckCircle size={16} /> Revenue logged
          <a href={`/history`} className="ml-auto flex items-center gap-1 text-green-600 hover:underline text-xs">
            View in History <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {APPOINTMENT_STATUSES.map(s => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  status === s
                    ? s === 'upcoming' ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : s === 'completed' ? 'border-green-500 bg-green-50 text-green-700'
                      : s === 'no_show' ? 'border-gray-400 bg-gray-100 text-gray-600'
                      : 'border-red-400 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white">
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{formatDuration(d)}</option>)}
            </select>
          </div>
        </div>

        {/* Client */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        {/* Service & Source */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <input type="text" value={service} onChange={e => setService(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select value={source} onChange={e => setSource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white">
              <option value="walkin">Walk-in</option>
              <option value="treatwell">Treatwell</option>
              <option value="phone">Phone</option>
            </select>
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

        <button onClick={save} disabled={saving}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Convert to revenue */}
      {!appt.revenue_entry_id && (
        <div className="mt-4">
          {!showConvert ? (
            <button onClick={() => setShowConvert(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Convert to Revenue Entry
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-800">Log Revenue for this Appointment</h3>
                <button onClick={() => setShowConvert(false)} className="text-green-600 hover:text-green-800 text-sm">Cancel</button>
              </div>
              <div className="bg-white rounded-lg p-3 text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Client:</span> {clientName}</p>
                <p><span className="font-medium">Service:</span> {service}</p>
                <p><span className="font-medium">Date:</span> {date} at {formatTime(time)}</p>
                <p><span className="font-medium">Source:</span> {SOURCE_LABELS[source]}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
                  <input type="number" min="0" step="0.01" required value={convertAmount} onChange={e => setConvertAmount(e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip (€)</label>
                  <input type="number" min="0" step="0.01" value={convertTip} onChange={e => setConvertTip(e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENTS.map(p => (
                    <button key={p.key} type="button" onClick={() => setConvertPayment(p.key)}
                      className={`py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        convertPayment === p.key
                          ? p.key === 'cash' ? 'border-green-500 bg-green-100 text-green-700'
                            : p.key === 'revolut' ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : p.key === 'tw_prepaid' ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {PAYMENT_LABELS[p.key]}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleConvert} disabled={converting || !convertAmount}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {converting ? 'Saving…' : 'Save Revenue Entry'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
