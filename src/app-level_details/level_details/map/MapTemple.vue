<script setup lang="ts">
import { computed, inject, provide, toRef } from 'vue';
import TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import type TempleProgress from '../../../common/data_model/progress/TempleProgress.ts';
import { Api } from '../../../common/api/Api.ts';
import GameItemData from '../../../common/data_model/home/GameItemData.ts';
import TempleTitle from '../../components/TempleTitle.vue';
import MapEdge from './MapEdge.vue';
import MapLevel from './MapLevel.vue';
import { useTempleExpanded } from '../state/TempleExpandState.ts';

const props = defineProps<{
  templeKey: string
  temple: TempleItemData
  progress: TempleProgress | null | undefined
}>()

provide(TempleItemData.kInjectionKey, toRef(props, 'templeKey'))
provide(TempleItemData.injectionKey, toRef(props, 'temple'))
const expanded = useTempleExpanded(toRef(props, 'templeKey'))

const gameId = inject(GameItemData.kInjectionKey)

const backgroundUrl = computed(() => {
  return Api.getUrl('sprite', {
    game: gameId?.value ?? '',
    atlas: `Temples/${props.temple.id}/TempleAssets`,
    sprite: 'MenuBackground0000',
  })
})

const sortedLevels = computed(() => {
  return props.temple.calculateSortedLevels()
})

</script>

<template>
  <div class="temple">
    <TempleTitle :temple="temple" v-model="expanded" />
    <div class="temple-map-outer" :style="{display: expanded ? 'block' : 'none'}">
      <div class="temple-map">
        <img alt="" class="temple-background" :srcset="backgroundUrl" @dragstart.prevent />
        <MapEdge v-for="edge in temple.edges" :key="edge.getUniqueId()" :edge="edge" />
        <MapLevel
          v-for="level of sortedLevels"
          :key="level._id"
          :temple="temple"
          :level="level"
          :progress="progress?.getLevelByIid(level._id)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.temple-map-outer {
  margin: 0;
}
.temple-map {
  aspect-ratio: 10 / 9; /* Also change `const aspectRatio` in `MapEdge` if you touch this */
  max-width: calc(var(--container-width) - 48px);
  max-height: max(100px, min(780px, calc(var(--container-height) - 100px)));
  background: var(--color-surface);
  position: relative;
  container-type: size;
  container-name: temple-map;
  overflow: hidden;
  margin: 0 auto;
}
.temple-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  user-select: none;
}
@container temple-map (min-width: 0) {
  .temple-map>* {
    --canvas-width: 100cqw;
    --canvas-height: 100cqh;
  }
}
@media (max-width: 599px) {
  .temple-map-outer {
    margin: 0 -24px;
  }
  .temple-map {
    max-width: calc(var(--container-width));
  }
}
</style>
