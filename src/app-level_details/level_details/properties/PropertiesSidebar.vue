<script setup lang="ts">
import { computed, inject } from 'vue';
import FancyButton from '../../../common/components/FancyButton.vue';
import LevelSelectionState from '../state/LevelSelectionState.ts';
import GlobalStats from './global/GlobalStats.vue';
import LevelPropertiesWrap from './level/LevelPropertiesWrap.vue';
import EdgePropertiesWrap from './edge/EdgePropertiesWrap.vue';
import ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';
import LsGameProgressData from '../../../common/data_model/progress/LsGameProgressData.ts';
import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import type LevelItemData from '../../../common/data_model/temples/LevelItemData.ts';
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData.ts';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress.ts';
import { useEventListener } from '@vueuse/core';

const selectionState = inject(LevelSelectionState.injectionKey)
const templesData = inject(ApiTemplesData.injectionKey)
const progressData = inject(LsGameProgressData.injectionKey)

function dismissProperties() {
  selectionState?.closeProperties()
}
function onWindowKeydown(evt: KeyboardEvent) {
  if(evt.key !== 'Escape' || evt.isComposing || evt.keyCode === 229) {
    return
  }
  dismissProperties()
}
useEventListener('keydown', onWindowKeydown)

const propertiesActive = computed(() => {
  return selectionState?.propertiesActive.value ?? false
})
const hasSelection = computed(() => {
  return selectionState?.selection.value != null
})
const selectedLevel = computed<{
  templeKey: string
  temple: TempleItemData
  level: LevelItemData
  progress: LevelProgress | null
} | null>(() => {
  const selection = selectionState?.selection.value
  if(selection?.kind != 'level') {
    return null
  }
  const temple = templesData?.value?.temples[selection.templeKey]
  if(temple == null) {
    return null
  }
  const level = temple.getLevelByIid(selection.levelIid)
  if(level == null) {
    return null
  }
  const templeProgress = progressData?.value?.getTempleById(temple.id) ?? null
  const progress = templeProgress?.getLevelByIid(level._id) ?? null
  return { templeKey: selection.templeKey, temple, level, progress }
})
const selectedEdge = computed<{
  templeKey: string
  temple: TempleItemData
  edge: EdgeItemData
} | null>(() => {
  const selection = selectionState?.selection.value
  if(selection?.kind != 'edge') {
    return null
  }
  const temple = templesData?.value?.temples[selection.templeKey]
  if(temple == null) {
    return null
  }
  const edge = temple.edges.find(edge => edge.getUniqueId() === selection.edgeUniqueId) ?? null
  if(edge == null) {
    return null
  }
  return { templeKey: selection.templeKey, temple, edge }
})
</script>

<template>
  <div
    class="props-scrim"
    :class="{ active: propertiesActive }"
    @click="dismissProperties"
  ></div>
  <aside class="props-sidebar" :class="{ active: propertiesActive }">
    <header class="props-header">
      <FancyButton theme="tertiary" not-button class="props-title">属性</FancyButton>
      <FancyButton
        class="props-close"
        theme="none"
        smaller
        aria-label="关闭属性栏"
        @click="dismissProperties"
      >
        <v-icon name="la-times-solid" />
      </FancyButton>
    </header>
    <div class="props-body">
      <GlobalStats v-if="!hasSelection" />
      <LevelPropertiesWrap
        v-else-if="selectedLevel != null"
        :temple-key="selectedLevel.templeKey"
        :temple="selectedLevel.temple"
        :level="selectedLevel.level"
        :progress="selectedLevel.progress"
      />
      <EdgePropertiesWrap
        v-else-if="selectedEdge != null"
        :temple-key="selectedEdge.templeKey"
        :temple="selectedEdge.temple"
        :edge="selectedEdge.edge"
      />
      <p v-else class="props-hint">
        选中一个关卡或连接线后，这里会显示它的属性。
      </p>
    </div>
  </aside>
</template>

<style lang="css" scoped>
.props-scrim {
  display: none;
}
.props-sidebar {
  flex: 0 0 360px;
  width: 360px;
  box-sizing: border-box;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-separator);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.props-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 4px solid var(--color-tertiary);
  white-space: nowrap;
}
.props-title {
  margin: 0;
  white-space: nowrap;
}
.props-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
}
.props-hint {
  margin: 0;
  opacity: .7;
}
.props-close {
  display: none;
}
@media (max-width: 1049px) {
  .props-close {
    display: block;
  }
  .props-scrim.active {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 20;
    background: var(--color-cover);
  }
  .props-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 21;
    height: auto;
    transform: translateX(100%);
    transition: transform .18s ease;
  }
  .props-sidebar.active {
    transform: translateX(0);
  }
}
@media (max-width: 499px) {
  .props-sidebar {
    width: 100%;
    border-left: none;
  }
}
</style>
