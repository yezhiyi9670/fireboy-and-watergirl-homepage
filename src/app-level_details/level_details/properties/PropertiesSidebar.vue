<script setup lang="ts">
import { computed, inject, nextTick, ref, useTemplateRef, watch } from 'vue';
import { FocusTrap } from 'focus-trap-vue';
import FancyButton from '../../../common/components/FancyButton.vue';
import LevelSelectionState from '../state/LevelSelectionState.ts';
import EdgeCreateState from '../state/EdgeCreateState.ts';
import { deselect } from '../state/deselect.ts';
import EditorActionHost from '../editor/EditorActionHost.ts';
import { useLocateView } from './locate.ts';
import IdFieldsDialog from './dialogs/IdFieldsDialog.vue';
import {
  applyGridMove,
  gridMovement,
  isEditingAllowed as isEditingAllowedFor,
  isTextEntryTarget,
  toggleEdgeVisibility,
  toggleLinking,
} from '../editor/editorHotkeys.ts';
import GlobalStats from './global/GlobalStats.vue';
import LevelPropertiesWrap from './level/LevelPropertiesWrap.vue';
import EdgePropertiesWrap from './edge/EdgePropertiesWrap.vue';
import ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';
import LsGameProgressData from '../../../common/data_model/progress/LsGameProgressData.ts';
import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts';
import type LevelItemData from '../../../common/data_model/temples/LevelItemData.ts';
import type EdgeItemData from '../../../common/data_model/temples/EdgeItemData.ts';
import type LevelProgress from '../../../common/data_model/progress/LevelProgress.ts';

const selectionState = inject(LevelSelectionState.injectionKey)
const edgeCreate = inject(EdgeCreateState.injectionKey)
const templesData = inject(ApiTemplesData.injectionKey)
const progressData = inject(LsGameProgressData.injectionKey)
const actionHost = inject(EditorActionHost.injectionKey)
const { revealCreatedLevel } = useLocateView()

const propertiesActive = computed(() => {
  return selectionState?.propertiesActive.value ?? false
})

// The sidebar is an overlay only below this width (keep in sync with the CSS).
const trapActive = computed(() => {
  return propertiesActive.value
})

const bodyEl = useTemplateRef('bodyEl')
const lastFocus = ref<HTMLElement | null>(null)

function sidebarInitialFocus() {
  return bodyEl.value
}
function focusSidebarBody() {
  bodyEl.value?.focus({ preventScroll: true })
}
watch(propertiesActive, active => {
  if(active) {
    lastFocus.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    void nextTick(focusSidebarBody)
  }
})

function restoreLastFocus() {
  const target = lastFocus.value
  lastFocus.value = null
  if(target != null && target.isConnected) {
    target.focus({ preventScroll: true })
  }
}
function dismissProperties() {
  selectionState?.closeProperties()
  // Wait for the focus trap to deactivate (it unmanages on a post-flush after
  // `propertiesActive` becomes false); otherwise the still-active trap would
  // immediately yank focus back into the sidebar.
  void nextTick(restoreLastFocus)
}
function onEsc(evt: KeyboardEvent) {
  if(evt.key !== 'Escape' || evt.isComposing || evt.keyCode === 229) {
    return
  }
  dismissProperties()
}

const hasSelection = computed(() => {
  return selectionState?.selection.value != null
})
const selectedLevel = computed<{
  templeKey: string
  temple: TempleItemData
  level: LevelItemData
  progress: LevelProgress | null
} | null>(() => {
  const selection = selectionState?.selection.value
  if(selection?.kind != 'level') {
    return null
  }
  const temple = templesData?.value?.temples[selection.templeKey]
  if(temple == null) {
    return null
  }
  const level = temple.getLevelByIid(selection.levelIid)
  if(level == null) {
    return null
  }
  const templeProgress = progressData?.value?.getTempleById(temple.id) ?? null
  const progress = templeProgress?.getLevelByIid(level._id) ?? null
  return { templeKey: selection.templeKey, temple, level, progress }
})
const selectedEdge = computed<{
  templeKey: string
  temple: TempleItemData
  edge: EdgeItemData
} | null>(() => {
  const selection = selectionState?.selection.value
  if(selection?.kind != 'edge') {
    return null
  }
  const temple = templesData?.value?.temples[selection.templeKey]
  if(temple == null) {
    return null
  }
  const edge = temple.edges.find(edge => edge.getUniqueId() === selection.edgeUniqueId) ?? null
  if(edge == null) {
    return null
  }
  return { templeKey: selection.templeKey, temple, edge }
})

// --- editor keyboard shortcuts (only while focus is inside the sidebar) ----

const editingAllowed = computed(() => {
  return isEditingAllowedFor(templesData?.value)
})

const newLevelOpen = ref(false)
const newLevelIdInit = ref<string | number>(0)
const newLevelIidInit = ref<string | number>(0)
const pendingNewIid = ref<string | number | null>(null)

function openNewLevelForSelectedTemple() {
  const key = selectedLevel.value?.templeKey
  const temple = key == null ? null : templesData?.value?.temples[key]
  if(temple == null) {
    return
  }
  newLevelIdInit.value = temple.nextFreeLevelId()
  newLevelIidInit.value = temple.nextFreeLevelIid()
  pendingNewIid.value = null
  newLevelOpen.value = true
}
function submitNewLevel(id: string | number, iid: string | number): string | null {
  const key = selectedLevel.value?.templeKey
  const temple = key == null ? null : templesData?.value?.temples[key]
  if(temple == null) {
    return '圣殿数据未就绪'
  }
  try {
    temple.createLevel_(id, iid)
    pendingNewIid.value = iid
    return null
  } catch(e) {
    return (e as Error).message
  }
}
function onNewLevelDone() {
  const key = selectedLevel.value?.templeKey
  const iid = pendingNewIid.value
  pendingNewIid.value = null
  if(key != null && iid != null) {
    revealCreatedLevel(key, iid)
  }
}

function onShortcut(evt: KeyboardEvent) {
  if(isTextEntryTarget(evt) || !editingAllowed.value) {
    return
  }
  const ctrl = evt.ctrlKey || evt.metaKey
  const shift = evt.shiftKey

  if(evt.key === 'Delete') {
    if(selectedLevel.value != null) {
      evt.preventDefault()
      actionHost?.requestLevelDelete()
      return
    }
    if(selectedEdge.value != null) {
      evt.preventDefault()
      selectedEdge.value.temple.deleteEdge_(selectedEdge.value.edge)
      deselect(selectionState, edgeCreate)
      return
    }
    return
  }
  if(ctrl && shift && evt.key.toLowerCase() === 'd') {
    evt.preventDefault()
    openNewLevelForSelectedTemple()
    return
  }
  if(ctrl && !shift && evt.key.toLowerCase() === 'd') {
    evt.preventDefault()
    if(selectedLevel.value != null) {
      actionHost?.requestLevelClone()
    }
    return
  }
  if(ctrl && !shift && evt.key.toLowerCase() === 'h') {
    if(selectedEdge.value != null) {
      evt.preventDefault()
      toggleEdgeVisibility(selectedEdge.value.temple, selectedEdge.value.edge)
    }
    return
  }
  if(ctrl && !shift && evt.key.toLowerCase() === 'r') {
    evt.preventDefault()
    if(selectedLevel.value != null) {
      toggleLinking(edgeCreate, selectionState, selectedLevel.value.templeKey, selectedLevel.value.level._id)
    }
    return
  }
  if(!evt.altKey) {
    const move = gridMovement(evt)
    if(move != null && selectedLevel.value != null) {
      applyGridMove(selectedLevel.value.temple, selectedLevel.value.level, move.axis, move.delta)
      evt.preventDefault()
    }
  }
}
</script>

<template>
  <div
    class="props-scrim"
    :class="{ active: propertiesActive }"
    @click="dismissProperties"
  ></div>
  <FocusTrap
    :active="trapActive"
    :initial-focus="sidebarInitialFocus"
    :return-focus-on-deactivate="true"
    :escape-deactivates="false"
    :click-outside-deactivates="true"
    @deactivate="selectionState?.closeProperties()"
  >
    <aside ref="sidebarEl" class="props-sidebar" :class="{ active: propertiesActive }" @keydown.esc="onEsc" @keydown="onShortcut">
      <header class="props-header">
        <FancyButton theme="tertiary" not-button class="props-title">属性</FancyButton>
        <FancyButton
          class="props-close"
          theme="none"
          smaller
          aria-label="关闭属性栏"
          @click="dismissProperties"
        >
          <v-icon name="la-times-solid" />
        </FancyButton>
      </header>
      <div class="props-body" ref="bodyEl" tabindex="-1">
        <GlobalStats v-if="!hasSelection" />
        <LevelPropertiesWrap
          v-else-if="selectedLevel != null"
          :temple-key="selectedLevel.templeKey"
          :temple="selectedLevel.temple"
          :level="selectedLevel.level"
          :progress="selectedLevel.progress"
        />
        <EdgePropertiesWrap
          v-else-if="selectedEdge != null"
          :temple-key="selectedEdge.templeKey"
          :temple="selectedEdge.temple"
          :edge="selectedEdge.edge"
        />
        <p v-else class="props-hint">
          选中一个关卡或连接线后，这里会显示它的属性。
        </p>
      </div>
    </aside>
  </FocusTrap>

  <IdFieldsDialog
    :open="newLevelOpen"
    title="新关卡"
    :id-initial="newLevelIdInit"
    :iid-initial="newLevelIidInit"
    :on-submit="submitNewLevel"
    @done="onNewLevelDone"
    @close="newLevelOpen = false"
  />
</template>

<style lang="css" scoped>
.props-scrim {
  display: none;
}
.props-sidebar {
  flex: 0 0 360px;
  width: 360px;
  box-sizing: border-box;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-separator);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.props-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 4px solid var(--color-tertiary);
  white-space: nowrap;
}
.props-title {
  margin: 0;
  white-space: nowrap;
}
.props-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
}
.props-body:focus {
  outline: none;
}
.props-hint {
  margin: 0;
  opacity: .7;
}
.props-close {
  display: none;
}
@media (max-width: 1049px) {
  .props-close {
    display: block;
  }
  .props-scrim.active {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 20;
    background: var(--color-cover);
  }
  .props-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 21;
    height: auto;
    transform: translateX(100%);
    transition: transform .18s ease;
  }
  .props-sidebar.active {
    transform: translateX(0);
  }
}
@media (max-width: 499px) {
  .props-sidebar {
    width: 100%;
    border-left: none;
  }
}
</style>
