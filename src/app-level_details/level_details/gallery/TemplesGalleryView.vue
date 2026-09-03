<script setup lang="ts">
import { inject } from 'vue';
import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import GalleryTemple from './GalleryTemple.vue';
import LsGameProgressData from '../../../common/data_model/progress/LsGameProgressData.ts';

const props = defineProps<{
  temples: Record<string, TempleItemData>
}>()

const progress = inject(LsGameProgressData.injectionKey)
</script>

<template>
  <div class="gallery-view">
    <GalleryTemple
      v-for="temple, templeKey in temples"
      :key="templeKey"
      :temple="temple"
      :temple-key="templeKey"
      :progress="progress?.getTemple(temple.id)"
    />
  </div>
</template>

<style lang="css" scoped>
.gallery-view {
  width: 0;
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 1em;
}
</style>
