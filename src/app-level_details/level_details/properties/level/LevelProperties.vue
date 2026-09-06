<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import type LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import type LevelProgress from '../../../../common/data_model/progress/LevelProgress.ts';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import ApiTemplesData from '../../../../common/data_model/temples/ApiTemplesData.ts';
import FancyButton from '../../../../common/components/FancyButton.vue';
import Dialog from '../../../../common/components/Dialog.vue';
import ExtraInfo from '../../../../common/components/ExtraInfo.vue';
import LevelSummaryLines from '../../../components/LevelSummaryLines.vue';
import Separator from '../../../components/Separator.vue';
import LevelPreviewImage from '../../../components/LevelPreviewImage.vue';
import IdFieldsDialog from '../dialogs/IdFieldsDialog.vue';
import { useLocateView } from '../locate.ts';
import LevelSelectionState from '../../state/LevelSelectionState.ts';
import EdgeCreateState from '../../state/EdgeCreateState.ts';
import { deselect } from '../../state/deselect.ts';
import DialogProse from '../../../../common/components/DialogProse.vue';

const props = defineProps<{
  level: LevelItemData
  progress: LevelProgress | null | undefined
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)
const templesData = inject(ApiTemplesData.injectionKey)
const selectionState = inject(LevelSelectionState.injectionKey)
const edgeCreate = inject(EdgeCreateState.injectionKey)

const isEditingAllowed = ApiTemplesData.useIsEditingAllowed()

const { locateLevel, revealCreatedLevel } = useLocateView()
function handleLocate(kind: 'gallery' | 'map') {
  if(templeKey?.value == null) {
    return
  }
  locateLevel(kind, templeKey.value, props.level._id)
}

const json = computed(() => JSON.stringify(props.level, null, 2))

// --- 更改 ID ---------------------------------------------------------------

const renameOpen = ref(false)
const renameIdInit = ref<string | number>(0)
const renameIidInit = ref<string | number>(0)
const renameOldIid = ref<string | number>(0)

function openRename() {
  renameIdInit.value = props.level.id
  renameIidInit.value = props.level._id
  renameOldIid.value = props.level._id
  renameOpen.value = true
}
function submitRename(id: string | number, iid: string | number): string | null {
  const t = temple?.value
  const key = templeKey?.value
  if(t == null || key == null) {
    return '圣殿数据未就绪'
  }
  const oldIid = renameOldIid.value
  try {
    t.renameLevelIds_(oldIid, id, iid)
    selectionState?.retargetLevelSelection(key, oldIid, iid)
    return null
  } catch(e) {
    return (e as Error).message
  }
}

// --- 克隆 ------------------------------------------------------------------

const cloneOpen = ref(false)
const cloneIdInit = ref<string | number>(0)
const cloneIidInit = ref<string | number>(0)
const pendingCloneIid = ref<string | number | null>(null)

function openClone() {
  const t = temple?.value
  if(t == null) {
    return
  }
  cloneIdInit.value = t.nextFreeLevelId()
  cloneIidInit.value = t.nextFreeLevelIid()
  pendingCloneIid.value = null
  cloneOpen.value = true
}
function submitClone(id: string | number, iid: string | number): string | null {
  const data = templesData?.value
  const key = templeKey?.value
  if(data == null || key == null) {
    return '圣殿数据未就绪'
  }
  try {
    data.cloneLevel_(key, props.level._id, id, iid)
    pendingCloneIid.value = iid
    return null
  } catch(e) {
    return (e as Error).message
  }
}
function onCloneDone() {
  const key = templeKey?.value
  const iid = pendingCloneIid.value
  pendingCloneIid.value = null
  if(key != null && iid != null) {
    revealCreatedLevel(key, iid)
  }
}

// --- 删除 ------------------------------------------------------------------

const deleteOpen = ref(false)

function confirmDelete() {
  const t = temple?.value
  if(t != null) {
    try {
      t.deleteLevel_(props.level._id)
    } catch {
      // level is already gone or cannot be found; selection will be cleared below
    }
  }
  deselect(selectionState, edgeCreate)
  deleteOpen.value = false
}

// --- 新建连接（待选态） -----------------------------------------------------

const linkActive = computed(() => {
  const key = templeKey?.value
  if(key == null) {
    return false
  }
  return edgeCreate?.isSource(key, props.level._id) ?? false
})
function toggleLink() {
  const key = templeKey?.value
  if(key == null) {
    return
  }
  if(linkActive.value) {
    edgeCreate?.cancel()
    return
  }
  edgeCreate?.start(key, props.level._id)
  selectionState?.closeProperties()
}
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
      <FancyButton theme="tertiary" smaller @click="openRename">更改 ID</FancyButton>
      <FancyButton
        :theme="linkActive ? 'caution' : 'tertiary'"
        smaller
        @click="toggleLink"
      >{{ linkActive ? '取消添加连接' : '添加连接' }}</FancyButton>
    </div>
    <pre class="props-json">{{ json }}</pre>
    <div v-if="isEditingAllowed" class="edit-actions">
      <FancyButton theme="tertiary" smaller @click="openClone">克隆关卡</FancyButton>
      <FancyButton theme="caution" smaller @click="deleteOpen = true">删除关卡</FancyButton>
    </div>
    <Separator />
    <LevelPreviewImage :level="level" />

    <IdFieldsDialog
      :open="renameOpen"
      title="更改关卡 ID"
      :id-initial="renameIdInit"
      :iid-initial="renameIidInit"
      warn="正常情况请避免修改唯一标识符 _id，否则玩家已有的游戏成绩将不再属于此关卡。"
      :on-submit="submitRename"
      @close="renameOpen = false"
    />
    <IdFieldsDialog
      :open="cloneOpen"
      title="克隆关卡"
      :id-initial="cloneIdInit"
      :iid-initial="cloneIidInit"
      :on-submit="submitClone"
      @done="onCloneDone"
      @close="cloneOpen = false"
    />
    <Dialog
      :open="deleteOpen"
      title="删除关卡"
      dismissable
      theme="caution"
      :has-confirm="'删除'"
      :has-cancel="'取消'"
      @close="(v) => { if(v === true) confirmDelete(); else deleteOpen = false }"
    >
      <DialogProse>
        <p>确定要删除关卡？</p>
        <ExtraInfo caution>
          <p>向后端提交更改时，如果某个之前已使用的关卡文件变为未使用状态，它将永久消失。（真的很久！）</p>
          <p>如果该关卡此前已公开发布并有人玩过，之后新关卡应避免重新使用该关卡的 _id，否则已有游戏成绩可能错误地附到新关卡上。</p>
        </ExtraInfo>
      </DialogProse>
    </Dialog>
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
