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

export const EXPENSE_CATEGORIES = [
  'supplies',
  'rent',
  'utilities',
  'wages',
  'equipment',
  'marketing',
  'other',
]
