export interface RevenueEntry {
  id: string
  created_at: string
  date: string
  source: string
  service: string
  amount: number
  tip: number
  tip_payment: string | null
  payment: string
  staff: string | null
  notes: string | null
  user_id: string
}

export interface ExpenseEntry {
  id: string
  created_at: string
  date: string
  category: string
  description: string
  amount: number
  ref: string | null
  notes: string | null
  user_id: string
}

export type PaymentMethod = 'cash' | 'revolut' | 'tw_prepaid' | 'tw_card'
export type BookingSource = 'walkin' | 'treatwell' | 'phone'

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  revolut: 'Revolut',
  tw_prepaid: 'TW Prepaid',
  tw_card: 'TW Card',
}

export const SOURCE_LABELS: Record<string, string> = {
  walkin: 'Walk-in',
  treatwell: 'Treatwell',
  phone: 'Phone',
}

export const PAYMENT_COLORS: Record<string, string> = {
  cash: '#16a34a',
  revolut: '#7c3aed',
  tw_prepaid: '#2563eb',
  tw_card: '#db2777',
}

export const SOURCE_COLORS: Record<string, string> = {
  walkin: '#0d9488',
  treatwell: '#7c3aed',
  phone: '#2563eb',
}

export interface Appointment {
  id: string
  created_at: string
  date: string
  time: string
  duration: number
  client_name: string
  client_phone: string | null
  service: string
  source: string
  staff: string | null
  status: string
  notes: string | null
  revenue_entry_id: string | null
  user_id: string
}

export const APPOINTMENT_STATUSES = ['upcoming', 'completed', 'no_show', 'cancelled'] as const
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number]

export const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
  no_show: 'No-show',
  cancelled: 'Cancelled',
}

export const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  no_show: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

export const EXPENSE_CATEGORIES = [
  'supplies',
  'rent',
  'utilities',
  'wages',
  'equipment',
  'marketing',
  'other',
]
