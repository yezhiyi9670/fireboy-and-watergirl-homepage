<script setup lang="ts">
import { computed, inject } from 'vue';
import FancyButton from '../../../common/components/FancyButton.vue';
import LevelSelectionState from '../state/LevelSelectionState.ts';
import ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';

const selectionState = inject(LevelSelectionState.injectionKey)
const templesData = inject(ApiTemplesData.injectionKey)

const propertiesActive = computed(() => {
  return selectionState?.propertiesActive.value ?? false
})
const hasSelection = computed(() => {
  return selectionState?.selection.value != null
})
const globalStats = computed(() => {
  const data = templesData?.value
  if(data == null) {
    return null
  }
  let levels = 0
  let edges = 0
  for(const temple of Object.values(data.temples)) {
    levels += temple.levels.length
    edges += temple.edges.length
  }
  return { temples: Object.keys(data.temples).length, levels, edges }
})
function dismissProperties() {
  selectionState?.closeProperties()
}
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
      <template v-if="!hasSelection && globalStats != null">
        <p class="props-section-title">全局统计</p>
        <dl class="props-stats">
          <div class="props-stat">
            <dt>圣殿</dt>
            <dd>{{ globalStats.temples }}</dd>
          </div>
          <div class="props-stat">
            <dt>关卡</dt>
            <dd>{{ globalStats.levels }}</dd>
          </div>
          <div class="props-stat">
            <dt>连接线</dt>
            <dd>{{ globalStats.edges }}</dd>
          </div>
        </dl>
      </template>
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
.props-section-title {
  margin: 0 0 8px;
  font-weight: bold;
}
.props-stats {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.props-stat {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-separator);
  padding: 4px 0;
}
.props-stat dt {
  opacity: .7;
}
.props-stat dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
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
