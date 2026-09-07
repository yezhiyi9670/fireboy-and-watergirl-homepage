<script setup lang="ts">
import { computed, inject } from 'vue';
import ApiTemplesData from '../../../../common/data_model/temples/ApiTemplesData.ts';
import LsGameProgressData from '../../../../common/data_model/progress/LsGameProgressData.ts';
import LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';

const templesData = inject(ApiTemplesData.injectionKey)
const progressData = inject(LsGameProgressData.injectionKey)

const globalStats = computed(() => {
  const data = templesData?.value
  if(data == null) {
    return null
  }
  const progress = progressData?.value

  let totalLevels = 0
  let visibleLevels = 0
  let completed = 0
  let completedA = 0
  let totalATime = 0
  let edges = 0

  for(const temple of Object.values(data.temples)) {
    totalLevels += temple.levels.length
    edges += temple.edges.length
    const templeProgress = progress?.getTempleById(temple.id)
    for(const level of temple.levels) {
      if(level.isOffscreen()) {
        continue
      }
      visibleLevels++
      const levelProgress = templeProgress?.getLevelByIid(level._id)
      if(levelProgress == null || !levelProgress.hasFinished()) {
        continue
      }
      completed++
      if(levelProgress.bestStars() < 3) {
        continue
      }
      completedA++
      const bestTime = levelProgress.bestTime()
      if(typeof bestTime === 'number') {
        totalATime += bestTime
      }
    }
  }

  return {
    temples: Object.keys(data.temples).length,
    totalLevels,
    visibleLevels,
    completed,
    completedA,
    totalATime,
    edges,
  }
})
</script>

<template>
  <template v-if="globalStats != null">
    <h3 class="props-section-title">全局统计</h3>
    <dl class="props-stats">
      <div class="props-stat">
        <dt>圣殿</dt>
        <dd>{{ globalStats.temples }}</dd>
      </div>
      <div class="props-stat">
        <dt>关卡</dt>
        <dd>{{ globalStats.totalLevels }}</dd>
      </div>
      <div class="props-stat">
        <dt>可见关卡</dt>
        <dd>{{ globalStats.visibleLevels }}</dd>
      </div>
      <div class="props-stat props-stat-sub">
        <dt>其中已通关</dt>
        <dd>{{ globalStats.completed }}</dd>
      </div>
      <div class="props-stat props-stat-sub">
        <dt>其中等级 A</dt>
        <dd>{{ globalStats.completedA }}</dd>
      </div>
      <div class="props-stat props-stat-sub">
        <dt>等级 A 总用时</dt>
        <dd>{{ globalStats.completedA > 0 ? LevelItemData.formatWalkthroughDuration(globalStats.totalATime) : '—' }}</dd>
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
  /* border-bottom: 1px solid var(--color-separator); */
  padding: 4px 0;
}
.props-stat dt {
  opacity: .7;
}
.props-stat dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.props-stat-sub dt {
  padding-left: 1em;
  opacity: .55;
}
</style>
