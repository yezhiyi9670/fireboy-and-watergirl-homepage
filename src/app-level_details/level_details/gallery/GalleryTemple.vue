<script setup lang="ts">
import { computed, provide, toRef, useTemplateRef } from 'vue';
import GalleryLevel from './GalleryLevel.vue';
import TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';
import type TempleProgress from '../../../common/data_model/progress/TempleProgress.ts';
import TempleTitle from '../../components/TempleTitle.vue';
import { useTempleExpanded } from '../state/TempleExpandState.ts';
import { isTextEntryTarget } from '../editor/editorHotkeys.ts';

const props = defineProps<{
  templeKey: string
  temple: TempleItemData
  progress: TempleProgress | null | undefined
}>()

provide(TempleItemData.kInjectionKey, toRef(props, 'templeKey'))
provide(TempleItemData.injectionKey, toRef(props, 'temple'))
const expanded = useTempleExpanded(toRef(props, 'templeKey'))

const templeTitleRef = useTemplateRef<{ openNewLevel: () => void }>('templeTitleRef')
const editingAllowed = ApiTemplesData.useIsEditingAllowed()

function onContainerKeydown(evt: KeyboardEvent) {
  if(isTextEntryTarget(evt) || !editingAllowed.value) {
    return
  }
  if(!(evt.ctrlKey && evt.shiftKey) || evt.key.toLowerCase() !== 'd') {
    return
  }
  evt.preventDefault()
  templeTitleRef.value?.openNewLevel()
}

const sortedLevels = computed(() => {
  return props.temple.calculateSortedLevels()
})

</script>

<template>
  <div class="temple" @keydown="onContainerKeydown">
    <TempleTitle ref="templeTitleRef" :temple="temple" v-model="expanded" />
    <div class="gallery-grid" :style="{display: expanded ? 'grid' : 'none'}">
      <GalleryLevel
        v-for="level of sortedLevels"
        :key="level._id"
        :temple="temple"
        :level="level"
        :progress="progress?.getLevelByIid(level._id)"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
</style>
