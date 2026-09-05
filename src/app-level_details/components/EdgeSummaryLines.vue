<script setup lang="ts">
import { toRef } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import EdgeItemData from '../../common/data_model/temples/EdgeItemData';

const props = defineProps<{
  edge: EdgeItemData
  showIid?: boolean
  locatable?: boolean
}>()
const emit = defineEmits<{
  locate: [kind: 'gallery' | 'map']
}>()

const [ sourceLevel, targetLevel ] = EdgeItemData.useEndpointLevels(toRef(props, 'edge'))
</script>

<template>
  <div class="edge-info-lines">
    <h3 class="edge-title">
      <div class="edge-label">连接线</div>
    </h3>
    <p class="edge-info">
      <v-icon title="ID" name="md-numbers-twotone" />
      {{ edge.id }}{{ showIid ? (` [${edge._id}]`) : '' }}
    </p>
    <p class="edge-info">
      <v-icon title="端点" name="md-link-twotone" />
      {{ sourceLevel?.getShownNumbering() ?? '???' }}–{{ targetLevel?.getShownNumbering() ?? '???' }}
      <template v-if="showIid">[{{ sourceLevel?._id ?? '???' }}–{{ targetLevel?._id ?? '???' }}]</template>
      <span class="spacer" />
      <template v-if="!edge.hidden">
        <v-icon title="可见性" name="md-visibility-twotone" />
        可见
      </template>
      <template v-else>
        <v-icon title="可见性" name="md-visibilityoff-twotone" />
        隐藏
      </template>
    </p>
    <p class="edge-info">
      <v-icon title="警告" name="md-warning-twotone" />
      连接线的两种 ID 都不保证唯一
    </p>
    <div v-if="locatable" class="locate">
      <FancyButton
        theme="ambient"
        smaller
        @click="emit('locate', 'map')"
      >
        在地图中定位
      </FancyButton>
    </div>
  </div>
</template>

<style lang="css" scoped>
.edge-info-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.edge-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.edge-info {
  margin: 0;
}
.spacer {
  display: inline-block;
  width: 1em;
}
.locate {
  display: flex;
  gap: 12px;
}
.locate>* {
  width: 0;
  flex: 1;
}
</style>
