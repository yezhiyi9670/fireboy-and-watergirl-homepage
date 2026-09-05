<script setup lang="ts">
import { computed } from 'vue';
import type EdgeItemData from '../../../../common/data_model/temples/EdgeItemData.ts';
import EdgeSummaryLines from '../../../components/EdgeSummaryLines.vue';
import LevelSummaryLines from '../../../components/LevelSummaryLines.vue';
import Separator from '../../../components/Separator.vue';

const props = defineProps<{
  edge: EdgeItemData
}>()

const [ sourceLevel, targetLevel ] = props.edge.useEndpointLevels()

const json = computed(() => JSON.stringify(props.edge, null, 2))
</script>

<template>
  <div class="edge-properties">
    <EdgeSummaryLines
      show-iid
      locatable
      :edge="edge"
      @locate="kind => console.log('TODO locate', edge, kind)"
    />
    <Separator />
    <pre class="props-json">{{ json }}</pre>
    <Separator />
    <LevelSummaryLines
      v-if="sourceLevel != null"
      show-iid
      no-progress
      locatable
      :level="sourceLevel"
      :progress="null"
      @locate="kind => console.log('TODO locate', sourceLevel, kind)"
    />
    <LevelSummaryLines
      v-if="targetLevel != null"
      show-iid
      no-progress
      locatable
      :level="targetLevel"
      :progress="null"
      @locate="kind => console.log('TODO locate', targetLevel, kind)"
    />
  </div>
</template>

<style lang="css" scoped>
.edge-properties {
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
