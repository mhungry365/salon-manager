import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, LayoutGrid } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Appointment } from '../types'

const SOURCE_BADGE: Record<string, string> = {
  walkin: 'bg-teal-100 text-teal-700',
  treatwell: 'bg-purple-100 text-purple-700',
  phone: 'bg-blue-100 text-blue-700',
}
const SOURCE_LABELS: Record<string, string> = {
  walkin: 'Walk-in', treatwell: 'Treatwell', phone: 'Phone',
}

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 72 // px per hour

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = Number(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  return `${hour % 12 || 12}:${m}${ampm}`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function getWeekDays(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day.toISOString().slice(0, 10)
  })
}

function getTopOffset(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - START_HOUR) + m / 60) * HOUR_HEIGHT
}

function getHeight(duration: number): number {
  return Math.max((duration / 60) * HOUR_HEIGHT, 28)
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  return d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatShortDay(dateStr: string): { day: string; num: number; isToday: boolean } {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  return {
    day: d.toLocaleDateString('en-IE', { weekday: 'short' }),
    num: d.getDate(),
    isToday: dateStr === today,
  }
}

function AppointmentCard({ appt, onClick, compact = false }: {
  appt: Appointment; onClick: () => void; compact?: boolean
}) {
  const statusBg: Record<string, string> = {
    upcoming: 'bg-white border-l-4 border-l-blue-400',
    completed: 'bg-white border-l-4 border-l-green-400',
    no_show: 'bg-white border-l-4 border-l-gray-300 opacity-60',
    cancelled: 'bg-white border-l-4 border-l-red-400 opacity-50',
  }
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg shadow-sm border border-gray-200 px-2 py-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${statusBg[appt.status] || statusBg.upcoming}`}
    >
      <p className="text-xs font-semibold text-gray-900 truncate">{appt.client_name}</p>
      {!compact && (
        <>
          <p className="text-xs text-gray-600 truncate">{appt.service}</p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{formatTime(appt.time)}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SOURCE_BADGE[appt.source] || ''}`}>
              {SOURCE_LABELS[appt.source] || appt.source}
            </span>
          </div>
        </>
      )}
    </button>
  )
}

export default function Diary() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const todayStr = new Date().toISOString().slice(0, 10)
  const [currentDate, setCurrentDate] = useState(searchParams.get('date') || todayStr)
  const [view, setView] = useState<'day' | 'week'>('day')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const weekDays = getWeekDays(currentDate)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const from = view === 'day' ? currentDate : weekDays[0]
    const to = view === 'day' ? currentDate : weekDays[6]
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', from)
      .lte('date', to)
      .order('time')
    setAppointments((data as Appointment[]) || [])
    setLoading(false)
  }, [user, currentDate, view])

  useEffect(() => { load() }, [load])

  const dayAppts = appointments.filter(a => a.date === currentDate)
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'day' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              <CalendarDays size={15} /> Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'week' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              <LayoutGrid size={15} /> Week
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate(`/appointments/new?date=${currentDate}`)}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Day navigation */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setCurrentDate(d => addDays(d, -1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="font-semibold text-gray-900">{view === 'day' ? formatDateLabel(currentDate) : `${new Date(weekDays[0] + 'T00:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })} – ${new Date(weekDays[6] + 'T00:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`}</h2>
        </div>
        <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronRight size={18} />
        </button>
        {currentDate !== todayStr && (
          <button onClick={() => setCurrentDate(todayStr)} className="text-sm text-pink-500 hover:text-pink-600 font-medium px-2">Today</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>
      ) : view === 'day' ? (
        /* ── DAY VIEW ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Time gutter */}
            <div className="w-16 shrink-0 border-r border-gray-100">
              <div style={{ height: totalHeight }}>
                {hours.map(h => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-1">
                    <span className="text-xs text-gray-400">{h % 12 || 12}{h < 12 ? 'am' : 'pm'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Events area */}
            <div className="flex-1 relative" style={{ height: totalHeight }}>
              {/* Hour grid lines */}
              {hours.map(h => (
                <div key={h} style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} className="absolute left-0 right-0 border-t border-gray-100" />
              ))}

              {/* Appointments */}
              {dayAppts.map(appt => {
                const top = getTopOffset(appt.time)
                const height = getHeight(appt.duration)
                if (top < 0 || top > totalHeight) return null
                return (
                  <div
                    key={appt.id}
                    style={{ top, height: Math.min(height, totalHeight - top), left: 4, right: 4 }}
                    className="absolute"
                  >
                    <AppointmentCard appt={appt} onClick={() => navigate(`/appointments/${appt.id}`)} />
                  </div>
                )
              })}

              {dayAppts.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">No appointments</p>
                    <button onClick={() => navigate(`/appointments/new?date=${currentDate}`)}
                      className="text-pink-500 text-sm font-medium hover:text-pink-600 mt-1">
                      + Add one
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── WEEK VIEW ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          {/* Day headers */}
          <div className="flex border-b border-gray-200">
            <div className="w-16 shrink-0" />
            {weekDays.map(d => {
              const { day, num, isToday } = formatShortDay(d)
              return (
                <button key={d} onClick={() => { setCurrentDate(d); setView('day') }}
                  className={`flex-1 min-w-[80px] py-2 text-center border-l border-gray-100 hover:bg-gray-50 transition-colors ${isToday ? 'bg-pink-50' : ''}`}>
                  <p className="text-xs text-gray-500 font-medium">{day}</p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-pink-600' : 'text-gray-800'}`}>{num}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {appointments.filter(a => a.date === d).length || ''}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Timeline */}
          <div className="flex">
            <div className="w-16 shrink-0 border-r border-gray-100">
              <div style={{ height: totalHeight }}>
                {hours.map(h => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-1">
                    <span className="text-xs text-gray-400">{h % 12 || 12}{h < 12 ? 'am' : 'pm'}</span>
                  </div>
                ))}
              </div>
            </div>
            {weekDays.map(d => {
              const dayAppts = appointments.filter(a => a.date === d)
              const { isToday } = formatShortDay(d)
              return (
                <div key={d} className={`flex-1 min-w-[80px] relative border-l border-gray-100 ${isToday ? 'bg-pink-50/30' : ''}`} style={{ height: totalHeight }}>
                  {hours.map(h => (
                    <div key={h} style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} className="absolute left-0 right-0 border-t border-gray-100" />
                  ))}
                  {dayAppts.map(appt => {
                    const top = getTopOffset(appt.time)
                    const height = getHeight(appt.duration)
                    if (top < 0 || top > totalHeight) return null
                    return (
                      <div key={appt.id} style={{ top, height: Math.min(height, totalHeight - top), left: 2, right: 2 }} className="absolute">
                        <AppointmentCard appt={appt} onClick={() => navigate(`/appointments/${appt.id}`)} compact />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day summary strip (day view only) */}
      {view === 'day' && dayAppts.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: dayAppts.length, color: 'text-gray-900' },
            { label: 'Completed', value: dayAppts.filter(a => a.status === 'completed').length, color: 'text-green-600' },
            { label: 'Upcoming', value: dayAppts.filter(a => a.status === 'upcoming').length, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
