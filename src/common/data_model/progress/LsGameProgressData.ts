import { Exclude, plainToInstance, Type } from "class-transformer";
import TempleProgress from "./TempleProgress";
import type { InjectionKey, Ref } from "vue";
import type GameItemData from "../home/GameItemData";
import typia from "typia";

export default class LsGameProgressData {
  @Type(() => TempleProgress)
  temples!: TempleProgress[]

  @Exclude()
  private init: boolean = false
  @Exclude()
  private templeIdToTemple: Record<string, TempleProgress> = Object.create(null)
  mutation() {
    this.init = true
    const mapping = Object.create(null)
    for(const temple of this.temples) {
      mapping[temple.id] = temple
    }
    this.templeIdToTemple = mapping
  }
  ensureInit() {
    if(!this.init) {
      this.mutation()
    }
  }

  getTemple(templeId: string) {
    this.ensureInit()
    if(!(templeId in this.templeIdToTemple)) {
      return null
    }
    return this.templeIdToTemple[templeId]
  }

  static injectionKey: InjectionKey<Ref<LsGameProgressData | null>> = Symbol('LsGameProgressData')
  static getLoaderForGame(gameRef: GameItemData | Ref<GameItemData>) {
    async function progressLoader(): Promise<LsGameProgressData> {
      const game = ('value' in gameRef) ? gameRef.value : gameRef
      const json = localStorage.getItem(game.storage_namespace + ':progress')
      if(json == null || json == '') {
        return null
      }
      const rawData = JSON.parse(json)
      typia.assert<LsGameProgressData>(rawData)
      return plainToInstance(LsGameProgressData, rawData)
    }
    return progressLoader
  }
}
