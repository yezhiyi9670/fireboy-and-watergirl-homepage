import { choiceLabel, type FieldType, type FieldTypeSingular } from '../../data_model/field_specifier'

export type PrimitiveKind = 'number' | 'string' | 'boolean' | 'unknown' | 'null'

export type EditorForm =
  | { form: 'number' }
  | { form: 'string' }
  | { form: 'boolean' }
  | { form: 'unknown' }
  | { form: 'null' }
  | { form: 'undefined' }
  | { form: 'choice', mapping: Record<string, string> }

export function normalizeValue(value: unknown) {
  return value === undefined ? null : value
}

/**
 * Map a legacy `'object'` token and the current `'unknown'` token both onto the
 * JSON/unknown editing form.
 */
export function singularToForm(type: FieldTypeSingular): EditorForm {
  if(typeof type === 'string') {
    switch(type) {
      case 'number': return { form: 'number' }
      case 'string': return { form: 'string' }
      case 'boolean': return { form: 'boolean' }
      case 'null': return { form: 'null' }
      case 'undefined': return { form: 'undefined' }
      case 'unknown':
      // case 'object':
        return { form: 'unknown' }
      default:
        return { form: 'unknown' }
    }
  }
  return { form: 'choice', mapping: type }
}

export function typeToForms(type: FieldType): EditorForm[] {
  if(Array.isArray(type)) {
    return type.map(singularToForm)
  }
  return [ singularToForm(type) ]
}

export function conformsToForm(value: unknown, form: EditorForm): boolean {
  switch(form.form) {
    case 'number': return typeof value === 'number' && Number.isFinite(value)
    case 'string': return typeof value === 'string'
    case 'boolean': return typeof value === 'boolean'
    case 'unknown': return value !== undefined
    case 'null': return value === null
    case 'undefined': return value === undefined
    case 'choice': return typeof value === 'string' && value in form.mapping
  }
}

export function valueToPrimitiveKind(value: unknown): PrimitiveKind {
  const v = normalizeValue(value)
  if(v === null) return 'null'
  if(typeof v === 'number') return 'number'
  if(typeof v === 'string') return 'string'
  if(typeof v === 'boolean') return 'boolean'
  return 'unknown'
}

export function primitiveToForm(kind: PrimitiveKind): EditorForm {
  switch(kind) {
    case 'number': return { form: 'number' }
    case 'string': return { form: 'string' }
    case 'boolean': return { form: 'boolean' }
    case 'null': return { form: 'null' }
    case 'unknown': return { form: 'unknown' }
  }
}

export function firstConformingForm(forms: EditorForm[], value: unknown): EditorForm | null {
  for(const form of forms) {
    if(conformsToForm(value, form)) {
      return form
    }
  }
  return null
}

export function valueConforms(value: unknown, type: FieldType): boolean {
  return typeToForms(type).some(form => conformsToForm(value, form))
}

export function unionLetters(type: FieldType): { letter: string, form: EditorForm }[] {
  const forms = typeToForms(type)
  const seen = new Set<string>()
  const result: { letter: string, form: EditorForm }[] = []
  for(const form of forms) {
    const letter = letterForForm(form)
    if(seen.has(letter)) {
      continue
    }
    seen.add(letter)
    result.push({ letter, form })
  }
  return result
}

export function letterForForm(form: EditorForm): string {
  switch(form.form) {
    case 'number': return 'N'
    case 'string': return 'S'
    case 'boolean': return 'B'
    case 'unknown': return 'U'
    case 'null': return 'V'
    case 'undefined': return '–'
    case 'choice': return 'C'
  }
}

export function describeValue(value: unknown): string {
  const v = normalizeValue(value)
  if(v === null) return '空'
  if(typeof v === 'string') return v
  if(typeof v === 'number') return String(v)
  if(typeof v === 'boolean') return v ? '是' : '否'
  return JSON.stringify(v)
}

export function describeValueForForm(value: unknown, form: EditorForm, _specLabel?: string): string {
  const v = normalizeValue(value)
  switch(form.form) {
    case 'choice':
      return typeof v === 'string' && v in form.mapping
        ? choiceLabel(v, form.mapping)
        : describeValue(v)
    case 'boolean': return v ? '是' : '否'
    case 'unknown':
      if(v === null) return 'null'
      return typeof v === 'string' ? v : JSON.stringify(v)
    default:
      return describeValue(v)
  }
}

/** Editable-text representation of an arbitrary raw value (pure). */
export function valueToEditableText(source: unknown): string {
  const v = normalizeValue(source)
  if(v === null) {
    return ''
  }
  if(typeof v === 'boolean') {
    return v ? 'true' : 'false'
  }
  if(typeof v === 'number' || typeof v === 'string') {
    return String(v)
  }
  return JSON.stringify(v)
}

/**
 * Convert an editable text into the target form.
 * Returns the text to place in the target form's input, or null when the text
 * cannot be represented in that form (callers then clear the draft).
 */
export function convertTextToForm(text: string, target: EditorForm): string | null {
  switch(target.form) {
    case 'number': {
      const trimmed = text.trim()
      if(trimmed === '' || !Number.isFinite(Number(trimmed))) {
        return null
      }
      return trimmed
    }
    case 'string':
    case 'unknown':
      return text
    case 'boolean': {
      const low = text.trim().toLowerCase()
      return (low == 'true' || low == 'false') ? low : null
    }
    case 'choice': {
      const trimmed = text.trim()
      return (trimmed in target.mapping) ? trimmed : null
    }
    case 'null':
    case 'undefined':
      return null
  }
}
