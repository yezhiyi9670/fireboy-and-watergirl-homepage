import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LevelSelectionState, { type LocateTarget, type LocateView } from '../state/LevelSelectionState.ts'
import TempleExpandState from '../state/TempleExpandState.ts'

export function useLocateView() {
  const selectionState = inject(LevelSelectionState.injectionKey)
  const expandState = inject(TempleExpandState.injectionKey)
  const route = useRoute()
  const router = useRouter()

  function requestTarget(target: LocateTarget) {
    selectionState?.closeProperties()
    expandState?.setExpanded(target.templeKey, true)
    const path = '/level_details/' + route.params.game + '/' + target.view
    const finish = () => selectionState?.requestLocate(target)
    if(route.path !== path) {
      router.replace(path).then(finish)
    } else {
      finish()
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

  return { locateLevel, locateEdge }
}
