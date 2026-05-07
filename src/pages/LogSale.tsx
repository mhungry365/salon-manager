import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import { today } from '../utils/dates'

type Source = 'walkin' | 'treatwell' | 'phone'
type Payment = 'cash' | 'revolut' | 'tw_prepaid' | 'tw_card'
interface DailySummary { cash: number; revolut: number; tw_prepaid: number; tw_card: number; count: number }

const SOURCES: { key: Source; label: string; color: string }[] = [
  { key: 'walkin', label: 'Walk-in', color: 'border-teal-500 bg-teal-50 text-teal-700' },
  { key: 'treatwell', label: 'Treatwell', color: 'border-purple-500 bg-purple-50 text-purple-700' },
  { key: 'phone', label: 'Phone', color: 'border-blue-500 bg-blue-50 text-blue-700' },
]

const PAYMENTS: { key: Payment; label: string; desc: string; active: string }[] = [
  { key: 'cash', label: 'Cash', desc: 'Received in salon', active: 'border-green-500 bg-green-50' },
  { key: 'revolut', label: 'Revolut', desc: 'Card / online transfer', active: 'border-purple-500 bg-purple-50' },
  { key: 'tw_prepaid', label: 'TW Prepaid', desc: 'Paid online to Treatwell', active: 'border-blue-500 bg-blue-50' },
  { key: 'tw_card', label: 'TW Card', desc: 'Card via Treatwell terminal', active: 'border-pink-500 bg-pink-50' },
]

export default function LogSale() {
  const { user } = useAuth()
  const { salon, salonUser } = useSalon()
  const [source, setSource] = useState<Source>('walkin')
  const [payment, setPayment] = useState<Payment>('cash')
  const [date, setDate] = useState(today())
  const [service, setService] = useState('')
  const [amount, setAmount] = useState('')
  const [tip, setTip] = useState('')
  const [tipPayment, setTipPayment] = useState<'cash' | 'revolut'>('cash')
  const [staff, setStaff] = useState(salonUser?.full_name || '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [summary, setSummary] = useState<DailySummary>({ cash: 0, revolut: 0, tw_prepaid: 0, tw_card: 0, count: 0 })

  const loadSummary = async () => {
    if (!salon) return
    const { data } = await supabase
      .from('revenue_entries')
      .select('payment, amount, tip')
      .eq('salon_id', salon.id)
      .eq('date', today())
    if (!data) return
    const s: DailySummary = { cash: 0, revolut: 0, tw_prepaid: 0, tw_card: 0, count: data.length }
    data.forEach((r: any) => { s[r.payment as keyof Omit<DailySummary, 'count'>] += Number(r.amount) + Number(r.tip || 0) })
    setSummary(s)
  }

  useEffect(() => { loadSummary() }, [salon])

  const total = (Number(amount) || 0) + (Number(tip) || 0)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !salon) return
    setLoading(true)
    const { error } = await supabase.from('revenue_entries').insert({
      date, source, service, amount: Number(amount), tip: Number(tip) || 0,
      tip_payment: Number(tip) > 0 ? tipPayment : null,
      payment, staff: staff || null, notes: notes || null,
      user_id: user.id, salon_id: salon.id,
    })
    if (!error) {
      setSuccess(true)
      setService(''); setAmount(''); setTip(''); setNotes('')
      loadSummary()
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log a Sale</h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={18} /> Sale saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Booking Source</label>
          <div className="flex gap-2">
            {SOURCES.map(s => (
              <button key={s.key} type="button" onClick={() => setSource(s.key)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${source === s.key ? s.color : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENTS.map(p => (
              <button key={p.key} type="button" onClick={() => setPayment(p.key)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${payment === p.key ? p.active : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </button>
            ))}
          </div>
          {payment === 'tw_prepaid' && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              This customer already paid Treatwell online. You will receive this as a Treatwell payout, not as cash or card in the salon.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <input type="text" required value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Haircut"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
            <input type="number" min="0" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip (€)</label>
            <input type="number" min="0" step="0.01" value={tip} onChange={e => setTip(e.target.value)} placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        {Number(tip) > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tip Payment Method</label>
            <div className="flex gap-2">
              {(['cash', 'revolut'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTipPayment(t)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${tipPayment === t ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">Running total</span>
            <span className="text-lg font-bold text-gray-900">€{total.toFixed(2)}</span>
          </div>
        )}

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

        <button type="submit" disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors">
          {loading ? 'Saving…' : 'Save Sale'}
        </button>
      </form>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Today so far</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'cash', label: 'Cash', color: 'text-green-700 bg-green-50' },
            { key: 'revolut', label: 'Revolut', color: 'text-purple-700 bg-purple-50' },
            { key: 'tw_prepaid', label: 'TW Prepaid', color: 'text-blue-700 bg-blue-50' },
            { key: 'tw_card', label: 'TW Card', color: 'text-pink-700 bg-pink-50' },
          ].map(({ key, label, color }) => (
            <div key={key} className={`rounded-lg px-3 py-2 ${color}`}>
              <p className="text-xs font-medium opacity-75">{label}</p>
              <p className="text-lg font-bold">€{(summary[key as keyof DailySummary] as number).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">{summary.count} sale{summary.count !== 1 ? 's' : ''} logged today</p>
      </div>
    </div>
  )
}
