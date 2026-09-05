import { computed, inject, reactive, type InjectionKey, type Ref, type WritableComputedRef } from 'vue'

export default class TempleExpandState {
  static injectionKey: InjectionKey<TempleExpandState> = Symbol('TempleExpandState')

  private readonly expandedMap: Record<string, boolean> = reactive(Object.create(null))

  isExpanded(templeKey: string) {
    return this.expandedMap[templeKey] ?? true
  }
  setExpanded(templeKey: string, expanded: boolean) {
    this.expandedMap[templeKey] = expanded
  }
}

export function useTempleExpanded(templeKey: Ref<string>): WritableComputedRef<boolean> {
  const state = inject(TempleExpandState.injectionKey)
  if(state == null) {
    throw new Error('TempleExpandState is not provided')
  }
  return computed({
    get: () => state.isExpanded(templeKey.value),
    set: (expanded: boolean) => state.setExpanded(templeKey.value, expanded),
  })
}
