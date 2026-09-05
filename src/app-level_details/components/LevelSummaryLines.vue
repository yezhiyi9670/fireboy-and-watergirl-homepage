<script setup lang="ts">
import { computed, inject, toRef } from 'vue';
import LsGameProgressData from '../../common/data_model/progress/LsGameProgressData';
import TempleItemData from '../../common/data_model/temples/TempleItemData';
import type LevelProgress from '../../common/data_model/progress/LevelProgress';
import LevelItemData from '../../common/data_model/temples/LevelItemData';
import ApiTemplesData from '../../common/data_model/temples/ApiTemplesData';
import LevelTypeIcon from './LevelTypeIcon.vue';
import FancyButton from '../../common/components/FancyButton.vue';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
  noProgress?: boolean
  showIid?: boolean
  locatable?: boolean
}>()
const emit = defineEmits<{
  locate: [kind: 'gallery' | 'map']
}>()

const progressData = inject(LsGameProgressData.injectionKey)
const temple = inject(TempleItemData.injectionKey)

const shownTitle = computed(() => {
  return props.level.getShownTitle()
})
const disambiguousNumbering = ApiTemplesData.useDisambiguousNumbering(toRef(props, 'level'))

</script>

<template>
  <div class="level-info-lines">
    <h3 class="level-title">
      <div class="level-label">{{ shownTitle }}</div>
      <div class="level-type"><LevelTypeIcon :type="level.type" height="1em" width="1em" /></div>
    </h3>
    <p class="level-info">
      <v-icon title="关卡号" name="md-numbers-twotone" />
      {{ disambiguousNumbering }}{{ showIid ? (` [${level._id}]`) : '' }}
      <span class="spacer" />
      <v-icon
        title="放映时间（多人/单人）"
        :name="level.type != 'puzzle' ? 'md-hourglasstop-twotone' : 'md-hourglassdisabled-twotone'"
      />
      {{ LevelItemData.formatWalkthroughDuration(level.time) }}
      /
      {{ LevelItemData.formatWalkthroughDuration(level.mobileTime) }}
    </p>
    <p class="level-info">
      <template v-if="level.isOffscreen()">
        <v-icon title="解锁方式" name="md-visibilityoff-twotone" />
        不可见
      </template>
      <template v-else-if="temple?.type == 'rows'">
        <v-icon title="解锁方式" name="bi-patch-question" />
        未知进度控制方式
      </template>
      <template v-else-if="temple?.type == 'tree'">
        <template v-if="level.initial">
          <v-icon title="解锁方式" name="md-lockopen-twotone" />
          {{ level.skippable ? '新手教程' : '初始关卡' }}
        </template>
        <template v-else-if="level.requirePerfects">
          <v-icon title="解锁方式" name="md-lock-twotone" />
          需要周围所有关卡等级 A
        </template>
        <template v-else>
          <v-icon title="解锁方式" name="md-lock-twotone" />
          通关一个相邻关卡以解锁
        </template>
      </template>
      <template v-else>
        <v-icon title="解锁方式" name="bi-patch-question" />
        未知进度控制方式
      </template>
    </p>
    <p v-if="progressData != null && !noProgress" class="level-info">
      <template v-if="!progress || !progress.hasPlayed()">
        <v-icon title="游戏进程" name="md-horizontalrule-twotone" /> 未玩过
      </template>
      <template v-else-if="!progress.hasFinished()">
        <v-icon title="游戏进程" name="md-add-twotone" /> 已尝试
      </template>
      <template v-else>
        <v-icon title="游戏进程" :name="
          progress.isFail() ? 'md-close-twotone' :
          progress.isPerfect() ? 'md-thumbup-outlined' :
          'md-check-twotone'
        " />
        等级 {{ progress.starsGradeNotation() }}（{{ LevelItemData.formatWalkthroughDuration(progress.bestTime()) }}）
      </template>
    </p>
    <div v-if="locatable" class="locate">
      <FancyButton
        theme="ambient"
        smaller
        @click="emit('locate', 'gallery')"
      >
        在画廊中定位
      </FancyButton>
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
.level-info-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.level-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.level-info {
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
