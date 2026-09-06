import type LevelSelectionState from './LevelSelectionState.ts'
import type EdgeCreateState from './EdgeCreateState.ts'

/**
 * Deselect whatever is currently selected. Any deselection also ends a pending
 * "connect to another level" flow, so callers must go through this helper.
 */
export function deselect(
  selectionState: LevelSelectionState | null | undefined,
  edgeCreate: EdgeCreateState | null | undefined,
) {
  edgeCreate?.cancel()
  selectionState?.clearSelection()
}
