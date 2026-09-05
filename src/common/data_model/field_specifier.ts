export type FieldTypeChoice = Record<string, string>
export type FieldTypeSingular = 'number' | 'string' | 'boolean' | 'unknown' | 'null' | FieldTypeChoice
export type FieldTypeUnion = FieldTypeSingular[]
export type FieldType = FieldTypeSingular | FieldTypeUnion

export type FieldSpecifier = {
  label: string
  type: FieldType
}
export type FieldSpecifiers = {
  [key: string]: FieldSpecifier
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
