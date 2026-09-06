import { inject } from 'vue'
import EdgeCreateState from '../state/EdgeCreateState.ts'
import LevelSelectionState, { sameIid } from '../state/LevelSelectionState.ts'
import { useLocateView } from './locate.ts'
import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts'

/**
 * Coordinates the "pick another level to connect" mode shared by map levels,
 * gallery levels and map edges.
 */
export function useEdgeLinking() {
  const edgeCreate = inject(EdgeCreateState.injectionKey)
  const selectionState = inject(LevelSelectionState.injectionKey)
  const { revealCreatedEdge } = useLocateView()

  function isLinking() {
    return edgeCreate?.isLinking() ?? false
  }
  function cancel() {
    edgeCreate?.cancel()
  }

  /**
   * A level was clicked while a link source is pending.
   * - clicking the source level again keeps linking and reopens the sidebar;
   * - clicking another temple level or an already-connected level cancels;
   * - clicking a valid unconnected level creates the edge (and reveals it).
   */
  function onLevelClick(templeKey: string, temple: TempleItemData, levelIid: string | number) {
    const source = edgeCreate?.source.value
    if(source == null) {
      return
    }
    if(source.templeKey !== templeKey) {
      edgeCreate?.cancel()
      return
    }
    if(sameIid(source.levelIid, levelIid)) {
      selectionState?.setLevelSelection(source.templeKey, source.levelIid)
      selectionState?.showProperties()
      return
    }
    if(temple.hasEdgeBetween(source.levelIid, levelIid)) {
      edgeCreate?.cancel()
      return
    }
    let edge
    try {
      edge = temple.createEdge_(source.levelIid, levelIid)
    } catch {
      edgeCreate?.cancel()
      return
    }
    edgeCreate?.cancel()
    revealCreatedEdge(source.templeKey, edge)
  }

  return { isLinking, cancel, onLevelClick }
}
