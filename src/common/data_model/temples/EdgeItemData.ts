import { computed, inject, type ComputedRef, type Ref } from "vue"
import type LevelItemData from "./LevelItemData"
import TempleItemData from "./TempleItemData"

export default class EdgeItemData {
  id!: number | string
  source!: number | string
  target!: number | string
  _id?: number | string
  hidden?: boolean

  /**
   * `_id` and `id` are not guaranteed unique in the source data, so an edge is
   * identified by the combination of all four of its key fields.
   */
  getUniqueId() {
    return JSON.stringify([this._id, this.id, this.source, this.target])
  }

  /**
   * Required injections:
   * - TempleItemData.injectionKey
   */
  static useEndpointLevels(
    self: Ref<EdgeItemData>
  ): [ ComputedRef<LevelItemData | null>, ComputedRef<LevelItemData | null> ] {
    const temple = inject(TempleItemData.injectionKey)

    const sourceLevel = computed(() => {
      return temple?.value.getLevelByIid(self.value.source) ?? null
    })
    const targetLevel = computed(() => {
      return temple?.value.getLevelByIid(self.value.target) ?? null
    })
    return [ sourceLevel, targetLevel ]
  }
}
