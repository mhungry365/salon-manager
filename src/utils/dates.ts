export function startOfDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function startOfWeek(d: Date): string {
  const day = new Date(d)
  const dow = day.getDay()
  day.setDate(day.getDate() - (dow === 0 ? 6 : dow - 1))
  return day.toISOString().slice(0, 10)
}

export function startOfMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function startOfYear(d: Date): string {
  return `${d.getFullYear()}-01-01`
}

export function format(d: Date): string {
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function parseISO(s: string): Date {
  return new Date(s + 'T00:00:00')
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
