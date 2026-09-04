import { Type } from "class-transformer"
import EdgeItemData from "./EdgeItemData"
import LevelItemData from "./LevelItemData"
import type { InjectionKey, Ref } from "vue"

export default class TempleItemData {
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

  /**
   * Expensive. Shall be memoized when rendering.
   */
  calculateSortedLevels() {
    const ret: LevelItemData[] = [ ...this.levels ]
    ret.sort((a, b) => {
      const na = +a.getShownNumbering()
      const nb = +b.getShownNumbering()
      if(na != na && nb != nb) {
        return 0
      }
      if(na != na) {
        return 1
      }
      if(nb != nb) {
        return -1
      }
      return na - nb
    })
    return ret
  }
}
