import { Exclude, Type } from "class-transformer"
import { persistentField, transientField, type FieldSpecifier, type FieldSpecifiers } from "../field_specifier"
import LevelMetadata from "./LevelMetadata"
import { computed, inject, type ComputedRef } from "vue"
import TempleItemData from "./TempleItemData"
import GameItemData from "../home/GameItemData"

export default class LevelItemData {
  id!: number | string
  _id!: number | string
  x!: number
  y!: number
  filename!: string
  time!: number
  mobileTime?: number
  required!: number

  @Type(() => LevelMetadata)
  __metadata?: LevelMetadata       // Do not exclude, since must hydrate from API data

  /**
   * UNIX millisecond timestamp of newly-created levels in this edit session.
   * 
   * Used to sort levels.
   * Should not appear in submission or survive cloning.
   */
  @Exclude()
  __new_level_created_at?: number
  
  /**
   * Source filename of file-renamed and cloned levels.
   * 
   * `false` indicates that this is a brand-new level with no existing level to copy from
   * Should not appear in submission or survive cloning.
   */
  @Exclude()
  __source_filename?: string | false

  // Level type
  type?: 'general' | 'speed' | 'puzzle' | 'dark'
  
  // Tree-type exclusive
  initial?: boolean
  
  // Rows-type exclusive
  elements?: unknown  // string[]

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

  /**
   * This must be mutually compatible with type declaration
   * of explicitly defined keys in the class.
   * 
   * Persistent/Transient:
   * - Persistent fields are always shown in the list. They
   *   should be well-known and almost always meaningful.
   * - Transient fields are only shown in the list when not
   *   undefined. Normally unknown fields should be transient.
   * 
   * Mandatory/Optional:
   * - If the type contains `undefined`, it means that the field
   *   is optional and can be absent.
   *   (in JSON, undefined and absence are equivalent.
   *    Undefined fields are gone on JSON.stringify)
   * - If type contains no `undefined`, value is required to be
   *   present.
   * - `null` is an ordinary and existent value, and does not serve
   *   as indication of optionality.
   */
  static allKeys: FieldSpecifiers = {
    id: persistentField('id（用作一般编号）', ['number', 'string']),
    _id: persistentField('_id（用作唯一标识符）', ['number', 'string']),
    x: persistentField('X', 'number'),
    y: persistentField('Y', 'number'),
    filename: persistentField('文件名', 'string'),
    time: persistentField('默认限时', 'number'),
    mobileTime: persistentField('单人限时', ['undefined', 'number']),
    required: transientField('required', 'number'),

    type: persistentField('类型', ['undefined', {
      'general': '常规', 'speed': '竞速', 'puzzle': '解密', 'dark': '黑暗'
    }]),
    initial: transientField('initial', ['undefined', 'boolean']),
    elements: transientField('elements', ['undefined', 'unknown'], []),

    wing: transientField('wing', ['undefined', 'number']),
    requirePerfects: transientField('requirePerfects', ['undefined', 'boolean']),

    skippable: transientField('skippable', ['undefined', 'boolean']),
    shownId: transientField('shownId', ['undefined']),

    rating: transientField('rating', ['undefined', 'number', 'string']),
    difficulty: transientField('difficulty', ['undefined', 'number', 'string']),
    puzzleLevel: transientField('puzzleLevel', ['undefined', 'number', 'string']),
    skillLevel: transientField('skillLevel', ['undefined', 'number', 'string']),
    diff: transientField('diff', ['undefined', 'number']),
    quality: transientField('quality', ['undefined', 'number']),

    locked: transientField('locked', ['undefined', 'boolean']),
    unlock_key: transientField('unlock_key', ['undefined', 'string']),
  }
  /**
   * Spec for other fields not in allKeys.
   * Must be mutually compatible with the type declaration of the rest-keys entry in the class.
   */ 
  static restSpec: FieldSpecifier = transientField('', [ 'undefined', 'null', 'number', 'string', 'boolean', 'unknown' ], null)
  /**
   * Specs overlayed onto allKeys when temple has type=='tree'
   */
  static treeTypeKeysOverlay: FieldSpecifiers = {
    initial: persistentField('初始关卡', ['undefined', 'boolean']),
  }
  /**
   * Specs overlayed onto allKeys when temple has type=='row'
   */
  static rowsTypeKeysOverlay: FieldSpecifiers = {
    elements: persistentField('元素', ['undefined', 'unknown'], [])
  }

  /**
   * Get allKeys specifiers with temple-type and game-specific (defined on backend res) overlays applied.
   * 
   * Required injections:
   * - TempleItemData.injectionKey
   * - GameItemData.injectionKey
   */
  static useKnownKeys(): ComputedRef<FieldSpecifiers> {
    const temple = inject(TempleItemData.injectionKey)
    const game = inject(GameItemData.injectionKey)
    
    return computed(() => {
      const knownKeyDicts: FieldSpecifiers[] = []
      knownKeyDicts.push(this.allKeys)
      if(temple?.value.type == 'rows') {
        knownKeyDicts.push(this.rowsTypeKeysOverlay)
      }
      if(temple?.value.type == 'tree') {
        knownKeyDicts.push(this.treeTypeKeysOverlay)
      }
      if(game?.value.level_fields_overlay) {
        knownKeyDicts.push(game?.value.level_fields_overlay)
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
  getOriginalFilename() {
    return this.__source_filename ?? this.filename
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
