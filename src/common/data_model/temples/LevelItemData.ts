import { Type } from "class-transformer"
import type { FieldSpecifiers } from "../field_specifier"
import LevelMetadata from "./LevelMetadata"
import { computed, inject, type ComputedRef } from "vue"
import TempleItemData from "./TempleItemData"
import GameItemData from "../home/GameItemData"

export default class LevelItemData {
  id!: number | string
  x!: number
  y!: number
  filename!: string
  time!: number
  mobileTime?: number
  required!: number
  _id!: number | string

  @Type(() => LevelMetadata)
  __metadata?: LevelMetadata

  __new_level_created_at?: number
  __cloned_from_iid?: number
  
  // Level type
  type?: 'general' | 'speed' | 'puzzle' | 'dark'
  
  // Tree-type exclusive
  initial?: boolean
  
  // Rows-type exclusive
  elements?: string[]

  // Fairytales wing exclusive
  wing?: number
  requirePerfects?: boolean

  // Friends exclusive
  skippable?: boolean
  shownId?: number | string
  
  // Level ratings
  rating?: number | string
  difficulty?: number | string
  puzzleLevel?: number | string
  skillLevel?: number | string
  diff?: number
  quality?: number
  
  // Commercial exclusive
  locked?: boolean
  unlock_key?: string
  
  // Other unknown stuff
  [key: string]: unknown

  static globalKnownKeys: FieldSpecifiers = {
    id: { label: 'ID', type: ['number', 'string'] },
    x: { label: 'X', type: 'number' },
    y: { label: 'Y', type: 'number' },
    filename: { label: '文件名', type: 'string' },
    time: { label: '多人限时', type: 'number' },
    mobileTime: { label: '单人限时', type: ['number', 'null'] },
    type: { label: '类型', type: [{
      'general': '常规', 'speed': '竞速', 'puzzle': '解密', 'dark': '黑暗'
    }, 'null'] },
  }
  static treeTypeKnownKeys: FieldSpecifiers = {
    initial: { label: '初始关卡', type: 'boolean' }
  }
  static rowsTypeKnownKeys: FieldSpecifiers = { }

  /**
   * Required injections:
   * - TempleItemData.injectionKey
   * - GameItemData.injectionKey
   */
  static useKnownKeys(): ComputedRef<FieldSpecifiers> {
    const temple = inject(TempleItemData.injectionKey)
    const game = inject(GameItemData.injectionKey)
    
    return computed(() => {
      const knownKeyDicts: FieldSpecifiers[] = []
      knownKeyDicts.push(this.globalKnownKeys)
      if(temple?.value.type == 'rows') {
        knownKeyDicts.push(this.rowsTypeKnownKeys)
      }
      if(temple?.value.type == 'tree') {
        knownKeyDicts.push(this.treeTypeKnownKeys)
      }
      if(game?.value.level_extra_fields) {
        knownKeyDicts.push(game?.value.level_extra_fields)
      }
      return Object.assign({}, ...knownKeyDicts)
    })
  }

  isOffscreen() {
    return this.x <= -0.005 || this.y <= -0.005 || this.x >= 1.005 || this.y >= 1.005
  }
  getShownNumbering() {
    const str = this.shownId ?? this.id
    const num = +str
    if(num == num) {
      return num
    }
    return str
  }
  getShownTitle() {
    if(this.__metadata?.title != null) {
      return this.__metadata.title
    }
    return '关卡 ' + this.getShownNumbering()
  }
  static formatWalkthroughDuration(seconds?: number) {
    if(seconds == null) {
      return '缺失'
    }
    const remainSeconds = seconds % 60
    const minutes = Math.round((seconds - remainSeconds) / 60)
    return minutes.toString().padStart(2, '0') + ':' + remainSeconds.toString().padStart(2, '0')
  }
}
