import { provide, ref, type InjectionKey, type Ref } from "vue";

export type LoadingState = 'loading' | 'success' | 'error'

export function useLoadData<T>(
  loader: () => Promise<T>,
  loadNow: boolean
): [Ref<LoadingState>, Ref<T | null>, Ref<Error | null>, () => void] {
  const lastState = ref<LoadingState>('error')
  const lastValue = ref<T | null>(null) as Ref<T | null>
  const lastError = ref<Error | null>(null)
  function triggerReload() {
    if(lastState.value == 'loading') {
      return
    }
    lastState.value = 'loading'
    loader().then(value => {
      lastState.value = 'success'
      lastValue.value = value
    }).catch(err => {
      console.warn('Data loading failed:', err)
      lastState.value = 'error'
      lastError.value = err
    })
  }
  if(loadNow) {
    triggerReload()
  }
  return [lastState, lastValue, lastError, triggerReload]
}
