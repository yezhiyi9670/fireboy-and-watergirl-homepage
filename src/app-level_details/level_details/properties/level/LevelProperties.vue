<script setup lang="ts">
import { computed, inject } from 'vue';
import type LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../../common/data_model/progress/LevelProgress.ts';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import LevelCardContent from '../../../components/LevelCardContent.vue';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)

const json = computed(() => JSON.stringify(props.level, null, 2))
</script>

<template>
  <div class="level-properties">
    <div class="level-card">
      <LevelCardContent
        :level="level"
        :progress="progress"
      />
    </div>
    <p class="props-placeholder">
      关卡属性（占位）· 圣殿 {{ temple?.label }} ({{ templeKey }})
      · 关卡 {{ props.level.getShownNumbering() }} · 进度：{{ props.progress ? '已存在' : '无' }}
    </p>
    <pre class="props-json">{{ json }}</pre>
  </div>
</template>

<style lang="css" scoped>
.level-card {
  display: flex;
  flex-direction: column-reverse;
  gap: .5em;
}
.props-placeholder {
  margin: 0 0 8px;
  opacity: .7;
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
