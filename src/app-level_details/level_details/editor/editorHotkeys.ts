import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts'
import type LevelItemData from '../../../common/data_model/temples/LevelItemData.ts'
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData.ts'
import type ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts'
import type EdgeCreateState from '../state/EdgeCreateState.ts'
import type LevelSelectionState from '../state/LevelSelectionState.ts'

/** True when the event target is a text/select control that must not be disturbed. */
export function isTextEntryTarget(evt: KeyboardEvent) {
  const target = evt.target as HTMLElement | null
  if(target == null) {
    return false
  }
  if(target.isContentEditable) {
    return true
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function isEditingAllowed(data: ApiTemplesData | null | undefined) {
  return data?.editing_allowed ?? false
}

export type GridAxis = 'x' | 'y'

/** Arrow movement (Shift = 0.005, Ctrl+Shift = 0.05). Returns null otherwise. */
export function gridMovement(evt: KeyboardEvent): { axis: GridAxis, delta: number } | null {
  if(!evt.shiftKey) {
    return null
  }
  const step = (evt.ctrlKey || evt.metaKey) ? 0.05 : 0.005
  switch(evt.key) {
    case 'ArrowUp': return { axis: 'y', delta: -step }
    case 'ArrowDown': return { axis: 'y', delta: step }
    case 'ArrowLeft': return { axis: 'x', delta: -step }
    case 'ArrowRight': return { axis: 'x', delta: step }
    default: return null
  }
}

const GRID_QUANTUM = 0.005
function quantize(value: number) {
  return Math.round(value / GRID_QUANTUM) * GRID_QUANTUM
}

/**
 * Move a level on the 0..1 grid. Levels fully on screen are clamped so they
 * cannot leave the screen; levels off screen cannot be moved at all. The result
 * is quantized to 0.005 multiples to avoid floating-point drift.
 */
export function applyGridMove(temple: TempleItemData, level: LevelItemData, axis: GridAxis, delta: number) {
  const onScreen = level.x >= 0 && level.x <= 1 && level.y >= 0 && level.y <= 1
  if(!onScreen) {
    return false
  }
  if(axis === 'x') {
    const nx = quantize(Math.min(1, Math.max(0, level.x + delta)))
    if(nx === level.x) {
      return false
    }
    level.x = nx
  } else {
    const ny = quantize(Math.min(1, Math.max(0, level.y + delta)))
    if(ny === level.y) {
      return false
    }
    level.y = ny
  }
  temple.markDirty()
  return true
}

export function toggleEdgeVisibility(temple: TempleItemData, edge: EdgeItemData) {
  temple.setEdgeHidden_(edge, !edge.hidden)
}

/**
 * Enter the "pick another level to connect" mode from a level (or cancel it when
 * already pending). The level becomes selected without opening the sidebar.
 */
export function toggleLinking(
  edgeCreate: EdgeCreateState | null | undefined,
  selectionState: LevelSelectionState | null | undefined,
  templeKey: string,
  levelIid: string | number,
) {
  if(edgeCreate?.isLinking()) {
    edgeCreate.cancel()
    return true
  }
  selectionState?.setLevelSelection(templeKey, levelIid)
  edgeCreate?.start(templeKey, levelIid)
  selectionState?.closeProperties()
  return true
}
