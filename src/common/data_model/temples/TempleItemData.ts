import { Type } from "class-transformer"
import { EdgeItemData } from "./EdgeItemData"
import { LevelItemData } from "./LevelItemData"
import type { InjectionKey, Ref } from "vue"

export class TempleItemData {
  index!: number
  id!: string
  label!: string
  color!: string
  type!: 'tree' | 'rows'

  @Type(() => LevelItemData)
  levels!: LevelItemData[]
  
  @Type(() => EdgeItemData)
  edges!: EdgeItemData[]

  static injectionKey: InjectionKey<Ref<TempleItemData>> = Symbol('TempleItemData')
  static kInjectionKey: InjectionKey<Ref<string>> = Symbol('TempleItemData_k')
}
