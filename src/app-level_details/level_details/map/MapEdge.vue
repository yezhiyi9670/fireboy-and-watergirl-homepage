<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData';
import type TempleItemData from '../../../common/data_model/temples/TempleItemData';

const props = defineProps<{
  temple: TempleItemData
  edge: EdgeItemData
}>()

const sourceLevel = computed(() => {
  return props.temple.getLevelByIid(props.edge.source)
})
const targetLevel = computed(() => {
  return props.temple.getLevelByIid(props.edge.target)
})
const aspectRatio = 10 / 9  // Used to normalize height to canvas-width representation
const lineWidth = 0.005      // Line width, in canvas-width representation
const borderWidth = 0.003
const positioning = computed<CSSProperties | null>(() => {
  const src = sourceLevel.value
  const dst = targetLevel.value
  if(src == null || dst == null) {
    console.warn('Dangling edge', props.edge)
  } else if(src.isOffscreen() || dst.isOffscreen()) {
    console.warn('Edge connecting to offscreen level', props.edge)
  }
  // To make incorrect edges evident:
  // - Not checking `isOffscreen` is intended behavior
  // - Still showing a dangling edge is also intended behavior
  // Normalize to representation with canvas-width
  const [src_x, src_y, dst_x, dst_y] = [
    src?.x ?? -1, (src?.y ?? -1) / aspectRatio,
    dst?.x ?? -1, (dst?.y ?? -1) / aspectRatio
  ]
  const center = [ (src_x + dst_x) / 2, (src_y + dst_y) / 2 ] as const
  const len = ( (src_x-dst_x)**2 + (src_y-dst_y)**2 ) ** 0.5
  const degs = Math.atan2(dst_y - src_y, dst_x - src_x) * 180 / Math.PI
  return {
    boxSizing: 'content-box',
    position: 'absolute',
    left: `calc(${center[0]} * var(--canvas-width))`,
    top: `calc(${center[1]} * var(--canvas-width))`,
    width: `calc(${len} * var(--canvas-width))`,
    height: `calc(${lineWidth} * var(--canvas-width))`,
    borderTopWidth: `calc(${borderWidth} * var(--canvas-width))`,
    borderBottomWidth: `calc(${borderWidth} * var(--canvas-width))`,
    transform: `translateX(-50%) translateY(-50%) rotate(${degs}deg)`,
    transformOrigin: 'center',
  }
})
</script>

<template>
  <div v-if="positioning" class="map-edge" :style="positioning" />
</template>

<style lang="css" scoped>
.map-edge {
  background-color: var(--color-mapedge-inner);
  border: 0 solid var(--color-mapedge-border);
}
</style>
