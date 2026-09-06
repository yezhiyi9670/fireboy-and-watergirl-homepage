import { inject } from 'vue'
import type { Ref } from 'vue'
import ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts'
import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts'
import type LevelItemData from '../../../common/data_model/temples/LevelItemData.ts'
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData.ts'
import LevelSelectionState from '../state/LevelSelectionState.ts'
import EdgeCreateState from '../state/EdgeCreateState.ts'
import EditorActionHost from './EditorActionHost.ts'
import {
  applyGridMove,
  gridMovement,
  isEditingAllowed,
  isTextEntryTarget,
  toggleEdgeVisibility,
  toggleLinking,
} from './editorHotkeys.ts'
import { deselect } from '../state/deselect.ts'

export type SidebarShortcutContext = {
  kind: 'sidebar'
  level: { templeKey: string, temple: TempleItemData, level: LevelItemData } | null
  edge: { temple: TempleItemData, edge: EdgeItemData } | null
  newLevel: () => void
}
export type LevelShortcutContext = {
  kind: 'level'
  templeKey: string
  temple: TempleItemData
  level: LevelItemData
}
export type EdgeShortcutContext = {
  kind: 'edge'
  temple: TempleItemData
  edge: EdgeItemData
}
export type TempleShortcutContext = {
  kind: 'temple'
  newLevel: () => void
}

export type ShortcutContext =
  | SidebarShortcutContext
  | LevelShortcutContext
  | EdgeShortcutContext
  | TempleShortcutContext

/**
 * Central keyboard-shortcut controller. Components that catch a `keydown`
 * forward `(event, context)` here; the controller decides whether the shortcut
 * applies and performs the action. Returns true when the key was consumed.
 */
export function useShortcutController() {
  const selectionState = inject(LevelSelectionState.injectionKey)
  const edgeCreate = inject(EdgeCreateState.injectionKey)
  const actionHost = inject(EditorActionHost.injectionKey)
  const templesData = inject<Ref<ApiTemplesData | null>>(ApiTemplesData.injectionKey)

  function handle(evt: KeyboardEvent, ctx: ShortcutContext): boolean {
    if(isTextEntryTarget(evt)) {
      return false
    }
    if(!isEditingAllowed(templesData?.value)) {
      return false
    }
    const ctrl = evt.ctrlKey || evt.metaKey
    const shift = evt.shiftKey

    // Delete: sidebar context, selected level/edge; or a focused map edge.
    if(evt.key === 'Delete') {
      if(ctx.kind === 'edge') {
        ctx.temple.deleteEdge_(ctx.edge)
        const selected = selectionState?.selection.value
        if(selected?.kind == 'edge' && selected.edgeUniqueId === ctx.edge.getUniqueId()) {
          deselect(selectionState, edgeCreate)
        }
        return true
      }
      if(ctx.kind === 'sidebar') {
        if(ctx.level != null) {
          actionHost?.requestLevelDelete()
        } else if(ctx.edge != null) {
          ctx.edge.temple.deleteEdge_(ctx.edge.edge)
          deselect(selectionState, edgeCreate)
        } else {
          return false
        }
        return true
      }
      return false
    }

    if(ctrl && !shift) {
      const key = evt.key.toLowerCase()
      if(key === 'r') {
        if(ctx.kind === 'level') {
          toggleLinking(edgeCreate, selectionState, ctx.templeKey, ctx.level._id)
          return true
        }
        if(ctx.kind === 'sidebar' && ctx.level != null) {
          toggleLinking(edgeCreate, selectionState, ctx.level.templeKey, ctx.level.level._id)
          return true
        }
        return false
      }
      if(key === 'd' && ctx.kind === 'sidebar' && ctx.level != null) {
        actionHost?.requestLevelClone()
        return true
      }
      if(key === 'h') {
        if(ctx.kind === 'sidebar' && ctx.edge != null) {
          toggleEdgeVisibility(ctx.edge.temple, ctx.edge.edge)
          return true
        }
        if(ctx.kind === 'edge') {
          toggleEdgeVisibility(ctx.temple, ctx.edge)
          return true
        }
        return false
      }
    }

    if(ctrl && shift && evt.key.toLowerCase() === 'd') {
      if(ctx.kind === 'sidebar' && ctx.level != null) {
        ctx.newLevel()
        return true
      }
      if(ctx.kind === 'temple') {
        ctx.newLevel()
        return true
      }
      return false
    }

    // Level movement (Shift / Ctrl+Shift arrows).
    if(!evt.altKey) {
      const move = gridMovement(evt)
      if(move != null) {
        const target = ctx.kind === 'level'
          ? { temple: ctx.temple, level: ctx.level }
          : (ctx.kind === 'sidebar' && ctx.level != null
              ? { temple: ctx.level.temple, level: ctx.level.level }
              : null)
        if(target != null) {
          applyGridMove(target.temple, target.level, move.axis, move.delta)
          return true
        }
      }
    }

    return false
  }

  return handle
}
