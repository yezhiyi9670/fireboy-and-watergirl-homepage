<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import type { FieldSpecifier } from '../../data_model/field_specifier.ts';
import FancyButton from '../../../common/components/FancyButton.vue';
import FancyInput from '../../../common/components/FancyInput.vue';
import {
  describeValueForForm,
  firstConformingForm,
  normalizeValue,
  primitiveToForm,
  typeToForms,
  unionLetters,
  valueConforms,
  valueToPrimitiveKind,
  type EditorForm,
} from './omniForm.ts';

const props = defineProps<{
  spec: FieldSpecifier
  modelValue?: unknown
  readonly?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const value = computed(() => normalizeValue(props.modelValue))
const forms = computed(() => typeToForms(props.spec.type))
const radios = computed(() => unionLetters(props.spec.type))
const conforming = computed(() => valueConforms(value.value, props.spec.type))
const canEdit = computed(() => !props.readonly && conforming.value)

const editing = ref(false)
const commitFailed = ref(false)
const editorForm = shallowRef<EditorForm | null>(null)
const draftText = ref('')
const draftBool = ref(false)
const draftChoice = ref<string | null>(null)

const textControl = ref<{ domElement: HTMLElement | null } | null>(null)
const selectEl = ref<HTMLSelectElement | null>(null)
const boolEl = ref<HTMLInputElement | null>(null)

const displayForm = computed<EditorForm>(() => {
  if(conforming.value) {
    return firstConformingForm(forms.value, value.value) ?? forms.value[0] ?? primitiveToForm(valueToPrimitiveKind(value.value))
  }
  return primitiveToForm(valueToPrimitiveKind(value.value))
})
const displayText = computed(() => {
  return describeValueForForm(value.value, displayForm.value)
})
const choiceMapping = computed<Record<string, string>>(() => {
  const form = editorForm.value
  return form?.form == 'choice' ? form.mapping : {}
})

watch([ draftText, draftBool, draftChoice ], () => {
  commitFailed.value = false
})

function isTextForm(form: EditorForm | null) {
  return form?.form == 'number' || form?.form == 'string' || form?.form == 'unknown'
}

function initDraftFor(form: EditorForm, source: unknown) {
  const v = normalizeValue(source)
  switch(form.form) {
    case 'number':
      draftText.value = typeof v === 'number' ? String(v) : ''
      break
    case 'string':
      draftText.value = typeof v === 'string' ? v : ''
      break
    case 'unknown':
      draftText.value = v === null ? 'null' : JSON.stringify(v, null, 2)
      break
    case 'boolean':
      draftBool.value = v === true
      break
    case 'choice':
      draftChoice.value = (typeof v === 'string' && v in form.mapping) ? v : null
      break
    case 'null':
      break
  }
}

async function focusEditor(form: EditorForm) {
  await nextTick()
  switch(form.form) {
    case 'number':
    case 'string':
    case 'unknown':
      textControl.value?.domElement?.focus()
      break
    case 'choice':
      selectEl.value?.focus()
      break
    case 'boolean':
      boolEl.value?.focus()
      break
    case 'null':
      break
  }
}

function startEditing() {
  if(!canEdit.value || editing.value) {
    return
  }
  const initial = firstConformingForm(forms.value, value.value)
  if(initial == null) {
    return
  }
  editing.value = true
  commitFailed.value = false
  editorForm.value = initial
  initDraftFor(initial, value.value)
  void focusEditor(initial)
}

function discardEditing() {
  editing.value = false
  commitFailed.value = false
}

function markInvalid() {
  commitFailed.value = true
}

function attemptCommit() {
  const form = editorForm.value
  if(form == null) {
    return
  }
  switch(form.form) {
    case 'number': {
      const text = draftText.value.trim()
      if(text === '') {
        markInvalid()
        return
      }
      const num = Number(text)
      if(!Number.isFinite(num)) {
        markInvalid()
        return
      }
      editing.value = false
      emit('update:modelValue', num)
      return
    }
    case 'string': {
      editing.value = false
      emit('update:modelValue', draftText.value)
      return
    }
    case 'boolean': {
      editing.value = false
      emit('update:modelValue', draftBool.value)
      return
    }
    case 'unknown': {
      const text = draftText.value
      if(text.trim() === '') {
        markInvalid()
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        markInvalid()
        return
      }
      editing.value = false
      emit('update:modelValue', parsed)
      return
    }
    case 'choice': {
      const chosen = draftChoice.value
      if(chosen == null || !(chosen in form.mapping)) {
        markInvalid()
        return
      }
      editing.value = false
      emit('update:modelValue', chosen)
      return
    }
    case 'null': {
      editing.value = false
      emit('update:modelValue', null)
      return
    }
  }
}

function currentDraftText(form: EditorForm): string {
  switch(form.form) {
    case 'number':
    case 'string':
    case 'unknown':
      return draftText.value
    case 'boolean':
      return draftBool.value ? 'true' : 'false'
    case 'choice':
      return draftChoice.value ?? ''
    case 'null':
      return ''
  }
}

/** Returns converted text for the target form, or null when not convertible. */
function tryConvertText(text: string, target: EditorForm): string | null {
  switch(target.form) {
    case 'number': {
      const trimmed = text.trim()
      if(trimmed === '' || !Number.isFinite(Number(trimmed))) {
        return null
      }
      return trimmed
    }
    case 'string':
    case 'unknown':
      return text
    case 'boolean': {
      const low = text.trim().toLowerCase()
      return (low == 'true' || low == 'false') ? low : null
    }
    case 'choice': {
      const trimmed = text.trim()
      return (trimmed in target.mapping) ? trimmed : null
    }
    case 'null':
      return null
  }
}

function switchEditorForm(target: EditorForm) {
  const current = editorForm.value
  if(current == null || current.form === target.form) {
    return
  }
  const sourceText = currentDraftText(current)
  const converted = tryConvertText(sourceText, target)

  switch(target.form) {
    case 'number':
    case 'string':
    case 'unknown':
      draftText.value = converted ?? ''
      break
    case 'boolean':
      draftBool.value = converted == 'true'
      break
    case 'choice':
      draftChoice.value = converted
      break
    case 'null':
      break
  }

  editorForm.value = target
  void focusEditor(target)
}
</script>

<template>
  <div class="omni-input" @keydown.esc.prevent="discardEditing">
    <div class="omni-head">
      <span class="omni-label">{{ spec.label }}</span>
      <span
        v-if="!conforming"
        class="omni-warn"
        title="值的类型与字段定义不符；已禁用编辑"
      >
        <v-icon name="md-warning-twotone" />
      </span>
    </div>

    <template v-if="editing && editorForm != null">
      <div class="omni-edit">
        <div v-if="radios.length > 1" class="omni-union-radios" role="radiogroup">
          <button
            v-for="radio in radios"
            :key="radio.letter"
            type="button"
            role="radio"
            :aria-checked="editorForm?.form == radio.form.form"
            :class="[ 'omni-radio', { active: editorForm?.form == radio.form.form } ]"
            :title="radio.form.form"
            @click="switchEditorForm(radio.form)"
          >
            {{ radio.letter }}
          </button>
        </div>

        <div class="omni-control" :class="{ 'omni-invalid': commitFailed }">
          <FancyInput
            v-if="isTextForm(editorForm)"
            ref="textControl"
            v-model="draftText"
            theme="ambient"
            :textarea="editorForm?.form == 'unknown'"
            :rows="6"
            @submit="attemptCommit"
          />
          <label v-else-if="editorForm?.form == 'boolean'" class="omni-bool">
            <input
              ref="boolEl"
              v-model="draftBool"
              type="checkbox"
              @keydown.enter.prevent="attemptCommit"
            />
            {{ draftBool ? '是' : '否' }}
          </label>
          <select
            v-else-if="editorForm?.form == 'choice'"
            ref="selectEl"
            v-model="draftChoice"
            class="omni-select"
            @keydown.enter.prevent="attemptCommit"
          >
            <option :value="null" disabled>—</option>
            <option
              v-for="(label, key) in choiceMapping"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
          <span v-else-if="editorForm?.form == 'null'" class="omni-null">空</span>
        </div>

        <div class="omni-actions">
          <FancyButton theme="primary" smaller aria-label="提交" @click="attemptCommit">
            <v-icon name="md-check-twotone" />
          </FancyButton>
          <FancyButton theme="none" smaller aria-label="放弃" @click="discardEditing">
            <v-icon name="la-times-solid" />
          </FancyButton>
        </div>
      </div>
    </template>

    <div
      v-else
      class="omni-display"
      role="button"
      tabindex="0"
      :class="{ editable: canEdit, mismatched: !conforming }"
      :aria-disabled="!canEdit"
      @click="startEditing"
      @keydown.enter.prevent="startEditing"
      @keydown.space.prevent="startEditing"
    >
      <div class="omni-display-inner">{{ displayText }}</div>
      <span v-if="!conforming" class="omni-actual-kind">{{ displayForm.form }}</span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.omni-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.omni-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.omni-label {
  opacity: .75;
}
.omni-warn {
  color: var(--color-caution);
  display: inline-flex;
}
.omni-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.omni-union-radios {
  display: flex;
  gap: 4px;
}
.omni-radio {
  border: none;
  padding: 2px 8px;
  cursor: pointer;
  background: var(--color-ambient);
  color: inherit;
  font-weight: bold;
}
.omni-radio.active {
  background: var(--color-primary);
  color: var(--color-r0);
}
.omni-control {
  display: flex;
  align-items: flex-start;
}
.omni-control :deep(.FancyInput) {
  width: 100%;
}
.omni-select {
  width: 100%;
}
.omni-control.omni-invalid {
  outline: 2px solid var(--color-caution);
  outline-offset: 2px;
  animation: omni-shake .12s ease-in-out 2;
}
.omni-bool {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 8px;
  background: var(--color-ambient);
  user-select: none;
}
.omni-select {
  background: var(--color-ambient);
  border: none;
  padding: 6px 8px;
  color: inherit;
}
.omni-null {
  padding: 6px 8px;
  background: var(--color-ambient);
  opacity: .6;
}
.omni-actions {
  display: flex;
  gap: 6px;
}
.omni-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-separator);
  min-height: 1.4em;
  cursor: default;
  user-select: text;
}
.omni-display.editable {
  cursor: pointer;
}
.omni-display.editable:hover {
  border-color: var(--color-primary);
}
.omni-display.mismatched {
  border-color: var(--color-caution);
  opacity: .8;
}
.omni-display-inner {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 12em;
  overflow: auto;
  font-family: ui-monospace, monospace;
  font-size: .85em;
}
.omni-actual-kind {
  align-self: flex-start;
  font-size: .7em;
  padding: 1px 6px;
  background: var(--color-caution);
  color: var(--color-r0);
}
@keyframes omni-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
</style>
