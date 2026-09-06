<script setup lang="ts">
import { computed, inject, onMounted, useTemplateRef, watch, type CSSProperties } from 'vue';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress';
import type LevelItemData from '../../../common/data_model/temples/LevelItemData';
import TempleItemData from '../../../common/data_model/temples/TempleItemData';
import { Api } from '../../../common/api/Api';
import GameItemData from '../../../common/data_model/home/GameItemData';
import LevelSelectionState, { sameIid } from '../state/LevelSelectionState.ts';
import { useEdgeLinking } from '../properties/edgeLinking.ts';
import { useShortcutController, type LevelShortcutContext } from '../editor/shortcutController.ts';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const gameId = inject(GameItemData.kInjectionKey)
const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)
const selectionState = inject(LevelSelectionState.injectionKey)
const edgeLinking = useEdgeLinking()
const shortcut = useShortcutController()

const selected = computed(() => {
  return selectionState?.isLevelSelected(templeKey?.value ?? '', props.level._id) ?? false
})
function select() {
  const key = templeKey?.value
  if(key == null) {
    return
  }
  if(edgeLinking.isLinking()) {
    if(temple?.value != null) {
      edgeLinking.onLevelClick(key, temple.value, props.level._id)
    } else {
      edgeLinking.cancel()
    }
    return
  }
  if(selectionState != null) {
    selectionState.selectLevel(key, props.level._id)
  }
}

function onGridKeydown(evt: KeyboardEvent) {
  const key = templeKey?.value
  const t = temple?.value
  if(key == null || t == null) {
    return
  }
  const ctx: LevelShortcutContext = { kind: 'level', surface: 'map', templeKey: key, temple: t, level: props.level }
  if(shortcut(evt, ctx)) {
    evt.preventDefault()
  }
}

const rootEl = useTemplateRef('rootEl')
const locateMatches = computed(() => {
  const req = selectionState?.locateRequest.value
  return req?.view == 'map' && req.kind == 'level'
    && req.templeKey == (templeKey?.value ?? '')
    && sameIid(req.levelIid, props.level._id)
})
function handleLocate() {
  const req = selectionState?.locateRequest.value
  if(req == null) {
    return
  }
  rootEl.value?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  rootEl.value?.focus({ preventScroll: true })
  selectionState?.clearLocateRequest(req)
}
watch(locateMatches, matches => {
  if(matches) {
    handleLocate()
  }
}, { flush: 'post' })
onMounted(() => {
  if(locateMatches.value) {
    handleLocate()
  }
})

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
    ref="rootEl"
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
    @keydown="onGridKeydown"
  >
    <img class="icon" :srcset="iconUrl" @dragstart.prevent />
    <div class="numbering-outer">
      <div class="numbering-inner" :style="textShadow">
        {{ props.level.getShownNumbering() }}
      </div>
    </div>
    <div class="map-level-hit"></div>
  </div>
</template>

<style lang="css" scoped>
.map-level {
  position: relative;
  pointer-events: none;
  user-select: none;
}
/* Only the hit circle catches mouse clicks; the rest of the box lets clicks
   fall through to nearby edges so they stay selectable. */
.map-level .icon,
.map-level .numbering-outer {
  pointer-events: none;
}
.map-level-hit {
  position: absolute;
  left: 50%;
  top: 50%;
  /* Tune hit size vs ease of selecting nearby edges. */
  width: 66%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
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
