import { useState, useEffect, useCallback } from 'react'
import { Trash2, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSalon } from '../contexts/SalonContext'
import type { RevenueEntry } from '../types'
import { PAYMENT_LABELS, SOURCE_LABELS } from '../types'
import { startOfMonth, today, format, parseISO } from '../utils/dates'

export default function History() {
  const { salon } = useSalon()
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(startOfMonth(new Date()))
  const [to, setTo] = useState(today())
  const [filterPayment, setFilterPayment] = useState('')
  const [filterSource, setFilterSource] = useState('')

  const load = useCallback(async () => {
    if (!salon) return
    setLoading(true)
    let q = supabase.from('revenue_entries').select('*').eq('salon_id', salon.id).gte('date', from).lte('date', to).order('date', { ascending: false })
    if (filterPayment) q = q.eq('payment', filterPayment)
    if (filterSource) q = q.eq('source', filterSource)
    const { data } = await q
    setEntries((data as RevenueEntry[]) || [])
    setLoading(false)
  }, [salon, from, to, filterPayment, filterSource])

  useEffect(() => { load() }, [load])

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    await supabase.from('revenue_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const exportCSV = () => {
    const headers = ['Date', 'Service', 'Source', 'Payment', 'Staff', 'Amount', 'Tip', 'Total']
    const rows = entries.map(e => [
      e.date, e.service, SOURCE_LABELS[e.source] || e.source,
      PAYMENT_LABELS[e.payment] || e.payment, e.staff || '',
      e.amount, e.tip || 0, (Number(e.amount) + Number(e.tip || 0)).toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `sales-${from}-${to}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const totalAmount = entries.reduce((s, e) => s + Number(e.amount), 0)
  const totalTips = entries.reduce((s, e) => s + Number(e.tip || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white">
          <option value="">All Payments</option>
          {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white">
          <option value="">All Sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {entries.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-gray-600"><strong className="text-gray-900">{entries.length}</strong> entries</span>
          <span className="text-gray-600">Revenue: <strong className="text-gray-900">€{totalAmount.toFixed(2)}</strong></span>
          <span className="text-gray-600">Tips: <strong className="text-yellow-600">€{totalTips.toFixed(2)}</strong></span>
          <span className="text-gray-600">Total: <strong className="text-gray-900">€{(totalAmount + totalTips).toFixed(2)}</strong></span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>
        ) : entries.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-16">No entries found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Service', 'Source', 'Payment', 'Staff', 'Amount', 'Tip', 'Total', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{format(parseISO(e.date))}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{e.service}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${e.source === 'walkin' ? 'bg-teal-100 text-teal-700' : e.source === 'treatwell' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{SOURCE_LABELS[e.source] || e.source}</span></td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${e.payment === 'cash' ? 'bg-green-100 text-green-700' : e.payment === 'revolut' ? 'bg-purple-100 text-purple-700' : e.payment === 'tw_prepaid' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{PAYMENT_LABELS[e.payment] || e.payment}</span></td>
                    <td className="px-4 py-3 text-gray-600">{e.staff || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">€{Number(e.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-yellow-600">{Number(e.tip) > 0 ? `€${Number(e.tip).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">€{(Number(e.amount) + Number(e.tip || 0)).toFixed(2)}</td>
                    <td className="px-4 py-3"><button onClick={() => deleteEntry(e.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
