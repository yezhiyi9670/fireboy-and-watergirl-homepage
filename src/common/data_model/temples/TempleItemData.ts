import { Exclude, plainToInstance, Type } from "class-transformer"
import EdgeItemData from "./EdgeItemData"
import LevelItemData from "./LevelItemData"
import type { InjectionKey, Ref } from "vue"
import { asFiniteNumber, idsEqual } from "./idUtil"
import typia from "typia"

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

  @Exclude()
  private dirtyFlag: boolean = false

  @Exclude()
  private init: boolean = false
  @Exclude()
  private levelIidToLevel: Record<string | number, LevelItemData> = Object.create(null)

  mutation() {
    this.init = true
    const mapping: Record<string | number, LevelItemData> = Object.create(null)
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

  isDirty() {
    return this.dirtyFlag
  }
  markDirty() {
    this.dirtyFlag = true
  }

  // --- Read-only queries ---------------------------------------------------

  private maxNumeric(values: Iterable<unknown>): number | null {
    let max: number | null = null
    for(const value of values) {
      const num = asFiniteNumber(value)
      if(num != null && (max == null || num > max)) {
        max = num
      }
    }
    return max
  }

  isLevelIdOccupied(id: string | number) {
    return this.levels.some(level => idsEqual(level.id, id))
  }
  isLevelIidOccupied(iid: string | number) {
    return this.levels.some(level => idsEqual(level._id, iid))
  }

  /**
   * Suggested numeric id: largest numeric `id` in this temple (ignoring ids
   * that are not convertible to numbers) plus one.
   */
  nextFreeLevelId(): number {
    const max = this.maxNumeric(this.levels.map(level => level.id))
    return (max == null ? 0 : max) + 1
  }
  nextFreeLevelIid(): number {
    const max = this.maxNumeric(this.levels.map(level => level._id))
    return (max == null ? 0 : max) + 1
  }

  hasEdgeBetween(aIid: string | number, bIid: string | number) {
    return this.edges.some(edge =>
      (idsEqual(edge.source, aIid) && idsEqual(edge.target, bIid)) ||
      (idsEqual(edge.source, bIid) && idsEqual(edge.target, aIid))
    )
  }
  nextFreeEdgeId(): number {
    const max = this.maxNumeric(this.edges.map(edge => edge.id))
    return (max == null ? 0 : max) + 1
  }
  nextFreeEdgeIid(): number {
    const max = this.maxNumeric(this.edges.map(edge => edge._id))
    return (max == null ? 0 : max) + 1
  }

  // --- Mutations (trailing underscore: these alter real data) --------------

  /**
   * Rename `id` and/or `_id` of one level, updating edges.
   */
  renameLevelIds_(oldIid: string | number, newId: string | number, newIid: string | number): LevelItemData {
    const level = this.getLevelByIid(oldIid)
    if(level == null) {
      throw new Error('未找到要修改的关卡')
    }
    if(!idsEqual(newId, level.id) && this.isLevelIdOccupied(newId)) {
      throw new Error('id ' + newId + ' 已被占用')
    }
    if(!idsEqual(newIid, oldIid) && this.isLevelIidOccupied(newIid)) {
      throw new Error('_id ' + newIid + ' 已被占用')
    }
    if(!idsEqual(newIid, oldIid)) {
      for(const edge of this.edges) {
        if(idsEqual(edge.source, oldIid)) {
          edge.source = newIid
        }
        if(idsEqual(edge.target, oldIid)) {
          edge.target = newIid
        }
      }
      level._id = newIid
    }
    level.id = newId
    if(!idsEqual(newIid, oldIid)) {
      this.mutation()
    }
    this.markDirty()
    return level
  }

  /**
   * Delete one level and everything that referenced it inside this temple.
   */
  deleteLevel_(iid: string | number): LevelItemData {
    const index = this.levels.findIndex(level => idsEqual(level._id, iid))
    if(index < 0) {
      throw new Error('未找到要删除的关卡')
    }
    const removed = this.levels[index]
    this.edges = this.edges.filter(edge =>
      !idsEqual(edge.source, iid) && !idsEqual(edge.target, iid)
    )
    this.levels.splice(index, 1)
    this.mutation()
    this.markDirty()
    return removed
  }

  /**
   * Create a connection between two existing levels of this temple.
   */
  createEdge_(aIid: string | number, bIid: string | number): EdgeItemData {
    if(this.getLevelByIid(aIid) == null || this.getLevelByIid(bIid) == null) {
      throw new Error('连接的关卡不存在')
    }
    if(idsEqual(aIid, bIid)) {
      throw new Error('不能连接关卡自身')
    }
    if(this.hasEdgeBetween(aIid, bIid)) {
      throw new Error('这两个关卡之间已有连接')
    }
    const raw: Record<string, unknown> = {
      id: this.nextFreeEdgeId(),
      _id: this.nextFreeEdgeIid(),
      source: aIid,
      target: bIid,
    }
    typia.assert<EdgeItemData>(raw)
    const edge = plainToInstance(EdgeItemData, raw)
    this.edges.push(edge)
    this.markDirty()
    return edge
  }

  /**
   * Remove a specific edge from this temple.
   */
  deleteEdge_(edge: EdgeItemData) {
    const index = this.edges.findIndex(candidate => candidate === edge)
    if(index >= 0) {
      this.edges.splice(index, 1)
      this.markDirty()
    }
  }

  /**
   * Toggle visibility of a specific edge.
   */
  setEdgeHidden_(edge: EdgeItemData, hidden: boolean) {
    const index = this.edges.findIndex(candidate => candidate === edge)
    if(index >= 0 && this.edges[index].hidden !== hidden) {
      this.edges[index].hidden = hidden
      this.markDirty()
    }
  }

  /**
   * Expensive. Shall be memoized when rendering.
   */
  calculateSortedLevels() {
    const ret: LevelItemData[] = [ ...this.levels ]
    ret.sort((a, b) => {
      // Levels created during this session are always sorted last, by creation time.
      const aNew = a.__new_level_created_at != null
      const bNew = b.__new_level_created_at != null
      if(aNew !== bNew) {
        return aNew ? 1 : -1
      }
      if(aNew && bNew) {
        return (a.__new_level_created_at as number) - (b.__new_level_created_at as number)
      }
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

  /**
   * Run typia.assert on this type.
   * Use in environments not capable of Typia transpilation (e.g. Vue SFC)
   */
  static typiaAssert(rawData: unknown) {
    typia.assert<TempleItemData>(rawData)
  }
}
