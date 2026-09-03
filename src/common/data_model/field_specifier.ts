export type FieldTypeChoice = { [choice: string]: string }
export type FieldTypeSingular = 'number' | 'string' | 'boolean' | 'object' | FieldTypeChoice
export type FieldType = FieldTypeSingular | FieldTypeSingular[]
export type FieldSpecifiers = {
  [key: string]: FieldType
}

export function choiceLabel(value: string | undefined, mapping: {[key: string]: string}) {
  if(value != null && value in mapping) {
    return mapping[value]
  }
  for(let key in mapping) {
    return mapping[key]
  }
  throw new Error('Enum mapping must have at least one item.')
}
