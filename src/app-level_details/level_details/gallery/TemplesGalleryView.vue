<script setup lang="ts">
import { computed, inject } from 'vue';
import GalleryTemple from './GalleryTemple.vue';
import LsGameProgressData from '../../../common/data_model/progress/LsGameProgressData.ts';
import type ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';

const props = defineProps<{
  data: ApiTemplesData
}>()

const sortedTemples = computed(() => {
  return props.data.calculateSortedTemples()
})

const progress = inject(LsGameProgressData.injectionKey)
</script>

<template>
  <div class="gallery-view">
    <GalleryTemple
      v-for="[templeKey, temple] of sortedTemples"
      :key="templeKey"
      :temple="temple"
      :temple-key="templeKey"
      :progress="progress?.getTempleById(temple.id)"
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
  gap: 1.5em;
}
</style>
