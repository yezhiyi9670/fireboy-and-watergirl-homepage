<script setup lang="ts">
import { inject } from 'vue';
import FancyButton from '../../../common/components/FancyButton.vue';
import LevelSelectionState from '../state/LevelSelectionState.ts';
import EdgeCreateState from '../state/EdgeCreateState.ts';
import { deselect } from '../state/deselect.ts';

const selectionState = inject(LevelSelectionState.injectionKey)
const edgeCreate = inject(EdgeCreateState.injectionKey)

function showGlobalProperties() {
  deselect(selectionState, edgeCreate)
  selectionState?.showProperties()
}
</script>

<template>
  <FancyButton
    class="global-props-button"
    theme="none"
    aria-label="全局统计"
    @click="showGlobalProperties"
  >
    <v-icon style="transform:scale(1.15)" name="la-chart-bar" />
  </FancyButton>
</template>

<style lang="css" scoped>
.global-props-button {
  display: none;
  margin-left: auto;
  flex-shrink: 0;
}
@media (max-width: 1049px) {
  .global-props-button {
    display: inline-block;
  }
}
</style>
