import { Exclude, Type } from "class-transformer"
import LevelProgress from "./LevelProgress"

export default class TempleProgress {
  id!: string

  @Type(() => LevelProgress)
  levels!: LevelProgress[]

  @Exclude()
  private init: boolean = false
  @Exclude()
  private levelIidToLevel: Record<string | number, LevelProgress> = Object.create(null)

  mutation() {
    this.init = true
    const mapping: Record<string | number, LevelProgress> = Object.create(null)
    for(const level of this.levels) {
      if(level._id in mapping) {
        console.warn('Duplicate level iid', level._id)
      }
      mapping[level._id] = level
    }
    this.levelIidToLevel = mapping
  }
  ensureInit() {
    if(!this.init) {
      this.mutation()
    }
  }

  getLevelByIid(levelIid: string | number) {
    this.ensureInit()
    if(!(levelIid in this.levelIidToLevel)) {
      return null
    }
    return this.levelIidToLevel[levelIid]
  }
}
