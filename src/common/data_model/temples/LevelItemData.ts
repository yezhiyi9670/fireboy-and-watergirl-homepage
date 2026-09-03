import { Type } from "class-transformer"
import type { FieldSpecifiers } from "../field_specifier"
import { LevelMetadata } from "./LevelMetadata"

export class LevelItemData {
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
  
  // Progress data
  opened?: boolean

  // Other unknown stuff
  [key: string]: unknown

  static globalKnownKeys: FieldSpecifiers = {
    id: ['number', 'string'],
    x: 'number',
    y: 'number',
    filename: 'string',
    time: 'number',
    mobileTime: 'number',
    type: { 'general': '常规', 'speed': '竞速', 'puzzle': '解密', 'dark': '黑暗' },
  }
  static treeTypeKnownKeys: FieldSpecifiers = {
    initial: 'boolean'
  }
  static rowsTypeKnownKeys: FieldSpecifiers = {
    elements: 'object'
  }
  static progressKnownKeys: FieldSpecifiers = {
    opened: 'boolean',
    'best.diamonds': 'number',
    'best.time': 'number',
    'best.silverDiamond': 'number',
    'best.stars': 'number'
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
