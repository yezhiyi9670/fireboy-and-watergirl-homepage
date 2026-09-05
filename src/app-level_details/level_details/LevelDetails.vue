<script setup lang="ts">
import { computed, inject, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FancyButton from '../../common/components/FancyButton.vue';
import TemplesGalleryView from './gallery/TemplesGalleryView.vue';
import TemplesMapView from './map/TemplesMapView.vue';
import TempleExpandState from './state/TempleExpandState.ts';
import LevelSelectionState from './state/LevelSelectionState.ts';
import type ApiTemplesData from '../../common/data_model/temples/ApiTemplesData.ts';
import ProgressError from './progress_manip/ProgressError.vue';
import GameItemData from '../../common/data_model/home/GameItemData.ts';
import LsGameProgressData from '../../common/data_model/progress/LsGameProgressData.ts';
import ProgressRepair from './progress_manip/ProgressRepair.vue';
import HomeBackButton from '../components/HomeBackButton.vue';
import PropertiesSidebar from './properties/PropertiesSidebar.vue';

const props = defineProps<{
  gameName: string,
  templesData: ApiTemplesData,
  progressError: Error | null,
}>()

const route = useRoute()
const router = useRouter()
const currentTab = computed<'gallery' | 'map'>(() => {
  return route.path.endsWith('/gallery') ? 'gallery' : 'map'
})
function switchTab(tab: 'gallery' | 'map') {
  if(currentTab.value != tab) {
    router.replace('/level_details/' + route.params.game + '/' + tab)
  }
}

const game = inject(GameItemData.injectionKey)
const progress = inject(LsGameProgressData.injectionKey)

provide(TempleExpandState.injectionKey, new TempleExpandState())
const selectionState = new LevelSelectionState()
provide(LevelSelectionState.injectionKey, selectionState)

function onContentBlankClick(evt: MouseEvent) {
  const target = evt.target as HTMLElement
  if(target.closest('.map-level, .map-edge, .gallery-level, .temple-title')) {
    return
  }
  selectionState.clearSelection()
}

const repairTreatment = computed(() => {
  if(props.progressError) {
    return null
  }
  if(progress?.value == null) {
    return null
  }
  return progress.value.calculateRepairTreatment(props.templesData)
})
</script>

<template>
  <div class="toplevel">
    <div class="level-details-main">
      <div class="tabs">
        <HomeBackButton />
        <FancyButton :theme="currentTab == 'gallery' ? 'primary' : 'ambient'" @click="switchTab('gallery')">画廊</FancyButton>
        <FancyButton :theme="currentTab == 'map' ? 'primary' : 'ambient'" @click="switchTab('map')">地图</FancyButton>

        <FancyButton
          v-if="game?.url"
          class="title-line"
          theme="none"
          :href="game.url.getUrls().play"
          target="_blank"
        >
          <v-icon name="la-play-solid" />
          {{ props.gameName }}
        </FancyButton>
        <FancyButton
          v-else
          class="title-line"
          theme="none"
          not-button
        >
          {{ props.gameName }}
        </FancyButton>
      </div>
      <div
        class="container"
        :style="{display: currentTab == 'gallery' ? 'flex' : 'none'}"
        @click="onContentBlankClick"
      >
        <TemplesGalleryView :data="templesData" />
      </div>
      <div
        class="container"
        :style="{display: currentTab == 'map' ? 'flex' : 'none'}"
        @click="onContentBlankClick"
      >
        <TemplesMapView v-if="currentTab == 'map'" :data="templesData" />
      </div>
      <div v-if="progressError" class="error">
        <ProgressError :error="progressError" />
      </div>
      <div v-if="repairTreatment" class="repair">
        <ProgressRepair :treatment="repairTreatment" :templesData="templesData" />
      </div>
    </div>
    <PropertiesSidebar />
  </div>
</template>

<style lang="css" scoped>
.toplevel {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.level-details-main {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tabs {
  border-bottom: 4px solid var(--color-primary);
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
}
.error {
  border-top: 4px solid var(--color-caution);
  background: var(--color-surface);
  padding: 8px;
}
.repair {
  border-top: 4px solid var(--color-tertiary);
  background: var(--color-surface);
  padding: 8px;
}
.title-line {
  flex-shrink: 1;
  flex-grow: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.container {
  container-type: size;
  container-name: level-details-view;
  height: 0;
  flex: 1;
  display: flex;
}
@container level-details-view (min-width: 0) {
  .container>* {
    --container-width: 100cqw;
    --container-height: 100cqh;
  }
}
</style>
