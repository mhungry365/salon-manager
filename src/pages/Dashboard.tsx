import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, DollarSign, Banknote, CreditCard, Sparkles, TrendingDown, CalendarDays, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'
import type { RevenueEntry, ExpenseEntry, Appointment } from '../types'
import { PAYMENT_LABELS, PAYMENT_COLORS, SOURCE_LABELS, SOURCE_COLORS, STATUS_COLORS, STATUS_LABELS } from '../types'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, parseISO, today } from '../utils/dates'

type Period = 'today' | 'week' | 'month' | 'year'
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
]

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

// ── Staff dashboard ──────────────────────────────────────────────
function StaffDashboard() {
  const { user } = useAuth()
  const { salon, salonUser } = useSalon()
  const navigate = useNavigate()
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const todayStr = today()

  useEffect(() => {
    if (!salon || !user) return
    const load = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('date', todayStr)
        .order('time')
      setAppts((data as Appointment[]) || [])
      setLoading(false)
    }
    load()
  }, [salon, user])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {salonUser?.full_name?.split(' ')[0] || 'there'}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{salon?.name}</p>
      </div>

      <button onClick={() => navigate('/log')}
        className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 rounded-xl transition-colors mb-6">
        <PlusCircle size={18} /> Log a Sale
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <CalendarDays size={18} className="text-pink-500" /> Today's Appointments
          </h2>
          <button onClick={() => navigate('/diary')} className="text-xs text-pink-500 hover:text-pink-600 font-medium">View diary →</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" /></div>
        ) : appts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No appointments today</p>
        ) : (
          <div className="space-y-2">
            {appts.map(a => {
              const [h, m] = a.time.split(':')
              const hour = Number(h)
              const timeStr = `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
              return (
                <button key={a.id} onClick={() => navigate(`/appointments/${a.id}`)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 border border-gray-100 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-14 shrink-0">{timeStr}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.client_name}</p>
                      <p className="text-xs text-gray-500">{a.service}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || STATUS_COLORS.upcoming}`}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Owner / Manager dashboard ────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { salon, canManage } = useSalon()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('today')
  const [revenue, setRevenue] = useState<RevenueEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !salon) return
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const starts: Record<Period, string> = {
        today: startOfDay(now), week: startOfWeek(now),
        month: startOfMonth(now), year: startOfYear(now),
      }
      const from = starts[period]
      const todayDate = today()
      const [{ data: rev }, { data: exp }, { data: appts }] = await Promise.all([
        supabase.from('revenue_entries').select('*').eq('salon_id', salon.id).gte('date', from).order('date', { ascending: false }),
        supabase.from('expense_entries').select('*').eq('salon_id', salon.id).gte('date', from),
        supabase.from('appointments').select('*').eq('salon_id', salon.id).eq('date', todayDate).order('time'),
      ])
      setRevenue((rev as RevenueEntry[]) || [])
      setExpenses((exp as ExpenseEntry[]) || [])
      setTodayAppts((appts as Appointment[]) || [])
      setLoading(false)
    }
    load()
  }, [user, salon, period])

  if (!canManage) return <StaffDashboard />

  const metrics = useMemo(() => {
    const totalRevenue = revenue.reduce((s, r) => s + Number(r.amount), 0)
    const totalTips = revenue.reduce((s, r) => s + Number(r.tip || 0), 0)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const cash = revenue.filter(r => r.payment === 'cash').reduce((s, r) => s + Number(r.amount) + Number(r.tip || 0), 0)
    const revolut = revenue.filter(r => r.payment === 'revolut').reduce((s, r) => s + Number(r.amount) + Number(r.tip || 0), 0)
    const twPrepaid = revenue.filter(r => r.payment === 'tw_prepaid').reduce((s, r) => s + Number(r.amount), 0)
    const cashTips = revenue.filter(r => r.tip_payment === 'cash').reduce((s, r) => s + Number(r.tip || 0), 0)
    return { totalRevenue, totalTips, totalExpenses, cashInTill: cash + cashTips, revolut, twPrepaid, netProfit: totalRevenue - totalExpenses }
  }, [revenue, expenses])

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    revenue.forEach(r => { map[r.payment] = (map[r.payment] || 0) + Number(r.amount) + Number(r.tip || 0) })
    return Object.entries(map).map(([key, value]) => ({ name: PAYMENT_LABELS[key] || key, value: Number(value.toFixed(2)), color: PAYMENT_COLORS[key] || '#94a3b8', key }))
  }, [revenue])

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    revenue.forEach(r => { map[r.source] = (map[r.source] || 0) + Number(r.amount) })
    return Object.entries(map).map(([key, value]) => ({ name: SOURCE_LABELS[key] || key, value: Number(value.toFixed(2)), color: SOURCE_COLORS[key] || '#94a3b8', key }))
  }, [revenue])

  const fmt = (n: number) => `€${n.toFixed(2)}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{salon?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dashboard</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <MetricCard label="Total Revenue" value={fmt(metrics.totalRevenue)} icon={TrendingUp} color="bg-pink-100 text-pink-600" />
            <MetricCard label="Cash in Till" value={fmt(metrics.cashInTill)} icon={Banknote} color="bg-green-100 text-green-600" />
            <MetricCard label="Revolut" value={fmt(metrics.revolut)} icon={CreditCard} color="bg-purple-100 text-purple-600" />
            <MetricCard label="TW Payouts" value={fmt(metrics.twPrepaid)} icon={DollarSign} color="bg-blue-100 text-blue-600" />
            <MetricCard label="Tips" value={fmt(metrics.totalTips)} icon={Sparkles} color="bg-yellow-100 text-yellow-600" />
            <MetricCard label="Net Profit" value={fmt(metrics.netProfit)} icon={TrendingDown} color="bg-emerald-100 text-emerald-600" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">Payment Methods</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { key: 'cash', label: 'Cash', color: 'bg-green-50 text-green-700 border-green-200' },
                { key: 'revolut', label: 'Revolut', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { key: 'tw_prepaid', label: 'TW Prepaid', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { key: 'tw_card', label: 'TW Card', color: 'bg-pink-50 text-pink-700 border-pink-200' },
              ].map(({ key, label, color }) => {
                const total = revenue.filter(r => r.payment === key).reduce((s, r) => s + Number(r.amount) + Number(r.tip || 0), 0)
                return (
                  <div key={key} className={`border rounded-lg p-3 ${color}`}>
                    <p className="text-xs font-medium opacity-75">{label}</p>
                    <p className="text-lg font-bold">{fmt(total)}</p>
                    <p className="text-xs opacity-60">{revenue.filter(r => r.payment === key).length} sales</p>
                  </div>
                )
              })}
            </div>
            {paymentBreakdown.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={paymentBreakdown} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `€${v}`} />
                  <Tooltip formatter={(v) => [`€${Number(v).toFixed(2)}`, 'Total']} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {paymentBreakdown.map(e => <Cell key={e.key} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">Booking Sources</h2>
            {sourceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sourceBreakdown} barSize={40}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `€${v}`} />
                  <Tooltip formatter={(v) => [`€${Number(v).toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {sourceBreakdown.map(e => <Cell key={e.key} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No data for this period</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-4">Recent Sales</h2>
            {revenue.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No sales for this period</p>
            ) : (
              <div className="space-y-2">
                {revenue.slice(0, 10).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.service}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(r.date))} · {SOURCE_LABELS[r.source] || r.source} · {r.staff || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">€{Number(r.amount).toFixed(2)}</p>
                      {Number(r.tip) > 0 && <p className="text-xs text-yellow-600">+€{Number(r.tip).toFixed(2)} tip</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <CalendarDays size={18} className="text-pink-500" /> Today's Appointments
              </h2>
              <button onClick={() => navigate('/diary')} className="text-xs text-pink-500 hover:text-pink-600 font-medium">View diary →</button>
            </div>
            {todayAppts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No appointments today</p>
            ) : (
              <div className="space-y-2">
                {todayAppts.map(a => {
                  const [h, m] = a.time.split(':')
                  const hour = Number(h)
                  const timeStr = `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
                  return (
                    <button key={a.id} onClick={() => navigate(`/appointments/${a.id}`)}
                      className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 border border-gray-100 text-left transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-14 shrink-0">{timeStr}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.client_name}</p>
                          <p className="text-xs text-gray-500">{a.service}{a.staff ? ` · ${a.staff}` : ''}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || STATUS_COLORS.upcoming}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
