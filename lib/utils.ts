/** Format a number as Chilean pesos (CLP) */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format a number as Chilean pesos without the currency symbol */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format a date in Chilean locale */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Format relative time */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  return formatDate(d)
}

/** Calculate percentage safely */
export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((n) => n.length > 1)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/** Classify payment status */
export type PaymentStatus = 'paid' | 'partial' | 'pending'

export function getPaymentStatus(paid: number, total: number): PaymentStatus {
  if (paid >= total) return 'paid'
  if (paid > 0) return 'partial'
  return 'pending'
}

export function statusLabel(status: PaymentStatus): string {
  return { paid: 'Pagado', partial: 'Parcial', pending: 'Pendiente' }[status]
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
