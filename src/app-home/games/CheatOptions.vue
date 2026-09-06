<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import Dialog from '../../common/components/Dialog.vue';
import CheatToggleButton from './CheatToggleButton.vue';
import { useIntervalFn } from '@vueuse/core';
import ExtraInfo from '../../common/components/ExtraInfo.vue';
import ApiHomeData from '../../common/data_model/home/ApiHomeData.ts';

const props = defineProps<{
  gameName: string
  storageNamespace: string
  supportedFlags: string[]
}>()

const homeData = inject(ApiHomeData.injectionKey)
const cheatFlagDefs = computed(() => {
  return homeData?.value?.cheat_flag_defs
})
const cheatFlagValues = ref<Record<string, boolean>>({})
function updateCheatFlagValues() {
  const values: Record<string, boolean> = Object.create(null)
  for(const flag of props.supportedFlags) {
    values[flag] = !!localStorage.getItem(props.storageNamespace + ':' + flag)
  }
  cheatFlagValues.value = values
}
watchEffect(updateCheatFlagValues)
useIntervalFn(updateCheatFlagValues, 3000)

const isAnyCheatOn = computed(() => {
  for(const flag of props.supportedFlags) {
    if(!!cheatFlagValues.value[flag]) {
      return true
    }
  }
  return false
})

const isDialogOpen = ref(false)
function cheatEditDone() {
  // updateCheatFlagValues()
  isDialogOpen.value = false
}

</script>

<template>
  <template v-if="cheatFlagDefs != null">
    <FancyButton
      :disabled="props.supportedFlags.length == 0"
      :theme="isAnyCheatOn ? 'caution' : 'ambient'"
      @click="isDialogOpen=true"
    >
      <v-icon name="la-bug-solid" /> 作弊旗标
    </FancyButton>
    <Dialog :open="isDialogOpen" :title="'作弊旗标 – ' + props.gameName" dismissable has-neutral @close="cheatEditDone">
      <div class="settings-table">
        <template v-for="cheatFlagDef, cheatFlagKey in cheatFlagDefs" :key="cheatFlagKey">
          <div class="settings-row" v-if="props.supportedFlags.indexOf(cheatFlagKey) != -1">
            <div class="setting-btn-container">
              <CheatToggleButton
                :storage-namespace="props.storageNamespace"
                :cheat-flag-key="cheatFlagKey"
                @change="newState => cheatFlagValues[cheatFlagKey] = newState"
              />
            </div>
            <div class="setting-text-container">
              <div class="setting-name">{{ cheatFlagDef.name }}</div>
              <template v-if="cheatFlagDef.description != null">
                <div class="setting-desc">{{ cheatFlagDef.description }}</div>
              </template>
            </div>
          </div>
        </template>
      </div>
      <ExtraInfo>
        <p>作弊功能可能严重削弱游戏挑战性和趣味性，只应该用来调试游戏关卡，以及帮助能力有限的新玩家熟悉游戏。切勿过度依赖。</p>
        <p>旗标修改后须重新加载游戏才会生效。</p>
      </ExtraInfo>
    </Dialog>
  </template>
</template>

<style lang="css" scoped>
.settings-row {
  padding-bottom: 10px;
  padding-top: 10px;
  display: flex;
  align-items: center;
}
.settings-row:not(:last-child) {
  border-bottom: 1px solid var(--color-separator);
}
.setting-btn-container {
  padding-left: 8px;
  padding-right: 14px;
}
.setting-text-container {
  width: 0;
  flex-grow: 1;
}
.setting-name {
  font-weight: normal;
}
.setting-desc {
  font-size: 0.95em;
  color: var(--color-t1);
  margin-top: .2em;
  white-space: pre-wrap;
}
</style>
