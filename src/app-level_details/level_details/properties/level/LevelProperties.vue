<script setup lang="ts">
import { computed } from 'vue';
import type LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../../common/data_model/progress/LevelProgress.ts';
import LevelSummaryLines from '../../../components/LevelSummaryLines.vue';
import Separator from '../../../components/Separator.vue';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const json = computed(() => JSON.stringify(props.level, null, 2))
</script>

<template>
  <div class="level-properties">
    <LevelSummaryLines
      :level="level"
      :progress="progress"
      show-iid
      locatable
      @locate="kind => console.log('TODO locate', level, kind)"
    />
    <Separator />
    <pre class="props-json">{{ json }}</pre>
  </div>
</template>

<style lang="css" scoped>
.level-properties {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
.props-json {
  margin: 0;
  padding: 8px;
  background-color: var(--color-ambient);
  border-radius: 4px;
  overflow-x: auto;
  font-size: .75em;
}
</style>
