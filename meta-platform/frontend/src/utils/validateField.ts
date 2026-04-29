import type { FieldMeta } from '@/types/meta'

/**
 * Validates a single field value against its constraints.
 * Returns an error string or null if valid.
 */
export function validateField(field: FieldMeta, value: unknown): string | null {
  const c = field.constraints
  if (!c) return null

  // ── text / textarea ──────────────────────────────────────────────────────
  if (field.type === 'text' || field.type === 'textarea' || field.type === 'user') {
    const str = typeof value === 'string' ? value : ''
    if (c.minLength !== undefined && str.length < c.minLength)
      return `Minimum ${c.minLength} characters (currently ${str.length})`
    if (c.maxLength !== undefined && str.length > c.maxLength)
      return `Maximum ${c.maxLength} characters (currently ${str.length})`
    if (c.pattern && str && !new RegExp(c.pattern).test(str))
      return `Value does not match required format (${c.pattern})`
  }

  // ── number / progress ────────────────────────────────────────────────────
  if (field.type === 'number' || field.type === 'progress') {
    const n = Number(value)
    if (!isNaN(n)) {
      if (c.min !== undefined && n < c.min) return `Minimum value: ${c.min}`
      if (c.max !== undefined && n > c.max) return `Maximum value: ${c.max}`
      if (c.step !== undefined && c.step > 0) {
        const base = c.min ?? 0
        const remainder = (n - base) % c.step
        if (Math.abs(remainder) > 1e-10 && Math.abs(remainder - c.step) > 1e-10)
          return `Value must be a multiple of ${c.step}${c.min !== undefined ? ` starting from ${c.min}` : ''}`
      }
    }
  }

  // ── date ─────────────────────────────────────────────────────────────────
  if (field.type === 'date') {
    const str = typeof value === 'string' ? value : ''
    if (str) {
      if (c.minDate && str < c.minDate) return `Date must be on or after ${c.minDate}`
      if (c.maxDate && str > c.maxDate) return `Date must be on or before ${c.maxDate}`
    }
  }

  // ── multiselect / tags ───────────────────────────────────────────────────
  if (field.type === 'multiselect' || field.type === 'tags') {
    const arr = Array.isArray(value) ? value : []
    if (c.minItems !== undefined && arr.length < c.minItems)
      return `Select at least ${c.minItems} item${c.minItems !== 1 ? 's' : ''}`
    if (c.maxItems !== undefined && arr.length > c.maxItems)
      return `Select at most ${c.maxItems} item${c.maxItems !== 1 ? 's' : ''}`
  }

  return null
}

/**
 * Validates all fields in a form and returns a map of fieldName → errorMessage.
 * Empty map means all valid.
 */
export function validateForm(
  fields: FieldMeta[],
  data: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = data[field.name]

    // required check
    const empty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)

    if (field.required && empty) {
      errors[field.name] = `${field.label} is required`
      continue
    }

    // constraint check (skip if empty and not required)
    if (!empty) {
      const err = validateField(field, value)
      if (err) errors[field.name] = err
    }
  }

  return errors
}
