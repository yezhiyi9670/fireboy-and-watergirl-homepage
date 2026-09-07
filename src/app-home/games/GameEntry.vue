<script setup lang="ts">
import { computed } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import CheatOptions from './CheatOptions.vue';
import NewTag from './NewTag.vue';
import SurfaceCard from '../../common/components/SurfaceCard.vue';
import type GameItemData from '../../common/data_model/home/GameItemData.ts';

const props = defineProps<{
  gameKey: string,
  game: GameItemData
}>()

function isConsideredNew(dateStr: string | null | undefined, days: number) {
  if(dateStr == null) {
    return false
  }
  const theDate = new Date(dateStr)
  const thresholdMillis = 1000 * 86400 * days
  return (+new Date()) - (+theDate) < thresholdMillis
}

const urls = computed(() => {
  return props.game.url?.getUrls()
})

const sendAnalyticsEvent = window.sendAnalyticsEvent

</script>

<template>
  <SurfaceCard class="game-item">
    <div class="game-banner">
      <img
        class="game-banner-bg"
        v-if="urls?.banner_bg != null"
        :src="urls?.banner_bg"
      />
      <img
        class="game-banner-fg"
        v-if="urls?.banner != null"
        :src="urls?.banner"
      />
    </div>
    <p class="game-name">{{ game.name }} <NewTag v-if="isConsideredNew(game.created, 30)">NEW</NewTag></p>
    <p class="game-extras-info" v-if="game.extras">
      {{ game.extras.levels_desc }} <NewTag v-if="isConsideredNew(game.extras.modified, 14)">NEW</NewTag>
    </p>
    <div class="game-buttons">
      <FancyButton
        v-if="urls?.play != null"
        :href="urls?.play"
        target="_blank"
        theme="primary"
        @click="sendAnalyticsEvent('play-' + gameKey.toLowerCase())"
      >
        <v-icon name="la-play-solid" /> 玩游戏
      </FancyButton>
      <FancyButton
        :href="'#/level_details/' + gameKey + '/map'"
        theme="ambient"
        @click="sendAnalyticsEvent('details-' + gameKey.toLowerCase())"
      >
        <v-icon name="la-map" /> 关卡明细
      </FancyButton>
      <CheatOptions
        :game-name="game.name"
        :storage-namespace="game.storage_namespace"
        :supported-flags="game.cheat_flags ?? []"
      />
    </div>
  </SurfaceCard>
</template>

<style scoped>
.game-banner {
  display: inline-block;
  position: relative;
}
.game-banner-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.game-banner-fg {
  position: relative;
  width: 420px;
  max-width: 100%;
  display: block;
  aspect-ratio: 860 / 270;
  object-fit: contain;
}
.game-name {
  font-weight: bold;
  font-size: 1.5em;
  margin: 0;
  margin-top: .5em;
}
.game-extras-info {
  margin: 0;
  margin-top: .5em;
}
.game-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
@media(max-width: 599px) {
  .game-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
  }
}
</style>
