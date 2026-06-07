<script setup lang="ts">
import { provide } from 'vue';
import { DataModel } from './common/api/DataModel';
import ErrorScreen from './common/components/ErrorScreen.vue';
import { useLoadData } from './common/hooks/DataLoading';

const [homeLastState, homeLastValue, homeLastError, homeReload] = useLoadData(DataModel.apiHomeLoader, true)

provide(DataModel.apiHomeKey, homeLastValue)
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
