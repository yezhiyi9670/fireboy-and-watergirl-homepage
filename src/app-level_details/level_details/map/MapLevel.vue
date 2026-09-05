<script setup lang="ts">
import { computed, inject, type CSSProperties } from 'vue';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress';
import type LevelItemData from '../../../common/data_model/temples/LevelItemData';
import { Api } from '../../../common/api/Api';
import GameItemData from '../../../common/data_model/home/GameItemData';
import TempleItemData from '../../../common/data_model/temples/TempleItemData';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const gameId = inject(GameItemData.kInjectionKey)

const clampedStars = computed(() => {
  if(props.progress == null) {
    return 0
  }
  return Math.max(0, Math.min(3, Math.round(props.progress.bestStars())))
})

const iconSize = 0.08
const positioning = computed<CSSProperties>(() => {
  const level = props.level
  return {
    position: 'absolute',
    left: `calc(${level.x} * var(--container-width))`,
    top: `calc(${level.y} * var(--container-height))`,
    aspectRatio: 1,
    width: `calc(${iconSize} * var(--container-width))`,
    transform: 'translateX(-50%) translateY(-50%)',
  }
})

const iconName = computed(() => {
  const level = props.level
  const basename = {
    'dark': 'FinishStoneDark',
    'puzzle': 'FinishStonePuzzle',
    'speed': 'FinishStoneSpeed',
    'general': 'FinishStone'
  }[level.type ?? 'general']
  const frame = [
    '0000', '0007', '0014', '0021'
  ][clampedStars.value]
  return basename + frame
})
const iconUrl = computed(() => {
  return Api.getUrl('sprite', {
    game: gameId?.value ?? '',
    atlas: `PopupAssets`,
    sprite: iconName.value,
  })
})

</script>

<template>
  <div class="map-level" :style="positioning">
    <img class="icon" :srcset="iconUrl" @dragstart.prevent />
    <div class="numbering-outer">
      <div class="numbering-inner">
        {{ props.level.getShownNumbering() }}
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.map-level {
  position: relative;
}
.icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.numbering-outer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
}
.numbering-inner {
  margin: auto;
  text-align: center;
  white-space: nowrap;
  overflow: visible;
  color: var(--color-mapnum-inner);
  text-shadow: 0 0 .2em var(--color-mapnum-border);
  font-size: calc(0.024 * var(--container-width));
  user-select: none;
}
</style>
