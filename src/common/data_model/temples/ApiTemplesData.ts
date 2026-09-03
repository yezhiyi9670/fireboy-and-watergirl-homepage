import { Exclude, plainToInstance } from "class-transformer"
import { TempleItemData } from "./TempleItemData"
import { computed, inject, type InjectionKey, type Ref } from "vue"
import { Api } from "../../api/Api"
import { ApiError } from "../ApiError"
import typia from "typia"
import { TransformNPDict } from "../../utils/class_transform"
import type { LevelItemData } from "./LevelItemData"
import { GameItemData } from "../home/GameItemData"

export class ApiTemplesData {
  editing_allowed!: boolean

  @TransformNPDict(TempleItemData)
  temples!: Record<string, TempleItemData>

  @Exclude()
  private templePrefixes: Record<string, string> | null = null

  recalculateTemplePrefixes() {
    const names = Object.values(this.temples).map(temple => {
      return temple.label
    })
    const currPrefixes: Record<string, string> = Object.create(null)
    for(const name of names) {
      currPrefixes[name] = ''
    }
    while(true) {
      const rmap: Record<string, string[]> = Object.create(null)
      for(const [name, prefix] of Object.entries(currPrefixes)) {
        if(!(prefix in rmap)) {
          rmap[prefix] = []
        }
        rmap[prefix].push(name)
      }
      let updated = false
      for(const list of Object.values(rmap)) {
        if(list.length <= 1) {
          continue
        }
        // Add an extra character for all those that conflicts
        for(const name of list) {
          const len = currPrefixes[name].length
          const nextChar = name.at(len)
          if(nextChar != null) {
            currPrefixes[name] += len == 0 ? nextChar.toLocaleUpperCase() : nextChar.toLocaleLowerCase()
            updated = true
          }
        }
      }
      if(!updated) {
        break
      }
    }
    return this.templePrefixes = currPrefixes
  }
  getTemplePrefixes() {
    return this.templePrefixes ?? (this.templePrefixes = this.recalculateTemplePrefixes())
  }
  /**
   * Get unambiguous global numbering of the level.
   * 
   * Requires the following to be injected:
   * - ApiTemplesData.injectionKey
   * - TempleItemData.injectionKey
   * - GameItemData.injectionKey
   */
  static useDisambiguousNumbering(levelRef: Ref<LevelItemData>) {
    const templesData = inject(ApiTemplesData.injectionKey)
    const temple = inject(TempleItemData.injectionKey)
    const game = inject(GameItemData.injectionKey)
    return computed(() => {
      const gameNamespace = game?.value.level_namespace
      const gamePrefix = gameNamespace == null ? '' : (gameNamespace + '-')

      const templePrefix = (() => {
        if(templesData?.value == null || temple == null) {
          return ''
        }
        const prefixesMap = templesData.value.getTemplePrefixes()
        const templeLabel = temple.value.label
        return prefixesMap[templeLabel]
      })()
      
      const shownNumbering = levelRef.value.getShownNumbering().toString()
      const rectifiedShownNumbering = shownNumbering.at(0) == '-' ? ('(' + shownNumbering + ')') : shownNumbering
      return gamePrefix + templePrefix + rectifiedShownNumbering
    })
  }

  static injectionKey: InjectionKey<Ref<ApiTemplesData | null>> = Symbol('ApiTemplesData')
  static getLoaderForGame(gameKey: string | Ref<string>) {
    async function apiTemplesLoader(): Promise<ApiTemplesData> {
      const result = await Api.post('temples', { game: (typeof gameKey == 'string') ? gameKey : gameKey.value })
      if(result.success) {
        typia.assert<ApiTemplesData>(result.data)
        return plainToInstance(ApiTemplesData, result.data)
      } else {
        throw ApiError.fromApi(result.data)
      }
    }
    return apiTemplesLoader
  }
}
