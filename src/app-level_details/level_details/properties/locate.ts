import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LevelSelectionState, { type LocateTarget, type LocateView } from '../state/LevelSelectionState.ts'
import TempleExpandState from '../state/TempleExpandState.ts'
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData.ts'
import { useWithHistoryTrapStashed } from '../../../common/hooks/history_trap.ts'

export function useLocateView() {
  const selectionState = inject(LevelSelectionState.injectionKey)
  const expandState = inject(TempleExpandState.injectionKey)
  const route = useRoute()
  const router = useRouter()
  const withTrapStashed = useWithHistoryTrapStashed()

  const gamePath = '/level_details/' + route.params.game

  function expandTemple(templeKey: string) {
    expandState?.setExpanded(templeKey, true)
  }
  function requestLocate(target: LocateTarget) {
    selectionState?.requestLocate(target)
  }

  function requestTarget(target: LocateTarget) {
    selectionState?.closeProperties()
    expandTemple(target.templeKey)
    const path = gamePath + '/' + target.view
    if(route.path !== path) {
      withTrapStashed(() => router.replace(path)).then(() => requestLocate(target))
    } else {
      requestLocate(target)
    }
  }

  function locateLevel(view: LocateView, templeKey: string, levelIid: string | number) {
    const target: LocateTarget = view == 'gallery'
      ? { view: 'gallery', kind: 'level', templeKey, levelIid }
      : { view: 'map', kind: 'level', templeKey, levelIid }
    requestTarget(target)
  }
  function locateEdge(templeKey: string, edgeUniqueId: string) {
    requestTarget({ view: 'map', kind: 'edge', templeKey, edgeUniqueId })
  }

  function currentView(): LocateView {
    return route.path.endsWith('/gallery') ? 'gallery' : 'map'
  }

  /**
   * After creating a level: select it, activate the sidebar, and locate/focus
   * it in the view the user is currently looking at.
   */
  function revealCreatedLevel(templeKey: string, levelIid: string | number) {
    expandTemple(templeKey)
    selectionState?.setLevelSelection(templeKey, levelIid)
    selectionState?.showProperties()
    requestLocate({ view: currentView(), kind: 'level', templeKey, levelIid })
  }

  /**
   * After creating an edge: switch to the map, select the edge (without opening
   * the sidebar) and locate/focus it.
   */
  function revealCreatedEdge(templeKey: string, edge: EdgeItemData) {
    expandTemple(templeKey)
    selectionState?.setEdgeSelection(templeKey, edge)
    const target: LocateTarget = { view: 'map', kind: 'edge', templeKey, edgeUniqueId: edge.getUniqueId() }
    const path = gamePath + '/map'
    if(route.path !== path) {
      withTrapStashed(() => router.replace(path)).then(() => requestLocate(target))
    } else {
      requestLocate(target)
    }
  }

  return { locateLevel, locateEdge, revealCreatedLevel, revealCreatedEdge }
}
