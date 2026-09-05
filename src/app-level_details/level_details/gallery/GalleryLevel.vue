<script setup lang="ts">
import { computed, inject } from 'vue';
import TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import LevelItemData from '../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress.ts';
import LevelSelectionState from '../state/LevelSelectionState.ts';
import LevelCardContent from '../../components/LevelCardContent.vue';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const templeKey = inject(TempleItemData.kInjectionKey)

const selectionState = inject(LevelSelectionState.injectionKey)
const selected = computed(() => {
  return selectionState?.isLevelSelected(templeKey?.value ?? '', props.level._id) ?? false
})
const edgeEndpoint = computed(() => {
  return selectionState?.isLevelAnEdgeEndpoint(templeKey?.value ?? '', props.level._id) ?? false
})
function select() {
  if(selectionState != null && templeKey?.value != null) {
    selectionState.selectLevel(templeKey.value, props.level._id)
  }
}
</script>

<template>
  <section
    tabindex="0"
    class="gallery-level"
    :class="{ selected: selected, 'edge-endpoint': edgeEndpoint }"
    @click="select"
    @keydown.enter="select"
    @keydown.space.prevent="select"
  >
    <LevelCardContent :level="level" :progress="progress" />
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
