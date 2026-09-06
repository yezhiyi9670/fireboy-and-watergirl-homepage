<script setup lang="ts">
import { inject, ref } from 'vue';
import Dialog from '../../../common/components/Dialog.vue';
import FancyButton from '../../../common/components/FancyButton.vue';
import type ProgressRepairTreatment from '../../../common/data_model/progress/repair/ProgressRepairTreatment.ts';
import type ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';
import ExtraInfo from '../../../common/components/ExtraInfo.vue';
import GameItemData from '../../../common/data_model/home/GameItemData.ts';
import LsGameProgressData from '../../../common/data_model/progress/LsGameProgressData.ts';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import DialogProse from '../../../common/components/DialogProse.vue';

const game = inject(GameItemData.injectionKey)
const progressReload = inject(LsGameProgressData.reloadInjectionKey)

const props = defineProps<{
  treatment: ProgressRepairTreatment,
  templesData: ApiTemplesData
}>()

const dialogOpen = ref(false)
const lastError = ref<string | null>(null)

function openDialog() {
  lastError.value = null
  dialogOpen.value = true
  console.log('清理清单：', props.treatment)
}
function handleCancel() {
  dialogOpen.value = false
}
function handleConfirm() {
  try {
    doRepair()
    dialogOpen.value = false
    progressReload && progressReload()
  } catch(err: unknown) {
    lastError.value = (
      (typeof err == 'object' && err != null && 'message' in err) ?
      ('' + err.message) :
      ('' + err)
    )
  }
}

/**
 * Load the localStorage data fresh to perform repair,
 * and write back.
 * 
 * Does not touch the reactive instance of LsGameProgressData.
 */
function doRepair() {
  const gameItem = game?.value
  if(gameItem == null) {
    throw new Error('未找到游戏信息。')
  }
  const storageKey = gameItem.storage_namespace + ':progress'
  const text = localStorage.getItem(storageKey)
  if(text == null) {
    throw new Error('未读取到游戏数据。')
  }
  const rawData = JSON.parse(text)
  LsGameProgressData.typiaAssert(rawData)
  const data = plainToInstance(LsGameProgressData, rawData)
  data.performRepairTreatment_(props.treatment)
  const modifiedRawData = instanceToPlain(data)
  localStorage.setItem(storageKey, JSON.stringify(modifiedRawData))
}
</script>

<template>
  <div class="outer">
    <div class="text">游戏进程数据中存在幽灵关卡，可能需要清理。</div>
    <div class="action">
      <FancyButton theme="ambient" smaller @click="openDialog">详情</FancyButton>
    </div>
  </div>
  <Dialog
    :open="dialogOpen"
    theme="tertiary"
    title="游戏进程清理"
    dismissable
    hasCancel
    hasConfirm="确认清理"
    @close="verdict => verdict ? handleConfirm() : handleCancel()"
  >
    <DialogProse>
      <div>游戏进程数据中包含关卡表中不存在的“幽灵”关卡，可能是因为之前玩过的某关卡现在已经被移除。</div>
      <div>游戏理论上会隐藏幽灵关卡，因此<strong>不会出现可见异常</strong>。</div>
      <div>如果游戏确实存在异常，你可能需要清理幽灵关卡。清理后该关卡的游戏成绩将被完全移除，如果今后该关卡又重新出现，成绩也不会恢复。</div>
      <ExtraInfo caution>
        <div>该操作无法撤销，如有必要请先回主页备份数据。</div>
        <div>清理时游戏本身应处于关闭状态。</div>
      </ExtraInfo>
      <ExtraInfo v-if="lastError != null" error>
        清理失败：{{ lastError }}
      </ExtraInfo>
    </DialogProse>
  </Dialog>
</template>

<style lang="css" scoped>
.outer {
  display: flex;
  align-items: center;
}
.text {
  width: 0;
  flex: 1;
}
.error {
  margin-top: .5em;
  color: var(--color-emphasize);
}
</style>
