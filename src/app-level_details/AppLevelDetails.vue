<script setup lang="ts">
import { provide } from 'vue';
import { DataModel } from '../common/api/DataModel';
import ErrorScreen from '../common/components/ErrorScreen.vue';
import { useLoadData } from '../common/hooks/DataLoading';
import { useRoute } from 'vue-router';

const route = useRoute()

const [templesLastState, templesLastValue, templesLastError, templesReload] = useLoadData(
  DataModel.getApiTemplesLoader((route.params as any).game), true
)

provide(DataModel.apiTemplesKey, templesLastValue)
</script>

<template>
  <template v-if="templesLastValue != null">
    {{ templesLastValue }}
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
