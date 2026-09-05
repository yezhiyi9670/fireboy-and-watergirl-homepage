<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import LevelSelectionState from './LevelSelectionState.ts';

const selectionState = inject(LevelSelectionState.injectionKey)

const open = ref(false)
watch(() => selectionState?.selection.value, (selection) => {
  if(selection != null) {
    open.value = true
  } else {
    open.value = false
  }
})
function close() {
  open.value = false
}
</script>

<template>
  <div
    class="props-scrim"
    :class="{ open: open }"
    @click="close"
  ></div>
  <aside class="props-sidebar" :class="{ open: open }">
    <header class="props-header">
      <FancyButton theme="tertiary" not-button class="props-title">属性</FancyButton>
      <FancyButton
        class="props-close"
        theme="none"
        smaller
        aria-label="关闭属性栏"
        @click="close"
      >
        <v-icon name="la-times-solid" />
      </FancyButton>
    </header>
    <div class="props-body">
      <p class="props-hint">
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
  .props-scrim.open {
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
  .props-sidebar.open {
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
