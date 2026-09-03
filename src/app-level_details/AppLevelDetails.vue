<script setup lang="ts">
import { computed, inject, provide, watch } from 'vue';
import ErrorScreen from '../common/components/ErrorScreen.vue';
import { useLoadData } from '../common/hooks/DataLoading';
import { useRoute } from 'vue-router';
import Branding from '../branding/Branding.ts';
import LevelDetails from './level_details/LevelDetails.vue';
import LevelDetailsLoading from './level_details/LevelDetailsLoading.vue';
import { useIntervalFn, useTitle } from '@vueuse/core';
import ApiTemplesData from '../common/data_model/temples/ApiTemplesData.ts';
import GameItemData from '../common/data_model/home/GameItemData.ts';
import ApiHomeData from '../common/data_model/home/ApiHomeData.ts';
import typia from 'typia';
import LsGameProgressData from '../common/data_model/progress/LsGameProgressData.ts';

const homeData = inject(ApiHomeData.injectionKey)

const route = useRoute()
const gameId = computed<string>(() => {
  return (route.params as any).game ?? ''
})
const game = computed(() => {
  return homeData?.value?.games[gameId.value] ?? /* F*ck race condition */ typia.random<GameItemData>()
})

const [templesLastState, templesLastValue, templesLastError, templesReload] = useLoadData(
  ApiTemplesData.getLoaderForGameId(gameId), true
)
watch([ gameId ], () => {
  templesLastValue.value = null
  templesReload()
})


const [progressLastState, progressLastValue, progressLastError, progressReload] = useLoadData(
  LsGameProgressData.getLoaderForGame(game), true
)
watch([ gameId ], () => {
  progressLastValue.value = null
  progressReload()
})
useIntervalFn(() => {
  progressReload()
}, 15000)

provide(GameItemData.kInjectionKey, gameId)
provide(GameItemData.injectionKey, game)
provide(ApiTemplesData.injectionKey, templesLastValue)
provide(LsGameProgressData.injectionKey, progressLastValue)

const currentGameName = computed(() => homeData?.value?.games[gameId.value]?.name)
const newPageTitle = computed(() => {
  return '关卡明细 ‹ ' + currentGameName.value + ' – ' + Branding.systemTitle
})
useTitle(newPageTitle)
</script>

<template>
  <template v-if="templesLastValue != null">
    <LevelDetails
      :game-name="currentGameName ?? ''"
      :temples-data="templesLastValue"
      :progress-error="(progressLastState == 'error') ? progressLastError : null"
    />
  </template>
  <template v-else-if="templesLastState == 'loading'">
    <LevelDetailsLoading />
  </template>
  <template v-else>
    <ErrorScreen
      v-if="templesLastState == 'error' && templesLastError != null"
      :error="templesLastError"
      @reload="templesReload"
    />
  </template>
  <portal-target name="dialog-outlet" multiple />
</template>
