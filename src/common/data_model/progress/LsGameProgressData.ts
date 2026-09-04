import { Exclude, plainToInstance, Type } from "class-transformer";
import TempleProgress from "./TempleProgress";
import type { InjectionKey, Ref } from "vue";
import type GameItemData from "../home/GameItemData";
import typia from "typia";
import type ApiTemplesData from "../temples/ApiTemplesData";
import ProgressRepairTreatment from "./repair/ProgressRepairTreatment";
import ProgressRepairLevelList from "./repair/ProgressRepairLevelList";

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

  calculateRepairTreatment(that: ApiTemplesData) {
    let needsRepair = false
    const treatment = new ProgressRepairTreatment()
    
    const thisTempleIds: Set<string> = new Set(this.temples.map(temple => temple.id))
    const thatTempleIds: Set<string> = new Set(Object.values(that.temples).map(temple => temple.id))
    treatment.unexpectedTempleIds = thisTempleIds.difference(thatTempleIds).values().toArray()
    needsRepair ||= treatment.unexpectedTempleIds.length > 0

    const commonTemples = thisTempleIds.intersection(thatTempleIds)
    for(const templeId of commonTemples) {
      const thisLevelList = this.getTemple(templeId)!.levels
      const thatLevelList = that.temples[templeId]!.levels
      const thisLevelIids = new Set(thisLevelList.map(level => level._id))
      const thatLevelIids = new Set(thatLevelList.map(level => level._id))
      const levelList = new ProgressRepairLevelList()
      levelList.unexpectedLevelIids = thisLevelIids.difference(thatLevelIids).values().toArray()
      if(levelList.unexpectedLevelIids.length > 0) {
        treatment.templeIdToLevelList[templeId] = levelList
        needsRepair = true
      }
    }

    return needsRepair ? treatment : null
  }

  performRepairTreatment_(treatment: ProgressRepairTreatment) {
    const templesToRemove = treatment.unexpectedTempleIds
    this.temples = this.temples.filter(item => templesToRemove.indexOf(item.id) == -1)
    for(const temple of this.temples) {
      const levelList = treatment.templeIdToLevelList[temple.id]
      if(levelList == null) {
        continue
      }
      const levelIidsToRemove = levelList.unexpectedLevelIids
      temple.levels = temple.levels.filter(item => levelIidsToRemove.indexOf(item._id) == -1)
      temple.mutation()
    }
    this.mutation()
  }

  static typiaAssert(rawData: unknown) {
    typia.assert<LsGameProgressData>(rawData)
  }

  static injectionKey: InjectionKey<Ref<LsGameProgressData | null>> = Symbol('LsGameProgressData')
  static reloadInjectionKey: InjectionKey<() => void> = Symbol('LsGameProgressData_reload')
  static getLoaderForGame(gameRef: GameItemData | Ref<GameItemData>) {
    async function progressLoader(): Promise<LsGameProgressData | null> {
      const game = ('value' in gameRef) ? gameRef.value : gameRef
      const json = localStorage.getItem(game.storage_namespace + ':progress')
      if(json == null || json == '') {
        return null
      }
      const rawData = JSON.parse(json)
      LsGameProgressData.typiaAssert(rawData)
      return plainToInstance(LsGameProgressData, rawData)
    }
    return progressLoader
  }
}
