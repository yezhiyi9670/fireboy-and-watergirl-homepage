<script setup lang="ts">
import { computed, inject, type CSSProperties } from 'vue';
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData';
import TempleItemData from '../../../common/data_model/temples/TempleItemData';
import LevelSelectionState from '../state/LevelSelectionState.ts';

const props = defineProps<{
  edge: EdgeItemData
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const selectionState = inject(LevelSelectionState.injectionKey)

const [ sourceLevel, targetLevel ] = props.edge.useEndpointLevels()

const selected = computed(() => {
  return selectionState?.isEdgeSelected(templeKey?.value ?? '', props.edge) ?? false
})
const ariaLabel = computed(() => {
  const src = sourceLevel.value
  const dst = targetLevel.value
  if(src != null && dst != null) {
    return '连接线 ' + src.getShownNumbering() + ' – ' + dst.getShownNumbering()
  }
  return '连接线'
})
function select() {
  if(selectionState != null && templeKey?.value != null) {
    selectionState.selectEdge(templeKey.value, props.edge)
  }
}
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
    left: `calc(${center[0].toFixed(6)} * var(--canvas-width))`,
    top: `calc(${center[1].toFixed(6)} * var(--canvas-width))`,
    width: `calc(${len.toFixed(6)} * var(--canvas-width))`,
    height: `calc(${lineWidth.toFixed(6)} * var(--canvas-width))`,
    borderTopWidth: `calc(${borderWidth.toFixed(6)} * var(--canvas-width))`,
    borderBottomWidth: `calc(${borderWidth.toFixed(6)} * var(--canvas-width))`,
    transform: `translateX(-50%) translateY(-50%) rotate(${degs.toFixed(6)}deg)`,
    transformOrigin: 'center',
  }
})
</script>

<template>
  <div
    v-if="positioning"
    class="map-edge"
    role="button"
    tabindex="0"
    :class="{ hidden: props.edge.hidden, selected: selected }"
    :style="positioning"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
    @click="select"
    @keydown.enter="select"
    @keydown.space.prevent="select"
  />
</template>

<style lang="css" scoped>
.map-edge {
  background-color: var(--color-mapedge-inner);
  border: 0 solid var(--color-mapedge-border);
  cursor: pointer;
}
.map-edge::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  height: calc(0.03 * var(--canvas-width));
}
.map-edge.hidden {
  background-color: var(--color-mapedge-hidden-inner);
  border: 0 dotted var(--color-mapedge-hidden-border);
}
.map-edge.selected {
  /* background-color: var(--color-);
  border-color: var(--color-tertiary);
  border-style: solid; */
  box-shadow:
    0 0 0 calc(0.0025 * var(--canvas-width)) var(--color-mapselect-inner),
    0 0 0 calc(0.005 * var(--canvas-width)) var(--color-mapselect-border);
}
</style>
