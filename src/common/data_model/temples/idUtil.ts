export function idsEqual(a: unknown, b: unknown) {
  return String(a) === String(b)
}

export function asFiniteNumber(value: unknown): number | null {
  if(typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if(typeof value === 'string' && value.trim() !== '') {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }
  return null
}
