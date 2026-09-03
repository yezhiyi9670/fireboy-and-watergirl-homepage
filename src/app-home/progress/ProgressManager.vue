<script setup lang="ts">
import { ref } from 'vue';
import SurfaceCard from '../../common/components/SurfaceCard.vue';
import ManageUI from './ManageUI.vue';
import ImportUI from './ImportUI.vue';
import FancyButton from '../../common/components/FancyButton.vue';
import type { GameItemData } from '../../common/data_model/home/GameItemData.ts';

const props = defineProps<{
  games: Record<string, GameItemData>
}>()

const currentTab = ref<'manage' | 'import'>('manage')

</script>

<template>
  <SurfaceCard class="progress-manager">
    <div class="tabs">
      <FancyButton :theme="currentTab == 'manage' ? 'primary' : 'ambient'" @click="currentTab = 'manage'">导出或清除</FancyButton>
      <FancyButton :theme="currentTab == 'import' ? 'primary' : 'ambient'" @click="currentTab = 'import'">导入</FancyButton>
    </div>
    <ManageUI v-if="currentTab == 'manage'" :games="props.games" />
    <ImportUI v-if="currentTab == 'import'" :games="props.games" />
  </SurfaceCard>
</template>

<style scoped>
.tabs {
  border-bottom: 2px solid var(--color-primary);
  display: flex;
  margin-bottom: 12px;
  overflow-x: auto;
}
</style>
