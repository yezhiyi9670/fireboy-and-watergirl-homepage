export type FieldTypeChoice = Record<string, string>
export type FieldTypeSingular = 'number' | 'string' | 'boolean' | 'unknown' | 'null' | 'undefined' | FieldTypeChoice
export type FieldTypeUnion = FieldTypeSingular[]
export type FieldType = FieldTypeSingular | FieldTypeUnion

export type FieldSpecifier = {
  label: string
  type: FieldType
  transient?: boolean
  initial?: unknown
}
export type FieldSpecifiers = {
  [key: string]: FieldSpecifier
}

export function persistentField(label: string, type: FieldType, initial?: unknown): FieldSpecifier {
  return { label, type, transient: false, initial }
}
export function transientField(label: string, type: FieldType, initial?: unknown): FieldSpecifier {
  return { label, type, transient: true, initial }
}

function defaultInitialValueSingular(type: FieldTypeSingular) {
  switch(type) {
    case 'boolean':
      return false
    case 'null':
    case 'unknown':
      return null
    case 'number':
      return 0
    case 'string':
      return ''
  }
  return undefined
}
export function defaultInitialValue(type: FieldType) {
  if(!Array.isArray(type)) {
    return defaultInitialValueSingular(type)
  }
  for(const singular of type) {
    const initial = defaultInitialValueSingular(singular)
    if(initial !== undefined) {
      return initial
    }
  }
  return undefined
}
export function choiceLabel(value: string | undefined, mapping: Record<string, string>) {
  if(value != null && value in mapping) {
    return mapping[value]
  }
  for(let key in mapping) {
    return mapping[key]
  }
  throw new Error('Choice mapping must have at least one item.')
}
