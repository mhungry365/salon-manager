import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { EXPENSE_CATEGORIES } from '../types'
import { today } from '../utils/dates'

export default function Expenses() {
  const { user } = useAuth()
  const [date, setDate] = useState(today())
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true); setError('')
    const { error: err } = await supabase.from('expense_entries').insert({
      date, category, description, amount: Number(amount) || 0,
      ref: ref || null, notes: notes || null, user_id: user.id,
    })
    if (err) { setError(err.message) }
    else {
      setSuccess(true)
      setDescription(''); setAmount(''); setRef(''); setNotes('')
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log an Expense</h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={18} /> Expense saved successfully!
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 capitalize bg-white">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input type="text" required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Shampoo order"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Invoice</label>
            <input type="text" value={ref} onChange={e => setRef(e.target.value)} placeholder="Optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors">
          {loading ? 'Saving…' : 'Save Expense'}
        </button>
      </form>
    </div>
  )
}
