import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSalon } from '../contexts/SalonContext'
import type { Service } from '../types'

export function useServices() {
  const { salon } = useSalon()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['services', salon?.id],
    queryFn: async () => {
      if (!salon) return []
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salon.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) throw error
      return (data as Service[]) || []
    },
    enabled: !!salon,
  })

  const addService = useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at' | 'salon_id'>) => {
      if (!salon) throw new Error('No salon')
      const { data, error } = await supabase
        .from('services')
        .insert({ ...service, salon_id: salon.id })
        .select()
        .single()
      if (error) throw error
      return data as Service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', salon?.id] })
    },
  })

  const updateService = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', salon?.id] })
    },
  })

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', salon?.id] })
    },
  })

  return {
    services: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addService,
    updateService,
    deleteService,
  }
}
