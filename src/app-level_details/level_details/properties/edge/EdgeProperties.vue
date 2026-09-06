<script setup lang="ts">
import { inject, toRef } from 'vue';
import EdgeItemData from '../../../../common/data_model/temples/EdgeItemData.ts';
import type LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import EdgeSummaryLines from '../../../components/EdgeSummaryLines.vue';
import LevelSummaryLines from '../../../components/LevelSummaryLines.vue';
import Separator from '../../../components/Separator.vue';
import LevelPreviewImage from '../../../components/LevelPreviewImage.vue';
import { useLocateView } from '../locate.ts';
import LevelSelectionState from '../../state/LevelSelectionState.ts';
import EdgeCreateState from '../../state/EdgeCreateState.ts';
import { deselect } from '../../state/deselect.ts';
import ApiTemplesData from '../../../../common/data_model/temples/ApiTemplesData.ts';
import FancyButton from '../../../../common/components/FancyButton.vue';

const props = defineProps<{
  edge: EdgeItemData
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)
const selectionState = inject(LevelSelectionState.injectionKey)
const edgeCreate = inject(EdgeCreateState.injectionKey)
const { locateEdge, locateLevel } = useLocateView()

const [ sourceLevel, targetLevel ] = EdgeItemData.useEndpointLevels(toRef(props, 'edge'))

function handleLocateEdge() {
  if(templeKey?.value == null) {
    return
  }
  locateEdge(templeKey.value, props.edge.getUniqueId())
}
function handleLocateLevel(level: LevelItemData | null, kind: 'gallery' | 'map') {
  if(level == null || templeKey?.value == null) {
    return
  }
  locateLevel(kind, templeKey.value, level._id)
}

// const json = computed(() => JSON.stringify(props.edge, null, 2))
const isEditingAllowed = ApiTemplesData.useIsEditingAllowed()

function toggleHidden() {
  props.edge.hidden = !props.edge.hidden
}
function unlinkEdge() {
  temple?.value.deleteEdge_(props.edge)
  deselect(selectionState, edgeCreate)
}
</script>

<template>
  <div class="edge-properties">
    <EdgeSummaryLines
      show-iid
      locatable
      :edge="edge"
      @locate="handleLocateEdge"
    />
    <template v-if="isEditingAllowed">
      <Separator />
      <div class="edit-actions">
        <FancyButton
          theme="tertiary"
          smaller
          @click="toggleHidden"
        >{{ edge.hidden ? '取消隐藏' : '隐藏' }}</FancyButton>
        <FancyButton
          theme="caution"
          smaller
          @click="unlinkEdge"
        >解除连接</FancyButton>
      </div>
    </template>
    <Separator />
    <div v-if="sourceLevel != null" class="endpoint-entry">
      <LevelPreviewImage :level="sourceLevel" />
      <LevelSummaryLines
        show-iid
        no-progress
        locatable
        :level="sourceLevel"
        :progress="null"
        @locate="kind => handleLocateLevel(sourceLevel, kind)"
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
        @locate="kind => handleLocateLevel(targetLevel, kind)"
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
.edit-actions {
  display: flex;
  gap: 12px;
}
.edit-actions>* {
  width: 0;
  flex: 1;
}
.endpoint-entry {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
