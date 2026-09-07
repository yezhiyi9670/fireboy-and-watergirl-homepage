import { inject, ref, type InjectionKey, type Ref } from 'vue'
import { instanceToInstance } from 'class-transformer'

/**
 * Structural view of the temples data that is subject to editing sessions.
 */
export type EditableTemplesData = {
  editing_allowed: boolean
  temples: Record<string, unknown>
  mutation: () => void
}

/**
 * Manages the "editing session": while active, data mutations are allowed and
 * can be discarded by restoring a deep snapshot taken when editing began.
 */
export default class EditSessionState {
  static injectionKey: InjectionKey<EditSessionState> = Symbol('EditSessionState')

  readonly active: Ref<boolean> = ref(false)
  private current: EditableTemplesData | null = null
  private baseline: EditableTemplesData | null = null

  isActive() {
    return this.active.value
  }

  start(data: EditableTemplesData) {
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
   * Keep a deep-cloned (to eliminate temporary editing flags) of edited copy as new baseline.
   */
  commitDone() {
    const current = this.current
    if(current != null) {
      current.temples = Object.fromEntries(
        Object.entries(current.temples).map(([key, value]) => {
          return [ key, instanceToInstance(value) ]
        })
      )
      current.mutation()
    }
    this.reset()
  }

  baselineData(): EditableTemplesData | null {
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
