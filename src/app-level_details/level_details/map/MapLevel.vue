<script setup lang="ts">
import { computed, inject, type CSSProperties } from 'vue';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress';
import type LevelItemData from '../../../common/data_model/temples/LevelItemData';
import TempleItemData from '../../../common/data_model/temples/TempleItemData';
import { Api } from '../../../common/api/Api';
import GameItemData from '../../../common/data_model/home/GameItemData';
import LevelSelectionState from '../LevelSelectionState.ts';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const gameId = inject(GameItemData.kInjectionKey)
const templeKey = inject(TempleItemData.kInjectionKey)
const selectionState = inject(LevelSelectionState.injectionKey)

const selected = computed(() => {
  return selectionState?.isLevelSelected(templeKey?.value ?? '', props.level._id) ?? false
})
function select() {
  if(selectionState != null && templeKey?.value != null) {
    selectionState.selectLevel(templeKey.value, props.level._id)
  }
}

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
    left: `calc(${level.x.toFixed(6)} * var(--container-width))`,
    top: `calc(${level.y.toFixed(6)} * var(--container-height))`,
    aspectRatio: 1,
    width: `calc(${iconSize.toFixed(6)} * var(--container-width))`,
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

const textShadow = computed<CSSProperties>(() => {
  const em = 0.1
  const portions = 4
  let val = ''
  for(let i = 0; i < portions; i++) {
    const angle = 2 * Math.PI * (i / portions)
    val += `${(em * Math.cos(angle)).toFixed(6)}em ${(em * Math.sin(angle)).toFixed(6)}em 0.2em var(--color-mapnum-border)`
    if(i < portions - 1) {
      val += ','
    }
  }
  return { textShadow: val }
})

</script>

<template>
  <div
    class="map-level"
    role="button"
    tabindex="0"
    :class="{ selected: selected }"
    :style="positioning"
    :aria-pressed="selected"
    :aria-label="'关卡 ' + props.level.getShownNumbering()"
    @click="select"
    @keydown.enter="select"
    @keydown.space.prevent="select"
  >
    <img class="icon" :srcset="iconUrl" @dragstart.prevent />
    <div class="numbering-outer">
      <div class="numbering-inner" :style="textShadow">
        {{ props.level.getShownNumbering() }}
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.map-level {
  position: relative;
  cursor: pointer;
  user-select: none;
}
.map-level.selected .icon {
  border-radius: 50%;
  box-shadow:
    0 0 0 calc(0.003 * var(--canvas-width)) var(--color-mapselect-inner),
    0 0 0 calc(0.006 * var(--canvas-width)) var(--color-mapselect-border);
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
  text-shadow: 0 0 0 var(--color-mapnum-border);
  font-size: calc(0.024 * var(--container-width));
  user-select: none;
}
</style>
