<script setup lang="ts">
import { computed, ref } from 'vue';
import FancyInput from '../../common/components/FancyInput.vue';
import FancyButton from '../../common/components/FancyButton.vue';
import Dialog from '../../common/components/Dialog.vue';
import ExtraInfo from '../../common/components/ExtraInfo.vue';
import md5 from 'md5';
import Base64 from 'base64-js'
import GZip from 'gzip-js'
import MultiSelectList, { type Option } from '../../common/components/MultiSelectList.vue';
import type GameItemData from '../../common/data_model/home/GameItemData.ts';
import DialogProse from '../../common/components/DialogProse.vue';

const progressStore = ':progress'
const props = defineProps<{
  games: Record<string, GameItemData>
}>()

const stage = ref<'paste' | 'error' | 'confirm_checksum' | 'select_games' | 'confirm_overwrite' | 'done'>('paste')
const showGameSelector = computed(() => {
  return stage.value == 'select_games' || stage.value == 'confirm_overwrite' || stage.value == 'done'
})

const importedText = ref('')

const errorText = ref('')
const parsedDataWrapperType = ref<'legacy' | 'contemporary'>('legacy')
const parsedDataBodyType = ref<'single' | 'multi'>('single')
const parsedData = ref<any>(null)

const selectedGames = ref<string[]>([])
const willOverwriteGames = ref<GameItemData[]>([])
const importSuccessCount = ref(0)
const importFailureCount = ref(0)

function handleValidate() {
  const text = importedText.value
  try {
    let jsonData = ''
    let hashMatches = false
    if(text.indexOf(';') != -1 || text.indexOf(',') != -1) {
      parsedDataWrapperType.value = 'contemporary'
      
      const parts = text.split(';')
      if(parts.length > 2) {
        throw '文本只能至多含有一个分号。'
      }
      if(parts.length == 1) {
        parts.splice(0, 0, '')
      }
      const hash = parts[0].trim()
      const hashedText = parts[1].trim()
      const actualHash = md5(hashedText).toLowerCase()
      hashMatches = hash == actualHash

      const sections = hashedText.split(',')
      if(sections.length != 3) {
        throw '分号后的部分必须恰好有两个逗号。'
      }
      const versionSpec = sections[0].trim()
      if(versionSpec != 'v1') {
        throw '版本标识符必须为 v1。'
      }
      
      const encoding = sections[1].trim()
      const encodedBody = sections[2].trim()
      let decodedBodyBytes: Uint8Array = new Uint8Array()
      try {
        decodedBodyBytes = Base64.toByteArray(encodedBody)
      } catch(_err) {
        throw 'Base64 解码失败。'
      }

      if(encoding == 'gzipb64') {
        try {
          decodedBodyBytes = new Uint8Array(GZip.unzip(decodedBodyBytes))
        } catch(_err) {
          throw 'GZip 解压缩失败。'
        }
      } else if(encoding == 'b64') {
        ;
      } else {
        throw '编码方式必须为 gzipb64 或 b64。'
      }
      
      try {
        jsonData = new TextDecoder().decode(decodedBodyBytes)
      } catch(_err) {
        throw 'UTF-8 解码失败。'
      }
    } else {
      parsedDataWrapperType.value = 'legacy'

      let rawData: string = ''
      try {
        rawData = atob(text)
      } catch(_err) {
        throw '旧数据格式：Base64 解码失败。'
      }
      const hash = rawData.substring(0, 32)
      jsonData = rawData.substring(32)
      const hashCharset = '0123456789abcdef'
      for(let i = 0; i < hash.length; i += 1) {
        if(hashCharset.indexOf(hash[i]) == -1) {
          throw '旧数据格式：校验值部分含非法字符。'
        }
      }
      const actualHash = md5(jsonData)
      hashMatches = hash == actualHash
    }

    try {
      parsedData.value = JSON.parse(jsonData)
    } catch(_err) {
      throw 'JSON 格式解析失败。'
    }
    parsedDataBodyType.value = (parsedData.value['_type'] === 'multi') ? 'multi' : 'single'
    if(parsedDataBodyType.value == 'multi') {
      // Select all by default
      selectedGames.value = importableGames.value.map(game => game.storage_namespace)
    } else {
      // Select none for legacy single-game format
      if(suggestedImportGames.value.length == 1) {
        selectedGames.value = [suggestedImportGames.value[0].storage_namespace]
      } else {
        selectedGames.value = []
      }
    }
    stage.value = hashMatches ? 'select_games' : 'confirm_checksum'
  } catch(err) {
    console.warn('Parse import data fail:', err)
    if(typeof err == 'string') {
      errorText.value = err
    } else {
      errorText.value = '未知错误。'
    }
    stage.value = 'error'
  }
}

const importableGames = computed(() => {
  const ret: GameItemData[] = []
  for(const game of Object.values(props.games)) {
    if(parsedDataBodyType.value == 'multi') {
      // Multi-game data format specifies which games it contains
      if((game.storage_namespace + progressStore) in parsedData.value) {
        ret.push(game)
      }
    } else {
      // Legacy single-game data format does not specify which game it belongs to
      if(game.accept_legacy_import) {
        ret.push(game)
      }
    }
  }
  return ret
})
const suggestedImportGames = computed<GameItemData[]>(() => {
  if(parsedDataBodyType.value == 'multi') {
    return []
  }
  const data = parsedData.value
  if(!('temples' in data && Array.isArray(data['temples']))) {
    return []
  }
  const ret: GameItemData[] = []
  for(const game of importableGames.value) {
    if(!Array.isArray(game.info?.temples)) {
      continue
    }
    const gameTempleSet = new Set(game.info.temples.map(id => {
      if(id.lastIndexOf('/') != -1) {
        return id.substring(id.lastIndexOf('/') + 1)
      }
      if(id == 'fairytales') {
        return 'fairy'
      }
      return id
    }))
    const dataTempleSet = new Set(data['temples'].map(item => item.id).filter(item => item != null))
    if(gameTempleSet.symmetricDifference(dataTempleSet).size == 0) {
      ret.push(game)
    }
  }
  return ret
})
const importableGameOptions = computed(() => {
  return importableGames.value.map((game): Option => {
    return {
      key: game.storage_namespace,
      title: game.name + (suggestedImportGames.value.indexOf(game) != -1 ? ' *' : ''),
      description: game.storage_namespace + progressStore,
    }
  })
})

function requestImport() {
  willOverwriteGames.value = []
  for(const game of importableGames.value) {
    if(selectedGames.value.indexOf(game.storage_namespace) == -1) {
      continue
    }
    if(localStorage.getItem(game.storage_namespace + progressStore) != null) {
      willOverwriteGames.value.push(game)
    }
  }
  if(willOverwriteGames.value.length == 0) {
    executeImport()
  } else {
    stage.value = 'confirm_overwrite'
  }
}
function executeImport() {
  importSuccessCount.value = 0
  importFailureCount.value = 0
  for(const game of importableGames.value) {
    if(selectedGames.value.indexOf(game.storage_namespace) == -1) {
      continue
    }
    let dataEntry: any = null
    if(parsedDataBodyType.value == 'single') {
      dataEntry = parsedData.value
    } else {
      dataEntry = parsedData.value[game.storage_namespace + progressStore]
    }
    if(dataEntry == null) {
      importFailureCount.value += 1
      continue
    }
    const json = JSON.stringify(dataEntry)
    const rawObject = JSON.parse(json)
    function checkSafe(obj: unknown) {
      if(Array.isArray(obj)) {
        for(const item of obj) {
          if(!checkSafe(item)) {
            return false
          }
        }
        return true
      }
      if(obj != null && typeof obj == 'object') {
        for(const key in obj) {
          if(!(key in obj)) {
            continue
          }
          const val = (obj as any)[key]
          if(
            key == 'filename' &&
            typeof val == 'string' &&
            (val.startsWith('/') || val.startsWith("\\") || val.indexOf('..') != -1)
          ) {
            return false
          }
          if(!checkSafe(val)) {
            return false
          }
        }
        return true
      }
      return true
    }
    if(!checkSafe(rawObject)) {
      importFailureCount.value += 1
      continue
    }
    localStorage.setItem(game.storage_namespace + progressStore, JSON.stringify(dataEntry))
    importSuccessCount.value += 1
  }
  stage.value = 'done'
}

</script>

<template>
  <div style="color: var(--color-caution-text)">警告：只导入从你信任的来源获取的数据。恶意数据可能导致未知信息安全隐患！</div>
  <div class="vspace" />
  <div>请将之前导出的数据粘贴到此处：</div>
  <div class="vspace" />
  <FancyInput
    theme="ambient"
    textarea
    :rows="6"
    style="width: 100%; resize: vertical;"
    v-model="importedText"
    :disabled="stage != 'paste'"
    @submit="handleValidate"
  />
  <template v-if="!showGameSelector">
    <div class="l-vspace" />
    <div class="actions">
      <FancyButton
        theme="primary"
        :disabled="stage != 'paste' || importedText == ''"
        @click="handleValidate"
      >
        <v-icon name="la-clipboard-check-solid" /> 下一步
      </FancyButton>
    </div>
  </template>

  <Dialog
    :open="stage == 'error'"
    title="数据解析失败"
    dismissable
    has-cancel
    @close="stage = 'paste'"
  >
    <DialogProse>
      <p>数据解析失败，无法继续导入。</p>
      <p>请检查数据是否粘贴完整并重试。</p>
      <ExtraInfo>
        <p>{{ errorText }}</p>
      </ExtraInfo>
    </DialogProse>
  </Dialog>

  <Dialog
    :open="stage == 'confirm_checksum'"
    title="数据校验值错误"
    theme="caution"
    dismissable
    has-cancel
    has-confirm
    @close="verdict => stage = verdict ? 'select_games' : 'paste'"
  >
    <DialogProse>
      <p>数据可正常解析，但校验值不匹配，很可能不完整或已损坏。</p>
      <p>建议先检查数据是否粘贴完整。</p>
      <p>是否仍希望导入？</p>
      <ExtraInfo caution>
        <p>导入不完整或格式错误的数据，可能导致游戏异常甚至崩溃。三思而后行！</p>
      </ExtraInfo>
    </DialogProse>
  </Dialog>
  
  <template v-if="showGameSelector">
    <div class="l-vspace" />

    <div v-if="parsedDataBodyType == 'single'">
      此文本为旧版数据格式，仅包含一个游戏的数据，且未指明是哪个游戏。<br />
      请选择正确的游戏进行导入：
    </div>
    <div v-else>
      此文本包含以下游戏的数据。你想要导入哪些？
    </div>
    
    <div class="vspace" />
    <MultiSelectList
      :options="importableGameOptions"
      v-model="selectedGames"
      theme="tertiary"
      :single="parsedDataBodyType == 'single'"
    />
    <div class="vspace" />
    <template v-if="parsedDataBodyType == 'single'">
      <div style="color: var(--color-caution-text)">注意：将数据导入错误的游戏，将导致该游戏异常甚至崩溃！</div>
      <div class="l-vspace" />
    </template>
    
    <div class="actions">
      <FancyButton
        theme="caution"
        :disabled="stage != 'select_games' || selectedGames.length == 0"
        @click="requestImport"
      >
        <v-icon name="la-file-import-solid" /> 导入并覆盖
      </FancyButton>
      <FancyButton
        theme="ambient"
        :disabled="stage != 'select_games'"
        @click="stage = 'paste'; importedText = ''"
      >
        <v-icon name="la-times-solid" /> 放弃
      </FancyButton>
    </div>
  </template>

  <Dialog
    :open="stage == 'confirm_overwrite'"
    title="数据覆盖确认"
    theme="caution"
    dismissable
    has-cancel
    has-confirm
    @close="verdict => verdict ? executeImport() : (stage = 'select_games')"
  >
    <DialogProse>
      <p>以下游戏已有进程数据：</p>
      <ul style="margin: 0 0; line-height: normal;">
        <li v-for="game of willOverwriteGames" :key="game.storage_namespace">{{ game.name }}</li>
      </ul>
      <p>继续导入将覆盖它们。仍要继续？</p>
      <ExtraInfo caution>
        <p>原有游戏成绩将永久丢失！无法撤销！</p>
        <p>如有必要，请先导出原有数据的备份。</p>
        <p>覆盖时游戏本身应处于关闭状态。</p>
      </ExtraInfo>
    </DialogProse>
  </Dialog>

  <Dialog
    :open="stage == 'done'"
    title="导入完成"
    dismissable
    has-neutral
    @close="importFailureCount == 0 ? (stage = 'paste', importedText = '') : (stage = 'select_games')"
  >
    <DialogProse>
      <p>成功导入 {{ importSuccessCount }} 个游戏的数据。</p>
      <p v-if="importFailureCount > 0">另有 {{ importFailureCount }} 项因包含不安全内容无法导入。</p>
    </DialogProse>
  </Dialog>
</template>

<style lang="css" scoped>
.l-vspace {
  height: 12px;
}
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
