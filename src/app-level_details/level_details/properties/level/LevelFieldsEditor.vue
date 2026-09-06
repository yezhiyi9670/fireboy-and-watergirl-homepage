<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue';
import LevelItemData from '../../../../common/data_model/temples/LevelItemData.ts';
import TempleItemData from '../../../../common/data_model/temples/TempleItemData.ts';
import ApiTemplesData from '../../../../common/data_model/temples/ApiTemplesData.ts';
import type { FieldSpecifier } from '../../../../common/data_model/field_specifier.ts';
import { defaultInitialValue } from '../../../../common/data_model/field_specifier.ts';
import FancyInput from '../../../../common/components/FancyInput.vue';
import FancyButton from '../../../../common/components/FancyButton.vue';
import OmniInput from '../../../../common/components/edit/OmniInput.vue';

const props = defineProps<{
  level: LevelItemData
}>()

const temple = inject(TempleItemData.injectionKey)
const knownKeys = LevelItemData.useKnownKeys()
const editingAllowed = ApiTemplesData.useIsEditingAllowed()

type FieldHandle = { focus?: () => void }
const fieldRefs = new Map<string, FieldHandle>()

function registerField(key: string, handle: FieldHandle | null) {
  if(handle == null) {
    fieldRefs.delete(key)
  } else {
    fieldRefs.set(key, handle)
  }
}
function isExcluded(key: string) {
  return key === 'id' || key === '_id' || key.startsWith('__')
}
const levelRecord = computed<Record<string, unknown>>(() => props.level as unknown as Record<string, unknown>)

const persistentKeys = computed(() => {
  return Object.keys(knownKeys.value).filter(key =>
    !isExcluded(key) && !knownKeys.value[key].transient
  )
})
const rows = computed(() => {
  const persistentSet = new Set(persistentKeys.value)
  const extra: string[] = []
  for(const key of Object.keys(levelRecord.value)) {
    if(isExcluded(key) || persistentSet.has(key)) {
      continue
    }
    if(levelRecord.value[key] !== undefined) {
      extra.push(key)
    }
  }
  return [ ...persistentKeys.value, ...extra ]
})

function specFor(key: string): FieldSpecifier {
  const known = knownKeys.value[key]
  if(known != null) {
    return known
  }
  return { ...LevelItemData.restSpec, label: key }
}
function getValue(key: string): unknown {
  return levelRecord.value[key]
}
function updateValue(key: string, value: unknown) {
  levelRecord.value[key] = value
  temple?.value.markDirty()
}
function focusField(key: string) {
  fieldRefs.get(key)?.focus?.()
}

// --- add field -------------------------------------------------------------

const newKeyName = ref('')
const addError = ref('')

function submitCreate() {
  if(!editingAllowed.value) {
    return
  }
  const key = newKeyName.value.trim()
  addError.value = ''
  if(key === '') {
    return
  }
  if(key.startsWith('__')
    || key === 'constructor'
    || key === 'prototype'
    || (key in Object.prototype)) {
    addError.value = '不允许创建该字段名'
    return
  }
  const persistentSet = new Set(persistentKeys.value)
  if(persistentSet.has(key) || levelRecord.value[key] !== undefined) {
    addError.value = '字段已存在'
    void nextTick(() => focusField(key))
    return
  }
  // Delete any own (possibly non-enumerable / undefined) property first so the
  // newly created field always sorts last.
  if(Object.prototype.hasOwnProperty.call(levelRecord.value, key)) {
    delete levelRecord.value[key]
  }
  const spec = specFor(key)
  let value = spec.initial
  if(value === undefined) {
    value = defaultInitialValue(spec.type)
  }
  if(value === undefined) {
    addError.value = '无法为该字段确定默认值'
    return
  }
  levelRecord.value[key] = value
  temple?.value.markDirty()
  newKeyName.value = ''
  void nextTick(() => focusField(key))
}
</script>

<template>
  <div class="fields-editor">
    <div
      v-for="key in rows"
      :key="key"
      class="field-row"
    >
      <OmniInput
        :model-value="getValue(key)"
        :spec="specFor(key)"
        :readonly="!editingAllowed"
        :ref="el => registerField(key, el as FieldHandle | null)"
        @update:model-value="value => updateValue(key, value)"
      />
    </div>
    <div v-if="editingAllowed" class="add-field">
      <FancyInput
        v-model="newKeyName"
        theme="ambient"
        smaller
        placeholder="新字段键名"
        @submit="submitCreate"
      />
      <FancyButton theme="primary" smaller @click="submitCreate">创建</FancyButton>
    </div>
    <p v-if="addError" class="add-error">{{ addError }}</p>
  </div>
</template>

<style lang="css" scoped>
.fields-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.add-field {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-top: 4px;
}
.add-field .FancyInput {
  flex: 1 1 auto;
  min-width: 0;
}
.add-error {
  margin: 0;
  color: var(--color-caution-text);
}
</style>
