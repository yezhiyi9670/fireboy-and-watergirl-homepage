import { type InjectionKey } from 'vue'

export type LevelActionSet = {
  requestDelete: () => void
  requestClone: () => void
}

/**
 * Lets the sidebar-level shortcut handler reach dialog-triggering actions of
 * the currently mounted level property panel.
 */
export default class EditorActionHost {
  static injectionKey: InjectionKey<EditorActionHost> = Symbol('EditorActionHost')

  private levelActions: LevelActionSet | null = null

  registerLevelActions(actions: LevelActionSet) {
    this.levelActions = actions
  }
  unregisterLevelActions() {
    this.levelActions = null
  }
  requestLevelDelete() {
    this.levelActions?.requestDelete()
  }
  requestLevelClone() {
    this.levelActions?.requestClone()
  }
}
