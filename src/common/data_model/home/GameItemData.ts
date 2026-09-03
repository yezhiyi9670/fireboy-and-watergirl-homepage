import type { InjectionKey, Ref } from "vue"
import { ExtraLevelsInfoData } from "./ExtraLevelsInfoData"
import { GameInfoData } from "./GameInfoData"
import { GameUrlInfo } from "./GameUrlInfo"
import { Type } from "class-transformer"

export class GameItemData {
  name: string = ''
  @Type(() => GameUrlInfo) url?: GameUrlInfo
  storage_namespace: string = ''
  level_namespace?: string = ''
  cheat_flags?: string[]
  @Type(() => ExtraLevelsInfoData) extras?: ExtraLevelsInfoData
  created?: string
  @Type(() => GameInfoData) info?: GameInfoData
  accept_legacy_import?: boolean

  canBeConsideredNew(date?: Date) {
    if(this.created == null) {
      return false
    }
    const theDate = new Date(this.created)
    const thresholdMillis = 1000 * 86400 * 30
    return (+(date ?? new Date())) - (+theDate) < thresholdMillis
  }

  static kInjectionKey: InjectionKey<Ref<string>> = Symbol('GameItemData_k')
  static injectionKey: InjectionKey<Ref<GameItemData>> = Symbol('GameItemData')
}
