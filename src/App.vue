<script setup lang="ts">
import { provide } from 'vue';
import ErrorScreen from './common/components/ErrorScreen.vue';
import { useLoadData } from './common/hooks/DataLoading';
import ApiHomeData from './common/data_model/home/ApiHomeData.ts';
import { provideHistoryTrapContext } from './common/hooks/history_trap.ts';

const [homeLastState, homeLastValue, homeLastError, homeReload] = useLoadData(ApiHomeData.loader, true)

provide(ApiHomeData.injectionKey, homeLastValue)

provideHistoryTrapContext()
</script>

<template>
  <template v-if="homeLastValue != null">
    <RouterView />
  </template>
  <template v-else>
    <ErrorScreen
      v-if="homeLastState == 'error' && homeLastError != null"
      :error="homeLastError"
      @reload="homeReload"
    />
  </template>
  <portal-target name="dialog-outlet" multiple />
</template>
