import { Exclude, instanceToPlain, plainToInstance } from "class-transformer"
import TempleItemData from "./TempleItemData"
import EditSessionState from "./EditSessionState"
import { computed, inject, type InjectionKey, type Ref } from "vue"
import { Api } from "../../api/Api"
import ApiError from "../ApiError"
import typia from "typia"
import { TransformNPDict } from "../../utils/class_transform"
import LevelItemData from "./LevelItemData"
import GameItemData from "../home/GameItemData"

export default class ApiTemplesData {
  editing_allowed!: boolean

  @TransformNPDict(TempleItemData)
  temples!: Record<string, TempleItemData>

  @Exclude()
  private templePrefixes: Record<string, string> | null = null

  mutation() {
    this.recalculateTemplePrefixes()
  }

  /**
   * Expensive. Shall be memoized when rendering.
   */
  calculateSortedTemples() {
    const ret = Object.entries(this.temples)
    ret.sort((a, b) => {
      function absEvenOdd(val: number) {
        if(val < 0) {
          return 2 * (-val) - 1
        } else {
          return 2 * val
        }
      }
      return absEvenOdd(a[1].index) - absEvenOdd(b[1].index)
    })
    return ret
  }

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

  hasLevelFilename(filename: string) {
    for(const temple of Object.values(this.temples)) {
      if(temple.levels.some(level => level.filename === filename)) {
        return true
      }
    }
    return false
  }

  /**
   * Pick `<stem>_<n>.json` where `n` is the smallest positive integer whose
   * filename is not yet used by any level in the whole game.
   */
  nextCloneFilename(origFilename: string) {
    const stem = origFilename.endsWith('.json')
      ? origFilename.slice(0, -'.json'.length)
      : origFilename
    let n = 1
    while(this.hasLevelFilename(stem + '_' + n + '.json')) {
      n++
    }
    return stem + '_' + n + '.json'
  }

  private uniqueLevelFilename(baseFilename: string) {
    if(!this.hasLevelFilename(baseFilename)) {
      return baseFilename
    }
    return this.nextCloneFilename(baseFilename)
  }

  /**
   * Append a brand-new level with the standard default fields.
   * The default filename is `${templeKey}/levels/${temple.id}_${id}.json`; when
   * it is already taken, a game-wide unique `_<n>` suffix is appended instead.
   */
  createLevel_(templeKey: string, id: string | number, iid: string | number): LevelItemData {
    const temple = this.temples[templeKey]
    if(temple == null) {
      throw new Error('未找到圣殿')
    }
    if(temple.isLevelIdOccupied(id)) {
      throw new Error('id ' + id + ' 已被占用')
    }
    if(temple.isLevelIidOccupied(iid)) {
      throw new Error('_id ' + iid + ' 已被占用')
    }
    const baseFilename = templeKey + '/levels/' + temple.id + '_' + id + '.json'
    const raw: Partial<LevelItemData> = {
      id,
      _id: iid,
      x: 0.5,
      y: 0.5,
      time: 1,
      mobileTime: 1,
      required: 0,
      filename: this.uniqueLevelFilename(baseFilename),
      type: 'general',
      initial: false,
    }
    typia.assert<LevelItemData>(raw)
    const level = plainToInstance(LevelItemData, raw)
    level.__new_level_created_at = Date.now()
    level.__source_filename = false
    temple.levels.push(level)
    temple.mutation()
    temple.markDirty()
    return level
  }

  /**
   * Append a deep clone of `sourceIid`, with new ids and a game-wide-unique
   * clone filename, to the given temple.
   */
  cloneLevel_(templeKey: string, sourceIid: string | number, newId: string | number, newIid: string | number): LevelItemData {
    const temple = this.temples[templeKey]
    if(temple == null) {
      throw new Error('未找到圣殿')
    }
    if(temple.isLevelIdOccupied(newId)) {
      throw new Error('id ' + newId + ' 已被占用')
    }
    if(temple.isLevelIidOccupied(newIid)) {
      throw new Error('_id ' + newIid + ' 已被占用')
    }
    const source = temple.getLevelByIid(sourceIid)
    if(source == null) {
      throw new Error('未找到要克隆的关卡')
    }
    const plain: Partial<LevelItemData> = instanceToPlain(source)
    plain.id = newId
    plain._id = newIid
    plain.filename = this.nextCloneFilename(source.filename)
    typia.assert<LevelItemData>(plain)
    const clone = plainToInstance(LevelItemData, plain)
    clone.__new_level_created_at = Date.now()
    clone.__source_filename = source.getOriginalFilename()
    temple.levels.push(clone)
    temple.mutation()
    temple.markDirty()
    return clone
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
  static getLoaderForGameId(gameKey: string | Ref<string>) {
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

  /**
   * Required injection:
   * - ApiTemplesData.injectionKey
   */
  static useIsEditingAllowed() {
    const temples = inject(ApiTemplesData.injectionKey)
    const session = inject(EditSessionState.injectionKey)
    return computed(() => {
      return (temples?.value?.editing_allowed ?? false) && (session?.isActive() ?? false)
    })
  }
}
