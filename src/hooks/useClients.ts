import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSalon } from '../contexts/SalonContext'
import type { Client } from '../types'

export function useClients() {
  const { salon } = useSalon()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['clients', salon?.id],
    queryFn: async () => {
      if (!salon) return []
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('salon_id', salon.id)
        .order('name', { ascending: true })
      
      if (error) throw error
      return (data as Client[]) || []
    },
    enabled: !!salon,
  })

  const addClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'salon_id'>) => {
      if (!salon) throw new Error('No salon')
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, salon_id: salon.id })
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salon?.id] })
    },
  })

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salon?.id] })
    },
  })

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salon?.id] })
    },
  })

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addClient,
    updateClient,
    deleteClient,
  }
}
