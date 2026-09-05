import { ref, type InjectionKey, type Ref } from 'vue'
import type EdgeItemData from '../../common/data_model/temples/EdgeItemData.ts'

export type LevelSelection =
  | { kind: 'level', templeKey: string, levelIid: string | number }
  | { kind: 'edge', templeKey: string, edgeUniqueId: string, endpointIids: [string | number, string | number] }

export function sameIid(a: string | number, b: string | number) {
  return String(a) === String(b)
}

export default class LevelSelectionState {
  static injectionKey: InjectionKey<LevelSelectionState> = Symbol('LevelSelectionState')

  readonly selection: Ref<LevelSelection | null> = ref(null)

  selectLevel(templeKey: string, levelIid: string | number) {
    const cur = this.selection.value
    if(cur?.kind == 'level' && cur.templeKey == templeKey && sameIid(cur.levelIid, levelIid)) {
      this.selection.value = null
    } else {
      this.selection.value = { kind: 'level', templeKey, levelIid }
    }
  }
  selectEdge(templeKey: string, edge: EdgeItemData) {
    const edgeUniqueId = edge.getUniqueId()
    const cur = this.selection.value
    if(cur?.kind == 'edge' && cur.templeKey == templeKey && cur.edgeUniqueId === edgeUniqueId) {
      this.selection.value = null
    } else {
      this.selection.value = { kind: 'edge', templeKey, edgeUniqueId, endpointIids: [edge.source, edge.target] }
    }
  }

  isLevelSelected(templeKey: string, levelIid: string | number) {
    const s = this.selection.value
    return s?.kind == 'level' && s.templeKey == templeKey && sameIid(s.levelIid, levelIid)
  }
  isEdgeSelected(templeKey: string, edge: EdgeItemData) {
    const s = this.selection.value
    return s?.kind == 'edge' && s.templeKey == templeKey && s.edgeUniqueId === edge.getUniqueId()
  }
  isLevelAnEdgeEndpoint(templeKey: string, levelIid: string | number) {
    const s = this.selection.value
    return s?.kind == 'edge' && s.templeKey == templeKey && (
      sameIid(s.endpointIids[0], levelIid) || sameIid(s.endpointIids[1], levelIid)
    )
  }
}
