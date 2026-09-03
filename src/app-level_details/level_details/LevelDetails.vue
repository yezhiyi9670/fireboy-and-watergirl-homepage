<script setup lang="ts">
import { ref } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import TemplesGalleryView from './gallery/TemplesGalleryView.vue';
import TemplesMapView from './map/TemplesMapView.vue';
import type { ApiTemplesData } from '../../common/data_model/temples/ApiTemplesData.ts';

const props = defineProps<{
  gameName: string,
  templesData: ApiTemplesData
}>()

const currentTab = ref<'gallery' | 'map'>('gallery')
const history = window.history
</script>

<template>
  <div class="toplevel">
    <div class="tabs">
      <FancyButton
        theme="none"
        @click="evt => (history.go(-1), evt.preventDefault())"
        href="#/home"
      >
        <v-icon style="transform:scale(1.15)" name="la-map" />
      </FancyButton>
      <FancyButton :theme="currentTab == 'gallery' ? 'primary' : 'ambient'" @click="currentTab = 'gallery'">画廊</FancyButton>
      <FancyButton :theme="currentTab == 'map' ? 'primary' : 'ambient'" @click="currentTab = 'map'">地图</FancyButton>
      <FancyButton class="title-line" theme="none" not-button>{{ props.gameName }}</FancyButton>
    </div>
    <div class="container">
      <TemplesGalleryView v-if="currentTab == 'gallery'" :temples="templesData.temples" />
      <TemplesMapView v-if="currentTab == 'map'" :temples="templesData.temples" />
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
}
.title-line {
  width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.container {
  height: 0;
  flex: 1;
  display: flex;
}
</style>
