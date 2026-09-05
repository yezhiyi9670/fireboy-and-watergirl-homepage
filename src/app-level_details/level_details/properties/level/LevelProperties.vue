<script setup lang="ts">
import { computed, inject } from 'vue';
import type LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../../common/data_model/progress/LevelProgress.ts';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import LevelSummaryLines from '../../../components/LevelSummaryLines.vue';
import Separator from '../../../components/Separator.vue';
import LevelPreviewImage from '../../../components/LevelPreviewImage.vue';
import { useLocateView } from '../locate.ts';
import ApiTemplesData from '../../../../common/data_model/temples/ApiTemplesData.ts';
import FancyButton from '../../../../common/components/FancyButton.vue';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const { locateLevel } = useLocateView()

function handleLocate(kind: 'gallery' | 'map') {
  if(templeKey?.value == null) {
    return
  }
  locateLevel(kind, templeKey.value, props.level._id)
}

const json = computed(() => JSON.stringify(props.level, null, 2))

const isEditingAllowed = ApiTemplesData.useIsEditingAllowed()
</script>

<template>
  <div class="level-properties">
    <LevelSummaryLines
      :level="level"
      :progress="progress"
      show-iid
      locatable
      @locate="handleLocate"
    />
    <Separator />
    <div v-if="isEditingAllowed" class="edit-actions">
      <FancyButton
        theme="tertiary"
        smaller
      >更改 ID</FancyButton>
      <FancyButton
        theme="tertiary"
        smaller
      >添加连接</FancyButton>
    </div>
    <pre class="props-json">{{ json }}</pre>
    <div v-if="isEditingAllowed" class="edit-actions">
      <FancyButton
        theme="tertiary"
        smaller
      >克隆关卡</FancyButton>
      <FancyButton
        theme="caution"
        smaller
      >删除关卡</FancyButton>
    </div>
    <Separator />
    <LevelPreviewImage :level="level" />
  </div>
</template>

<style lang="css" scoped>
.level-properties {
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
.props-json {
  margin: 0;
  padding: 8px;
  background-color: var(--color-ambient);
  border-radius: 4px;
  overflow-x: auto;
  font-size: .75em;
}
</style>
