import { useState, useEffect, useMemo } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSalon } from '../contexts/SalonContext'
import type { RevenueEntry, ExpenseEntry } from '../types'
import { PAYMENT_LABELS, SOURCE_LABELS } from '../types'
import { startOfYear } from '../utils/dates'

type Period = 'this_month' | 'last_month' | 'this_quarter' | 'this_year'

function getPeriodRange(p: Period): { from: string; to: string } {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth()
  if (p === 'this_month') return { from: `${y}-${String(m + 1).padStart(2, '0')}-01`, to: now.toISOString().slice(0, 10) }
  if (p === 'last_month') {
    const lm = m === 0 ? 12 : m; const ly = m === 0 ? y - 1 : y
    const lastDay = new Date(y, m, 0).getDate()
    return { from: `${ly}-${String(lm).padStart(2, '0')}-01`, to: `${ly}-${String(lm).padStart(2, '0')}-${lastDay}` }
  }
  if (p === 'this_quarter') {
    const q = Math.floor(m / 3); const qStart = q * 3
    return { from: `${y}-${String(qStart + 1).padStart(2, '0')}-01`, to: now.toISOString().slice(0, 10) }
  }
  return { from: startOfYear(now), to: now.toISOString().slice(0, 10) }
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'this_month', label: 'This Month' }, { key: 'last_month', label: 'Last Month' },
  { key: 'this_quarter', label: 'This Quarter' }, { key: 'this_year', label: 'This Year' },
]

export default function Reports() {
  const { salon } = useSalon()
  const [period, setPeriod] = useState<Period>('this_month')
  const [revenue, setRevenue] = useState<RevenueEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!salon) return
    const load = async () => {
      setLoading(true)
      const { from, to } = getPeriodRange(period)
      const [{ data: rev }, { data: exp }] = await Promise.all([
        supabase.from('revenue_entries').select('*').eq('salon_id', salon.id).gte('date', from).lte('date', to),
        supabase.from('expense_entries').select('*').eq('salon_id', salon.id).gte('date', from).lte('date', to),
      ])
      setRevenue((rev as RevenueEntry[]) || [])
      setExpenses((exp as ExpenseEntry[]) || [])
      setLoading(false)
    }
    load()
  }, [salon, period])

  const totals = useMemo(() => {
    const gross = revenue.reduce((s, r) => s + Number(r.amount), 0)
    const tips = revenue.reduce((s, r) => s + Number(r.tip || 0), 0)
    const exp = expenses.reduce((s, e) => s + Number(e.amount), 0)
    return { gross, tips, exp, net: gross - exp }
  }, [revenue, expenses])

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; service: number; tips: number }> = {}
    revenue.forEach(r => {
      if (!map[r.payment]) map[r.payment] = { count: 0, service: 0, tips: 0 }
      map[r.payment].count++; map[r.payment].service += Number(r.amount); map[r.payment].tips += Number(r.tip || 0)
    })
    const total = revenue.reduce((s, r) => s + Number(r.amount) + Number(r.tip || 0), 0)
    return Object.entries(map).map(([key, v]) => ({
      key, label: PAYMENT_LABELS[key] || key, count: v.count, service: v.service, tips: v.tips,
      total: v.service + v.tips, pct: total > 0 ? ((v.service + v.tips) / total * 100).toFixed(1) : '0.0',
    }))
  }, [revenue])

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    revenue.forEach(r => {
      if (!map[r.source]) map[r.source] = { count: 0, revenue: 0 }
      map[r.source].count++; map[r.source].revenue += Number(r.amount)
    })
    return Object.entries(map).map(([key, v]) => ({ key, label: SOURCE_LABELS[key] || key, count: v.count, revenue: v.revenue }))
  }, [revenue])

  const twPrepaid = revenue.filter(r => r.payment === 'tw_prepaid').reduce((s, r) => s + Number(r.amount), 0)
  const twCard = revenue.filter(r => r.payment === 'tw_card').reduce((s, r) => s + Number(r.amount), 0)
  const fmt = (n: number) => `€${n.toFixed(2)}`

  const exportCSV = () => {
    const lines = [
      ['Period', PERIODS.find(p2 => p2.key === period)?.label || ''], [],
      ['Summary'], ['Gross Revenue', totals.gross.toFixed(2)], ['Total Expenses', totals.exp.toFixed(2)],
      ['Net Profit', totals.net.toFixed(2)], ['Tips', totals.tips.toFixed(2)], [],
      ['Payment Method', 'Count', 'Service €', 'Tips €', 'Total €', '% Share'],
      ...paymentBreakdown.map(p => [p.label, p.count, p.service.toFixed(2), p.tips.toFixed(2), p.total.toFixed(2), p.pct + '%']),
    ]
    const csv = lines.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `report-${period}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6 gap-1 w-fit">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {p.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Gross Revenue', value: fmt(totals.gross), color: 'bg-pink-50 text-pink-700 border-pink-200' },
              { label: 'Total Expenses', value: fmt(totals.exp), color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Net Profit', value: fmt(totals.net), color: totals.net >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Tips', value: fmt(totals.tips), color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`border rounded-xl p-4 ${color}`}>
                <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-3">Payment Method Breakdown</h2>
            {paymentBreakdown.length === 0 ? <p className="text-gray-400 text-sm py-4 text-center">No data</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200">{['Method','Count','Service €','Tips €','Total €','% Share'].map(h => <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentBreakdown.map(p => (
                      <tr key={p.key} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${p.key === 'cash' ? 'bg-green-100 text-green-700' : p.key === 'revolut' ? 'bg-purple-100 text-purple-700' : p.key === 'tw_prepaid' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{p.label}</span></td>
                        <td className="py-2.5 pr-4 text-gray-700">{p.count}</td>
                        <td className="py-2.5 pr-4 text-gray-900">{fmt(p.service)}</td>
                        <td className="py-2.5 pr-4 text-yellow-600">{fmt(p.tips)}</td>
                        <td className="py-2.5 pr-4 font-semibold text-gray-900">{fmt(p.total)}</td>
                        <td className="py-2.5 text-gray-600">{p.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-3">Booking Source Breakdown</h2>
            {sourceBreakdown.length === 0 ? <p className="text-gray-400 text-sm py-4 text-center">No data</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">{['Source','Count','Revenue'].map(h => <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {sourceBreakdown.map(s => (
                    <tr key={s.key} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.key === 'walkin' ? 'bg-teal-100 text-teal-700' : s.key === 'treatwell' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{s.label}</span></td>
                      <td className="py-2.5 pr-4 text-gray-700">{s.count}</td>
                      <td className="py-2.5 font-semibold text-gray-900">{fmt(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Treatwell Detail</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-600 mb-1">TW Prepaid (online payout)</p>
                <p className="text-2xl font-bold text-blue-700">{fmt(twPrepaid)}</p>
                <p className="text-xs text-blue-500 mt-1">{revenue.filter(r => r.payment === 'tw_prepaid').length} transactions</p>
              </div>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="text-xs font-medium text-pink-600 mb-1">TW Card (at salon)</p>
                <p className="text-2xl font-bold text-pink-700">{fmt(twCard)}</p>
                <p className="text-xs text-pink-500 mt-1">{revenue.filter(r => r.payment === 'tw_card').length} transactions</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
