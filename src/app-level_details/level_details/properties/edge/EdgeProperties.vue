<script setup lang="ts">
import { computed, toRef } from 'vue';
import EdgeItemData from '../../../../common/data_model/temples/EdgeItemData.ts';
import EdgeSummaryLines from '../../../components/EdgeSummaryLines.vue';
import LevelSummaryLines from '../../../components/LevelSummaryLines.vue';
import Separator from '../../../components/Separator.vue';
import LevelPreviewImage from '../../../components/LevelPreviewImage.vue';

const props = defineProps<{
  edge: EdgeItemData
}>()

const [ sourceLevel, targetLevel ] = EdgeItemData.useEndpointLevels(toRef(props, 'edge'))

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
    <div v-if="sourceLevel != null" class="endpoint-entry">
      <LevelPreviewImage :level="sourceLevel" />
      <LevelSummaryLines
        show-iid
        no-progress
        locatable
        :level="sourceLevel"
        :progress="null"
        @locate="kind => console.log('TODO locate', sourceLevel, kind)"
      />
    </div>
    <div v-if="targetLevel != null" class="endpoint-entry">
      <LevelPreviewImage :level="targetLevel" />
      <LevelSummaryLines
        show-iid
        no-progress
        locatable
        :level="targetLevel"
        :progress="null"
        @locate="kind => console.log('TODO locate', targetLevel, kind)"
      />
    </div>
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
.endpoint-entry {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
