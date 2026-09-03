<script setup lang="ts">
import { computed, ref, useTemplateRef, watchEffect } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import MultiSelectList, { type Option } from '../../common/components/MultiSelectList.vue';
import FancyButton from '../../common/components/FancyButton.vue';
import Dialog from '../../common/components/Dialog.vue';
import FancyInput from '../../common/components/FancyInput.vue';
import md5 from 'md5';
import Base64 from 'base64-js'
import GZip from 'gzip-js'
import ExtraInfo from '../../common/components/ExtraInfo.vue';
import type { GameItemData } from '../../common/data_model/home/GameItemData.ts';

const progressStore = ':progress'
const props = defineProps<{
  games: Record<string, GameItemData>
}>()

const gameDataSize = ref<{[storageNamespace: string]: number | null}>({})
function updateGameDataSize() {
  const ret: {[storageNamespace: string]: number | null} = {}
  for(const game of Object.values(props.games)) {
    const size = localStorage.getItem(game.storage_namespace + progressStore)?.length
    ret[game.storage_namespace] = (size == undefined) ? null : size
  }
  gameDataSize.value = ret
}
watchEffect(updateGameDataSize)
useIntervalFn(updateGameDataSize, 3000)

const selectionListOptions = computed(() => {
  const ret: Option[] = []
  for(const game of Object.values(props.games)) {
    const dataSize = gameDataSize.value[game.storage_namespace]
    ret.push({
      key: game.storage_namespace,
      title: game.name,
      description: (
        (
          dataSize == null ?
          'No data' :
          Math.ceil(dataSize / 1024) + 'KiB'
        ) + ' | ' + game.storage_namespace + progressStore
      ),
      forcedState: (dataSize == null) ? false : undefined
    })
  }
  return ret
})
const selectedKeys = ref<string[]>([])
const validSelectedKeys = computed(() => {
  const ret: string[] = []
  for(let option of selectionListOptions.value) {
    if(option.forcedState !== false && selectedKeys.value.indexOf(option.key) != -1) {
      ret.push(option.key)
    }
  }
  return ret
})

const exportSuccessCount = ref(0)
const exportFailureCount = ref(0)
const exportedData = ref('')
const exportResults = useTemplateRef('exportResults')
function handleExport() {
  exportSuccessCount.value = 0
  exportFailureCount.value = 0
  exportedData.value = ''
  const exportObject: any = { '_type': 'multi' }
  for(let storageNs of validSelectedKeys.value) {
    const data = localStorage.getItem(storageNs + progressStore)
    if(data != null) {
      try {
        exportObject[storageNs + progressStore] = JSON.parse(data)
        exportSuccessCount.value += 1
      } catch(_err) {
        console.warn('Export failed for', storageNs, 'due to malformed JSON.')
        exportFailureCount.value += 1
      }
    }
  }
  const json = JSON.stringify(exportObject)
  const compressedJson = new Uint8Array(GZip.zip(new TextEncoder().encode(json)))
  const baseData = 'v1,gzipb64,' + Base64.fromByteArray(compressedJson)
  const hash = md5(baseData).toLowerCase()
  exportedData.value = hash + ';' + baseData
  setTimeout(() => {
    exportResults.value?.domElement?.select()
  }, 50)
}

const pendingClearGames = ref<GameItemData[]>([])
const confirmClearText = ref('')
const isConfirmClearTextCorrect = computed(() => {
  return confirmClearText.value.toLowerCase() == 'yes'
})
function handleRequestClear() {
  pendingClearGames.value = []
  confirmClearText.value = ''
  for(const game of Object.values(props.games)) {
    if(validSelectedKeys.value.indexOf(game.storage_namespace) != -1) {
      pendingClearGames.value.push(game)
    }
  }
}
function handleConfirmClear() {
  for(let game of pendingClearGames.value) {
    delete localStorage[game.storage_namespace + progressStore]
  }
  pendingClearGames.value = []
  updateGameDataSize()
}
</script>

<template>
  <!-- <div>先选择要导出或清除数据的游戏：</div>
  <div class="vspace" /> -->
  <MultiSelectList :options="selectionListOptions" theme="tertiary" v-model="selectedKeys" />
  <div class="vspace" />
  <div class="actions">
    <FancyButton theme="primary" :disabled="validSelectedKeys.length == 0" @click="handleExport">
      <v-icon name="la-file-export-solid" /> 导出
    </FancyButton>
    <FancyButton theme="caution" :disabled="validSelectedKeys.length == 0" @click="handleRequestClear">
      <v-icon name="la-trash-solid" /> 清除
    </FancyButton>
  </div>
  <Dialog
    :open="exportedData != ''"
    title="导出完成"
    theme="primary"
    dismissable
    has-neutral
    @close="exportedData = ''"
  >
    <div style="display: flex; flex-direction: column; gap: 0.5em">
      <div>成功导出 {{ exportSuccessCount }} 个游戏的进程数据。</div>
      <div v-if="exportFailureCount > 0">另有 {{ exportFailureCount }} 项因格式异常无法导出。</div>
      <div>请<strong>完整</strong>复制以下文本并妥善保存：</div>
      <FancyInput
        theme="ambient"
        textarea
        style="width: 100%; resize: vertical;"
        :rows="4"
        readonly
        :model-value="exportedData"
        ref="exportResults"
      />
      <ExtraInfo>
        <div>文本主体部分由 JSON 格式 GZip 压缩后再 Base64 编码得到。文本头部有其版本信息和 MD5 校验值，可帮助检查数据完整性。</div>
      </ExtraInfo>
    </div>
  </Dialog>
  <Dialog
    :open="pendingClearGames.length != 0"
    title="清除进程数据"
    theme="caution"
    dismissable
    has-cancel
    :has-confirm="isConfirmClearTextCorrect"
    @close="verdict => verdict ? handleConfirmClear() : pendingClearGames = []"
  >
    <div style="display: flex; flex-direction: column; gap: 0.5em">
      <div>将要清除以下游戏的进程数据：</div>
      <ul style="margin: 0 0; line-height: normal;">
        <li v-for="game of pendingClearGames" :key="game.storage_namespace">{{ game.name }}</li>
      </ul>
      <div>输入 <code>yes</code> 以确认：</div>
      <div>
        <FancyInput
          theme="ambient"
          style="width: 100%"
          v-model="confirmClearText"
          @submit="isConfirmClearTextCorrect ? handleConfirmClear() : undefined"
        />
      </div>
      <ExtraInfo caution>
        <div>所有游戏成绩将永久丢失！无法撤销！</div>
        <div>如果仅是出于测试目的进行清除，请务必先导出备份。</div>
      </ExtraInfo>
    </div>
  </Dialog>
</template>

<style lang="css" scoped>
.vspace {
  height: .5em;
}
.actions {
  display: flex;
  gap: 12px;
}
@media (max-width: 599px) {
  .actions {
    gap: 10px;
  }
}
</style>
