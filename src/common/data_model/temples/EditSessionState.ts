import { inject, ref, type InjectionKey, type Ref } from 'vue'
import { instanceToInstance } from 'class-transformer'
import type ApiTemplesData from './ApiTemplesData'

/**
 * Manages the "editing session": while active, data mutations are allowed and
 * can be discarded by restoring a deep snapshot taken when editing began.
 */
export default class EditSessionState {
  static injectionKey: InjectionKey<EditSessionState> = Symbol('EditSessionState')

  readonly active: Ref<boolean> = ref(false)
  private current: ApiTemplesData | null = null
  private baseline: ApiTemplesData | null = null

  isActive() {
    return this.active.value
  }

  start(data: ApiTemplesData) {
    if(this.active.value) {
      return
    }
    this.current = data
    this.baseline = instanceToInstance(data)
    this.active.value = true
  }

  /** Undo all edits made during this session (keeps the current object identity). */
  cancel() {
    const current = this.current
    const baseline = this.baseline
    if(current != null && baseline != null) {
      current.editing_allowed = baseline.editing_allowed
      current.temples = baseline.temples
      current.mutation()
    }
    this.reset()
  }

  /**
   * Editing was committed.
   * Deep-clone the edited copy (dropping temporary editing flags) as new baseline.
   */
  commitDone() {
    const current = this.current
    if(current != null) {
      current.temples = Object.fromEntries(
        Object.entries(current.temples).map(([ key, value ]) => {
          return [ key, instanceToInstance(value) ]
        })
      )
      current.mutation()
    }
    this.reset()
  }

  baselineData(): ApiTemplesData | null {
    return this.baseline
  }

  private reset() {
    this.current = null
    this.baseline = null
    this.active.value = false
  }
}

export function useEditSession() {
  const session = inject(EditSessionState.injectionKey)
  if(session == null) {
    throw new Error('EditSessionState is not provided')
  }
  return session
}
