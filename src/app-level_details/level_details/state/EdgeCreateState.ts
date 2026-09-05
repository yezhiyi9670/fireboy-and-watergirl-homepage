import { ref, type InjectionKey, type Ref } from 'vue'
import { sameIid } from './LevelSelectionState.ts'

export type LinkSource = {
  templeKey: string
  levelIid: string | number
}

/**
 * Transient "I am about to create a connection from this level" state.
 *
 * Consumed by level/gallery click handlers (batch 3) and by `TempleTitle` to
 * swap its action buttons while linking is pending.
 */
export default class EdgeCreateState {
  static injectionKey: InjectionKey<EdgeCreateState> = Symbol('EdgeCreateState')

  readonly source: Ref<LinkSource | null> = ref(null)

  isLinking() {
    return this.source.value != null
  }
  isSource(templeKey: string, levelIid: string | number) {
    const source = this.source.value
    return source != null
      && source.templeKey === templeKey
      && sameIid(source.levelIid, levelIid)
  }
  start(templeKey: string, levelIid: string | number) {
    this.source.value = { templeKey, levelIid }
  }
  cancel() {
    this.source.value = null
  }
}
