<script setup lang="ts">
import { computed, inject } from 'vue';
import ApiTemplesData from '../../../../common/data_model/temples/ApiTemplesData.ts';

const templesData = inject(ApiTemplesData.injectionKey)

const globalStats = computed(() => {
  const data = templesData?.value
  if(data == null) {
    return null
  }
  let levels = 0
  let edges = 0
  for(const temple of Object.values(data.temples)) {
    levels += temple.levels.length
    edges += temple.edges.length
  }
  return { temples: Object.keys(data.temples).length, levels, edges }
})
</script>

<template>
  <template v-if="globalStats != null">
    <p class="props-section-title">全局统计</p>
    <dl class="props-stats">
      <div class="props-stat">
        <dt>圣殿</dt>
        <dd>{{ globalStats.temples }}</dd>
      </div>
      <div class="props-stat">
        <dt>关卡</dt>
        <dd>{{ globalStats.levels }}</dd>
      </div>
      <div class="props-stat">
        <dt>连接线</dt>
        <dd>{{ globalStats.edges }}</dd>
      </div>
    </dl>
  </template>
</template>

<style lang="css" scoped>
.props-section-title {
  margin: 0 0 8px;
  font-weight: bold;
}
.props-stats {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.props-stat {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-separator);
  padding: 4px 0;
}
.props-stat dt {
  opacity: .7;
}
.props-stat dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
</style>
