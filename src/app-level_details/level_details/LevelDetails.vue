<script setup lang="ts">
import { inject, ref } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import TemplesGalleryView from './gallery/TemplesGalleryView.vue';
import TemplesMapView from './map/TemplesMapView.vue';
import type ApiTemplesData from '../../common/data_model/temples/ApiTemplesData.ts';
import ProgressError from './progress_manip/ProgressError.vue';
import GameItemData from '../../common/data_model/home/GameItemData.ts';

const props = defineProps<{
  gameName: string,
  templesData: ApiTemplesData,
  progressError: Error | null,
}>()

const currentTab = ref<'gallery' | 'map'>('map')
const history = window.history
const game = inject(GameItemData.injectionKey)
</script>

<template>
  <div class="toplevel">
    <div class="tabs">
      <FancyButton
        theme="none"
        href="#/home"
      >
        <v-icon style="transform:scale(1.15)" name="la-map" />
      </FancyButton>
      <FancyButton :theme="currentTab == 'gallery' ? 'primary' : 'ambient'" @click="currentTab = 'gallery'">画廊</FancyButton>
      <FancyButton :theme="currentTab == 'map' ? 'primary' : 'ambient'" @click="currentTab = 'map'">地图</FancyButton>
      
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
    <div class="container" :style="{display: currentTab == 'gallery' ? 'flex' : 'none'}">
      <TemplesGalleryView :data="templesData" />
    </div>
    <div class="container" :style="{display: currentTab == 'map' ? 'flex' : 'none'}">
      <TemplesMapView v-if="currentTab == 'map'" :data="templesData" />
    </div>
    <div v-if="progressError" class="error">
      <ProgressError :error="progressError" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.toplevel {
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
@container level-details-view (min-width: 0px) {
  .container>* {
    --container-width: 100cqw;
    --container-height: 100cqh;
  }
}
</style>
