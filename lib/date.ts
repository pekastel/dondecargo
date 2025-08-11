// Shared date formatting utilities
// Always return a safe string and handle invalid inputs gracefully.

export function formatDate(input: Date | string | number | null | undefined): string {
  if (!input && input !== 0) return '—'
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return '—'
  try {
    return d.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return '—'
  }
}

export function formatDateShort(input: Date | string | number | null | undefined): string {
  if (!input && input !== 0) return ''
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ''
  try {
    // Example: "11 ago"
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short'
    })
  } catch {
    return ''
  }
}
