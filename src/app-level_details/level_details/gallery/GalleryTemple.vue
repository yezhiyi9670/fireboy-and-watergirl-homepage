<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue';
import GalleryLevel from './GalleryLevel.vue';
import TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import type TempleProgress from '../../../common/data_model/progress/TempleProgress.ts';

const props = defineProps<{
  templeKey: string
  temple: TempleItemData
  progress: TempleProgress | null | undefined
}>()

provide(TempleItemData.kInjectionKey, toRef(props, 'templeKey'))
provide(TempleItemData.injectionKey, toRef(props, 'temple'))
const expanded = ref(true)

const sortedLevels = computed(() => {
  const ret = [ ...props.temple.levels ]
  ret.sort((a, b) => {
    const na = +a.getShownNumbering()
    const nb = +b.getShownNumbering()
    if(na != na && nb != nb) {
      return 0
    }
    if(na != na) {
      return 1
    }
    if(nb != nb) {
      return -1
    }
    return na - nb
  })
  return ret
})

</script>

<template>
  <div class="temple">
    <h2 class="temple-title" tabindex="0" @click="expanded = !expanded">
      <v-icon :name="expanded ? 'fa-chevron-down' : 'fa-chevron-right'" width=".75em" height=".75em" />
      <span class="temple-label">{{ temple.label }}</span>
      <span class="temple-badge" :style="{backgroundColor: temple.color}"></span>
    </h2>
    <div class="gallery-grid" :style="{display: expanded ? 'grid' : 'none'}">
      <GalleryLevel
        v-for="level of sortedLevels"
        :key="level._id"
        :temple="temple"
        :level="level"
        :progress="progress?.getLevel(level._id)"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.temple-title {
  margin: 0;
  margin-bottom: .5em;
  display: flex;
  gap: 0.5em;
  cursor: pointer;
  align-items: center;
}
.temple-badge {
  display: inline-block;
  height: 1em;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 0.1em var(--color-ambient);
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
</style>
