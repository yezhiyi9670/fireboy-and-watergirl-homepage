<script setup lang="ts">
import { provide, toRef } from 'vue';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import type EdgeItemData from '../../../../common/data_model/temples/EdgeItemData.ts';
import EdgeProperties from './EdgeProperties.vue';

const props = defineProps<{
  templeKey: string
  temple: TempleItemData
  edge: EdgeItemData
}>()

provide(TempleItemData.kInjectionKey, toRef(props, 'templeKey'))
provide(TempleItemData.injectionKey, toRef(props, 'temple'))
</script>

<template>
  <EdgeProperties :edge="edge" />
</template>
