import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Salon, SalonUser } from '../types'

interface SalonContextType {
  salon: Salon | null
  salonUser: SalonUser | null
  role: string | null
  isOwner: boolean
  isManager: boolean
  isStaff: boolean
  canManage: boolean
  loading: boolean
  refreshSalon: () => Promise<void>
}

const SalonContext = createContext<SalonContextType>({
  salon: null, salonUser: null, role: null,
  isOwner: false, isManager: false, isStaff: false, canManage: false,
  loading: true, refreshSalon: async () => {},
})

export function SalonProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [salon, setSalon] = useState<Salon | null>(null)
  const [salonUser, setSalonUser] = useState<SalonUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSalon = useCallback(async () => {
    if (!user) { setSalon(null); setSalonUser(null); setLoading(false); return }
    setLoading(true)
    const { data: su } = await supabase
      .from('salon_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!su) {
      // also check pending
      const { data: pending } = await supabase
        .from('salon_users')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      setSalonUser(pending as SalonUser | null)
      if (pending) {
        const { data: s } = await supabase.from('salons').select('*').eq('id', (pending as SalonUser).salon_id).single()
        setSalon(s as Salon | null)
      } else {
        setSalon(null)
      }
    } else {
      setSalonUser(su as SalonUser)
      const { data: s } = await supabase.from('salons').select('*').eq('id', (su as SalonUser).salon_id).single()
      setSalon(s as Salon | null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading) fetchSalon()
  }, [authLoading, fetchSalon])

  const role = salonUser?.role ?? null
  const isOwner = role === 'owner'
  const isManager = role === 'manager'
  const isStaff = role === 'staff'
  const canManage = isOwner || isManager

  return (
    <SalonContext.Provider value={{ salon, salonUser, role, isOwner, isManager, isStaff, canManage, loading, refreshSalon: fetchSalon }}>
      {children}
    </SalonContext.Provider>
  )
}

export const useSalon = () => useContext(SalonContext)
