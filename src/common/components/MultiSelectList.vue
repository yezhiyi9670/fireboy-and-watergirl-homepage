<script setup lang="ts">
import { computed } from 'vue'
import FancyButton from './FancyButton.vue'

export interface Option {
  key: string
  title?: string
  description?: string
  forcedState?: boolean
}
const props = defineProps<{
  options: Option[]
  theme: 'primary' | 'caution' | 'tertiary'
  single?: boolean
}>()
const model = defineModel<string[]>({default: []})

function handleToggle(key: string) {
  const index = model.value.indexOf(key)
  if(index == -1) {
    if(props.single) {
      model.value.splice(0)
    }
    model.value.push(key)
  } else {
    model.value.splice(index, 1)
  }
}

const canSelectSomething = computed(() => {
  for(let option of props.options) {
    if(option.forcedState == null) {
      return true
    }
  }
  return false
})
const selectedAll = computed(() => {
  if(!canSelectSomething.value) {
    return false
  }
  for(let option of props.options) {
    if(option.forcedState == null && model.value.indexOf(option.key) == -1) {
      return false
    }
  }
  return true
})
function handleToggleSelectAll() {
  if(!selectedAll.value) {
    if(props.single) {
      return
    }
    for(let option of props.options) {
      if(model.value.indexOf(option.key) == -1) {
        model.value.push(option.key)
      }
    }
  } else {
    model.value.splice(0)
  }
}
</script>

<template>
  <div class="settings-table">
    <div class="settings-row select-all" v-if="props.options.length == 0">
      <div class="setting-btn-container">
        <FancyButton
          theme="ambient"
          disabled
          smaller
        >
          <v-icon name="la-ban-solid" />
        </FancyButton>
      </div>
      <div class="setting-text-container">
        <div class="setting-name"><i>无数据</i></div>
      </div>
    </div>
    <div class="settings-row select-all" v-if="!props.single && props.options.length != 0">
      <div class="setting-btn-container">
        <FancyButton
          :theme="selectedAll ? props.theme : 'ambient'"
          :disabled="!canSelectSomething"
          @click="handleToggleSelectAll"
          smaller
        >
          <v-icon name="la-check-double-solid" />
        </FancyButton>
      </div>
      <div class="setting-text-container">
        <div class="setting-name"><i>全选</i></div>
      </div>
    </div>
    <template v-for="option in props.options" :key="option.key">
      <div class="settings-row">
        <div class="setting-btn-container">
          <FancyButton
            :theme="(option.forcedState ?? (model.indexOf(option.key) != -1)) ? props.theme : 'ambient'"
            :disabled="option.forcedState != null"
            @click="handleToggle(option.key)"
            smaller
          >
            <v-icon name="la-ban-solid" v-if="option.forcedState != null" />
            <template v-else-if="model.indexOf(option.key) != -1">
              <v-icon name="la-check-circle-solid" v-if="props.single" />
              <v-icon name="la-check-solid" v-else />
            </template>
            <template v-else>
              <v-icon name="la-circle-solid" v-if="props.single" />
              <v-icon name="la-minus-solid" v-else />
            </template>
          </FancyButton>
        </div>
        <div class="setting-text-container">
          <div class="setting-name">{{ option.title ?? option.key }}</div>
          <template v-if="option.description != null">
            <div class="setting-desc">{{ option.description }}</div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
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
