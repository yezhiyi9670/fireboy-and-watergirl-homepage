<script setup lang="ts">
import { provide, toRef } from 'vue';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import type LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../../common/data_model/progress/LevelProgress.ts';
import LevelProperties from './LevelProperties.vue';

const props = defineProps<{
  templeKey: string
  temple: TempleItemData
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

provide(TempleItemData.kInjectionKey, toRef(props, 'templeKey'))
provide(TempleItemData.injectionKey, toRef(props, 'temple'))
</script>

<template>
  <LevelProperties
    :level="level"
    :progress="progress"
  />
</template>
