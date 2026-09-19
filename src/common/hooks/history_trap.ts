import { inject, onUnmounted, provide, watch, type InjectionKey, type Ref } from "vue";
import { useRouter, type RouteLocation, type Router } from "vue-router";

type BackAction = (event: PopStateEvent) => boolean
interface HistoryTrapInfo {
  id: string
  backAction: BackAction
  armed: boolean
}
type TrapStateRecord = {
  __history_trap?: string
} | undefined
type PreTrapStateRecord = {
  __history_pre_trap?: string
} | undefined

class HistoryPopController {
  private inProgress: boolean = false
  async waitUntilIdle() {
    while(true) {
      if(!this.inProgress) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 1))
    }
  }
  async maybePop() {
    await this.waitUntilIdle()
    // FIXME: We cannot pop the top. We can only move to the second top.
    this.inProgress = true
    history.back()  // is async, have no sync way to mimic this
    await new Promise<void>(resolve => {
      const listener = () => {
        removeEventListener('popstate', listener)
        resolve()
      }
      // detect back() finish with popstate.
      // https://developer.mozilla.org/zh-CN/docs/Web/API/History/back
      addEventListener('popstate', listener)
    })
    this.inProgress = false
  }
}

let contextCounter = 0
class HistoryTrapContext {
  traps: HistoryTrapInfo[] = []
  private disposed: boolean = false
  private disposeHook?: () => void
  private contextSerial = 0
  private contextId = ''
  private trapSerial = 0
  private pendingActuation: number | null = null
  private popController = new HistoryPopController()

  router?: Router

  log(..._args: unknown[]) {
    // console.log(`${this.constructor.name}:`, ..._args)
  }

  constructor(
    router?: Router
  ) {
    this.router = router
    this.contextSerial = contextCounter++
    this.contextId = `${contextCounter}`
  }

  static injectionKey: InjectionKey<HistoryTrapContext> = Symbol('HistoryTrapContext')

  nextId(idDescriptor: string | undefined) {
    return `${idDescriptor ?? ''}-${this.contextSerial}_${this.trapSerial++}`
  }

  private indexOfTrap(id: unknown) {
    if(typeof id != 'string') {
      return -1
    }
    for(const [index, t] of this.traps.entries()) {
      if(t.id == id) {
        return index
      }
    }
    return -1
  }
  private lastArmedTrapIndex() {
    // Only the last armed trap gets actuated into browser `history`
    for(let i = this.traps.length - 1; i >= 0; i--) {
      const trap = this.traps[i]
      if(trap.armed) {
        return i
      }
    }
    return -1
  }

  /**
   * Is history state currently on a trap frame of this context
   */
  private isOnMyTrapFrame() {
    return this.contextId == (history.state as TrapStateRecord)?.__history_trap
  }
  /**
   * Actuate update.
   * - If currently not on a trap frame of mine and we need one, push a trap frame.
   * - If currently on a trap frame of mine and we don't need one, pop it.
   * 
   * Trap frames only point to a context, not a trap. The context keeps track of which trap is on top now.
   * Trap frames of different traps in the same context are indistinguishable.
   */
  private async actuateUpdate() {
    this.cancelScheduledActuateUpdate()
    await this.popController.waitUntilIdle()
    const current = this.isOnMyTrapFrame()
    const wanted = this.lastArmedTrapIndex() != -1
    if(current == wanted) {
      return
    }
    if(current) {
      this.log('pop trap frame')
      await this.popController.maybePop()
    }
    if(wanted) {
      this.log('push trap frame')
      // In the `popstate` handler, `evt.state` is the state the pop landed on,
      // not the state the pop started at. So we need to record a `pre_trap` on the
      // current frame before pushing the trap frame, enabling us to know that
      // we need to execute the hook when we land here.
      history.replaceState({
        ...history.state,
        ...{ __history_pre_trap: this.contextId } satisfies PreTrapStateRecord
      }, '')
      history.pushState({ __history_trap: this.contextId } satisfies TrapStateRecord, '')
    }
  }
  private cancelScheduledActuateUpdate() {
    if(this.pendingActuation != null) {
      cancelAnimationFrame(this.pendingActuation)
    }
    this.pendingActuation = null
  }
  private scheduleActuateUpdate() {
    this.cancelScheduledActuateUpdate()
    this.pendingActuation = requestAnimationFrame(() => this.actuateUpdate())
  }

  armTrap(trap: HistoryTrapInfo) {
    if(this.indexOfTrap(trap.id) == -1) {
      throw new Error(`Trap ${trap.id} must be in the context to be armed.`)
    }
    if(trap.armed) {
      return
    }
    // Move newly armed trap to the end (so it takes precedence)
    this.removeTrap(trap)
    this.addTrap(trap)
    // Arm the trap
    this.log('arm', trap.id)
    trap.armed = true
    this.scheduleActuateUpdate()
  }
  disarmTrap(trap: HistoryTrapInfo) {
    if(this.indexOfTrap(trap.id) == -1) {
      throw new Error(`Trap ${trap.id} must be in the context to be disarmed.`)
    }
    if(!trap.armed) {
      return
    }
    this.log('disarm', trap.id)
    trap.armed = false
    this.scheduleActuateUpdate()
  }
  addTrap(trap: HistoryTrapInfo) {
    if(this.indexOfTrap(trap.id) != -1) {
      throw new Error(`Trap ${trap.id} must already in the context, cannot add.`)
    }
    if(trap.armed) {
      throw new Error(`Trap ${trap.id} must be in non-armed state to be added.`)
    }
    // this.log('add', trap.id)
    this.traps.push(trap)
  }
  removeTrap(trap: HistoryTrapInfo) {
    const index = this.indexOfTrap(trap.id)
    if(index == -1) {
      throw new Error(`Trap ${trap.id} must be in the context to be removed.`)
    }
    // this.log('remove', trap.id)
    if(trap.armed) {
      this.disarmTrap(trap)
    }
    this.traps.splice(index, 1)
  }

  init() {
    // FIXME: router does not support removing handlers yet, so disposing WILL
    // result in memory leak. 
    // No way to fix for us. But fix if router started supporting removing handlers.
    const routerBeforeHandler = (to: RouteLocation, from: RouteLocation) => {
      if(this.disposed) {
        return
      }
      if(from.fullPath == to.fullPath) {
        // May be a navigation caused by history trap itself of trapped "back" action
        return
      }
      if(history.state?.replaced) {
        return
      }
      this.log('before each', history.state)
      // Currently causes bug:
      // - `/A`
      // - Navigate: `/A -> /B`
      // - Engate trap: `/A -> /B -> /B (trap)`
      // - Force-navigate via browser, trap still engaged: `/A -> /B -> /B (trap) -> /C -> /C (trap)`
      // - Exit trap: `/A -> /B -> /B (trap) -> /C`
      // - Back: `/A -> /B -> /B (trap)`
      //   - On before: If we do stash: `/A -> /B`
      //   - Since `back` is async, on after, when actuacting, we still see trap frame, so back again: `/A`
      // Commenting out the stash on before could produce the exactly right behavior, at least while using "back".
      // this.stash()
    }
    this.router?.beforeEach(routerBeforeHandler)
    
    const routerAfterHandler = (to: RouteLocation, from: RouteLocation) => {
      if(this.disposed) {
        return
      }
      if(from.fullPath == to.fullPath) {
        // May be a navigation caused by history trap itself of trapped "back" action
        return
      }
      if(history.state?.replaced) {
        // If a history replace is, violating the contract, done directly on a trap frame,
        // make it no longer a trap frame to prevent issues.
        // Will however cause the net effect to be a "push" rather than a "replace", but
        // can avoid visible issues until the user has tried to perform "back".
        history.replaceState({
          ...history.state,
          ...{ __history_trap: undefined } satisfies TrapStateRecord
        }, '')
      }
      this.log('after each', history.state, to)
      this.scheduleActuateUpdate()
    }
    this.router?.afterEach(routerAfterHandler)
    
    const popstateHandler = (evt: PopStateEvent) => {
      const isOnPreTrapFrame = this.contextId == (evt.state as PreTrapStateRecord)?.__history_pre_trap
      if(!isOnPreTrapFrame) {
        return
      }
      const index = this.lastArmedTrapIndex()
      if(index == -1) {
        return
      }
      const trap = this.traps[index]
      // Execute the hook
      this.log('exec hook', trap.id)
      const verdict = trap.backAction(evt)
      if(!verdict) {
        // The trap frame is popped off. Re-push it
        this.scheduleActuateUpdate()
      } else {
        // Trap frame already popped.
        // Since `true` signals we should not trap "back" at all, re-perform the trapped "back".
        this.log('re-perform back')
        this.popController.maybePop()
      }
    }
    window.addEventListener('popstate', popstateHandler)

    this.disposeHook = () => {
      window.removeEventListener('popstate', popstateHandler)
    }
  }
  private async stash() {
    const current = this.isOnMyTrapFrame()
    if(!current) {
      return
    }
    this.log('pop trap frame (stash)')
    await this.popController.maybePop()
  }
  async withStashed<T>(effect: () => T | Promise<T>) {
    await this.stash()
    const value = await effect()
    this.scheduleActuateUpdate()
    return value
  }
  dispose() {
    this.disposeHook && this.disposeHook()
    this.disposed = true
  }
}

export function provideHistoryTrapContext() {
  const router = useRouter()
  const context = new HistoryTrapContext(router)
  provide(HistoryTrapContext.injectionKey, context)
  context.init()
  onUnmounted(() => {
    context.dispose()
  })
}

/**
 * Provides context required for history trap.
 * 
 * Ideally, an application should have only one persistent history trap context,
 * provided at top level; The teardown of the context will currently cause
 * memory leak, due to `router` not supporting removing event handlers.
 * 
 * Under such context, a history replaceState (or router.replace) MUST be called
 * wrapping in `const withStashed = useWithHistoryTrapStashed()`. Due to web API limitations,
 * `withStashed` must perform an async `history.back()` to remove the
 * trap frame, then call and await the passed-in function, and finally schedule
 * a trap frame reactuate. The `withStashed` itself is await-able,
 * resolving after the flow is done. Failure to follow this contract may result
 * in the net effect being a "push" rather than a "replace".
 */
function useHistoryTrapContext() {
  const context = inject(HistoryTrapContext.injectionKey)
  if(context == undefined) {
    throw new Error('Must `provideHistoryTrapContext` on a parent component in order to use history trap.')
  }
  return context
}

/**
 * Get the async helper function for performing navigation (most importantly state replacement)
 * with the history trap frame stashed.
 * 
 * Returns a direct wrapper of the passed-in operation if there is no history trap context.
 */
export function useWithHistoryTrapStashed() {
  const context = inject(HistoryTrapContext.injectionKey)
  return async<T> (effect: () => T | Promise<T>) => {
    if(context == undefined) {
      return await effect()
    }
    return await context.withStashed(effect)
  }
}

export function useHistoryTrap(
  active: Ref<boolean>,
  backInterceptor: BackAction,
  init?: { idDescriptor?: string }
) {
  const context = useHistoryTrapContext()

  const trap = {
    id: context.nextId(init?.idDescriptor),
    backAction: backInterceptor,
    armed: false,
  }
  context.addTrap(trap)
  onUnmounted(() => {
    context.removeTrap(trap)
  })
  
  watch(() => active.value, () => {
    if(active.value) {
      context.armTrap(trap)
    } else {
      context.disarmTrap(trap)
    }
  }, { immediate: true })
}
