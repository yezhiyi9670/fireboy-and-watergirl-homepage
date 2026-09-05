<script setup lang="ts">
import { computed, inject } from 'vue';
import type EdgeItemData from '../../../../common/data_model/temples/EdgeItemData.ts';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';

const props = defineProps<{
  edge: EdgeItemData
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)

const sourceLevel = computed(() => {
  return temple?.value.getLevelByIid(props.edge.source) ?? null
})
const targetLevel = computed(() => {
  return temple?.value.getLevelByIid(props.edge.target) ?? null
})

const json = computed(() => JSON.stringify(props.edge, null, 2))
</script>

<template>
  <div class="edge-properties">
    <p class="props-placeholder">
      连接线属性（占位）· 圣殿 {{ temple?.label }} ({{ templeKey }})
      · {{ sourceLevel?.getShownNumbering() }} – {{ targetLevel?.getShownNumbering() }}
    </p>
    <pre class="props-json">{{ json }}</pre>
  </div>
</template>

<style lang="css" scoped>
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
