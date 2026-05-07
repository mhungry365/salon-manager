import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Check, X, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSalon } from '../contexts/SalonContext'
import type { SalonUser } from '../types'
import { ROLE_LABELS } from '../types'


export default function StaffManagement() {
  const { salon, salonUser: currentUser } = useSalon()
  const [staff, setStaff] = useState<SalonUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!salon) return
    setLoading(true)
    const { data } = await supabase
      .from('salon_users')
      .select('*')
      .eq('salon_id', salon.id)
      .order('created_at')
    setStaff((data as SalonUser[]) || [])
    setLoading(false)
  }, [salon])

  useEffect(() => { load() }, [load])

  const update = async (id: string, changes: Partial<SalonUser>) => {
    setActionId(id)
    await supabase.from('salon_users').update(changes).eq('id', id)
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s))
    setActionId(null)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this staff member?')) return
    setActionId(id)
    await supabase.from('salon_users').delete().eq('id', id)
    setStaff(prev => prev.filter(s => s.id !== id))
    setActionId(null)
  }

  const pending = staff.filter(s => s.status === 'pending')
  const active = staff.filter(s => s.status === 'active')
  const suspended = staff.filter(s => s.status === 'suspended')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        {salon && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Invite code:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 max-w-[140px] truncate">{salon.id}</code>
            <button onClick={() => navigator.clipboard.writeText(salon.id)}
              className="flex items-center gap-1 text-xs bg-pink-50 border border-pink-200 text-pink-600 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-colors font-medium">
              <UserPlus size={13} /> Copy & Share
            </button>
          </div>
        )}
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-yellow-800 mb-3">{pending.length} pending approval{pending.length > 1 ? 's' : ''}</h2>
          <div className="space-y-2">
            {pending.map(s => (
              <div key={s.id} className="bg-white rounded-lg border border-yellow-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.full_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => update(s.id, { status: 'active' })} disabled={actionId === s.id}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <Check size={13} /> Approve
                  </button>
                  <button onClick={() => remove(s.id)} disabled={actionId === s.id}
                    className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active staff */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Active Staff ({active.length})</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-pink-500" /></div>
        ) : active.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No active staff yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {active.map(s => {
              const isSelf = s.id === currentUser?.id
              return (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-semibold text-sm">
                      {(s.full_name || s.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.full_name || '—'} {isSelf && <span className="text-xs text-gray-400">(you)</span>}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSelf && (
                      <>
                        <div className="relative">
                          <select
                            value={s.role}
                            onChange={e => update(s.id, { role: e.target.value })}
                            disabled={actionId === s.id}
                            className="appearance-none text-xs bg-gray-100 border border-gray-200 rounded-lg pl-2 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                          >
                            {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <button onClick={() => update(s.id, { status: 'suspended' })} disabled={actionId === s.id}
                          className="text-xs bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          Suspend
                        </button>
                        <button onClick={() => remove(s.id)} disabled={actionId === s.id}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1">
                          <X size={14} />
                        </button>
                      </>
                    )}
                    {isSelf && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.role === 'owner' ? 'bg-pink-100 text-pink-700' :
                        s.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{ROLE_LABELS[s.role] || s.role}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Suspended */}
      {suspended.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500">Suspended ({suspended.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {suspended.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => update(s.id, { status: 'active' })} disabled={actionId === s.id}
                    className="text-xs bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                    Reinstate
                  </button>
                  <button onClick={() => remove(s.id)} disabled={actionId === s.id}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
