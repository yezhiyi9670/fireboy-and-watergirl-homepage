<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import LevelItemData from '../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress.ts';
import LevelSelectionState, { sameIid } from '../state/LevelSelectionState.ts';
import LevelSummaryLines from '../../components/LevelSummaryLines.vue';
import LevelPreviewImage from '../../components/LevelPreviewImage.vue';
import { useEdgeLinking } from '../properties/edgeLinking.ts';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)

const selectionState = inject(LevelSelectionState.injectionKey)
const edgeLinking = useEdgeLinking()
const selected = computed(() => {
  return selectionState?.isLevelSelected(templeKey?.value ?? '', props.level._id) ?? false
})
const edgeEndpoint = computed(() => {
  return selectionState?.isLevelAnEdgeEndpoint(templeKey?.value ?? '', props.level._id) ?? false
})
function select() {
  const key = templeKey?.value
  if(key == null) {
    return
  }
  if(edgeLinking.isLinking()) {
    if(temple?.value != null) {
      edgeLinking.onLevelClick(key, temple.value, props.level._id)
    } else {
      edgeLinking.cancel()
    }
    return
  }
  if(selectionState != null) {
    selectionState.selectLevel(key, props.level._id)
  }
}

const rootEl = ref<HTMLElement | null>(null)
const locateMatches = computed(() => {
  const req = selectionState?.locateRequest.value
  return req?.view == 'gallery' && req.kind == 'level'
    && req.templeKey == (templeKey?.value ?? '')
    && sameIid(req.levelIid, props.level._id)
})
function handleLocate() {
  const req = selectionState?.locateRequest.value
  if(req == null) {
    return
  }
  rootEl.value?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  rootEl.value?.focus({ preventScroll: true })
  selectionState?.clearLocateRequest(req)
}
watch(locateMatches, matches => {
  if(matches) {
    handleLocate()
  }
}, { flush: 'post' })
onMounted(() => {
  if(locateMatches.value) {
    handleLocate()
  }
})
</script>

<template>
  <section
    ref="rootEl"
    tabindex="0"
    class="gallery-level"
    :class="{ selected: selected, 'edge-endpoint': edgeEndpoint }"
    @click="select"
    @keydown.enter="select"
    @keydown.space.prevent="select"
  >
    <LevelPreviewImage :level="level" />
    <LevelSummaryLines :level="level" :progress="progress" />
  </section>
</template>

<style lang="css" scoped>
.gallery-level {
  background: var(--color-surface);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}
.gallery-level.selected {
  outline: 3px solid var(--color-tertiary);
  outline-offset: 2px;
}
.gallery-level.edge-endpoint {
  outline: 3px dashed var(--color-tertiary);
  outline-offset: 2px;
  /* background: color-mix(in srgb, var(--color-surface) 90%, var(--color-tertiary)); */
}
@media (max-width: 499px) {
  .gallery-level {
    margin: 0 -24px;
    padding: 16px 24px;
  }
}
</style>
