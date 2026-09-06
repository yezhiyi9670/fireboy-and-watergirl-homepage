<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import type { FieldSpecifier } from '../../data_model/field_specifier.ts';
import FancyButton from '../FancyButton.vue';
import FancyInput from '../FancyInput.vue';
import FancySelect from '../FancySelect.vue';
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

const props = withDefaults(defineProps<{
  spec: FieldSpecifier
  modelValue?: unknown
  theme?: 'ambient' | 'primary' | 'caution' | 'tertiary'
  readonly?: boolean
  disabled?: boolean
  smaller?: boolean
  autofocus?: boolean
}>(), {
  theme: 'ambient',
})
const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const value = computed(() => normalizeValue(props.modelValue))
const forms = computed(() => typeToForms(props.spec.type))
const radios = computed(() => unionLetters(props.spec.type))
const conforming = computed(() => valueConforms(value.value, props.spec.type))
const canEdit = computed(() => !props.readonly && !props.disabled && conforming.value)

const editing = ref(false)
const commitFailed = ref(false)
const editorForm = shallowRef<EditorForm | null>(null)
const draftText = ref('')
const draftBool = ref(false)
const draftChoice = ref<string | null>(null)

const textControl = ref<{ domElement: HTMLElement | null } | null>(null)
const selectControl = ref<{ domElement: HTMLSelectElement | null } | null>(null)

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
const choiceOptions = computed(() => {
  return Object.entries(choiceMapping.value).map(([ value, label ]) => ({ value, label }))
})
const booleanOptions = [
  { value: true, label: '是' },
  { value: false, label: '否' },
] as const
const booleanSelectValue = computed<boolean | null>({
  get: () => draftBool.value,
  set: (value) => {
    if(value != null) {
      draftBool.value = value
    }
  },
})
const nullText = ref('')

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
    case 'null':
      textControl.value?.domElement?.focus()
      break
    case 'boolean':
      selectControl.value?.domElement?.focus()
      break
    case 'choice':
      const select = selectControl.value?.domElement
      select?.focus()
      tryOpenSelect(select)
      break
  }
}

/** Best-effort: natively open the <select> dropdown on supporting browsers. */
function tryOpenSelect(select: HTMLSelectElement | null | undefined) {
  if(select == null) {
    return
  }
  const pickable = select as HTMLSelectElement & { showPicker?: () => void }
  if(typeof pickable.showPicker === 'function') {
    try {
      pickable.showPicker()
    } catch {
      // Not user-activated or unsupported; fall back to focused (closed) select.
    }
  }
}

function valueToEditableText(source: unknown): string {
  const v = normalizeValue(source)
  if(v === null) {
    return ''
  }
  if(typeof v === 'boolean') {
    return v ? 'true' : 'false'
  }
  if(typeof v === 'number' || typeof v === 'string') {
    return String(v)
  }
  return JSON.stringify(v)
}

function applyConvertedText(form: EditorForm, converted: string | null) {
  switch(form.form) {
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
}

function beginEditingWith(form: EditorForm) {
  editing.value = true
  commitFailed.value = false
  editorForm.value = form
  const initial = firstConformingForm(forms.value, value.value)
  if(initial != null && initial.form === form.form) {
    initDraftFor(form, value.value)
  } else {
    applyConvertedText(form, tryConvertText(valueToEditableText(value.value), form))
  }
  void focusEditor(form)
}

function startEditing() {
  if(!canEdit.value || editing.value) {
    return
  }
  const initial = firstConformingForm(forms.value, value.value)
  if(initial == null) {
    return
  }
  beginEditingWith(initial)
}

function isTypeActive(form: EditorForm) {
  if(editing.value && editorForm.value != null) {
    return editorForm.value.form === form.form
  }
  return displayForm.value.form === form.form
}

function handleTypeClick(form: EditorForm) {
  if(!canEdit.value) {
    return
  }
  if(editing.value) {
    if(editorForm.value != null) {
      switchEditorForm(form)
    }
  } else {
    beginEditingWith(form)
  }
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
  applyConvertedText(target, tryConvertText(sourceText, target))
  editorForm.value = target
  void focusEditor(target)
}

const rootEl = ref<HTMLElement | null>(null)

function isFocusInsideRoot(node: Node | null) {
  return node != null && rootEl.value != null && rootEl.value.contains(node)
}
function scheduleCommitOnIdleFocus() {
  requestAnimationFrame(() => {
    if(!editing.value || isFocusInsideRoot(document.activeElement)) {
      return
    }
    attemptCommit()
  })
}
function onFocusOut(evt: FocusEvent) {
  if(!editing.value || editorForm.value == null) {
    return
  }
  const related = evt.relatedTarget
  if(related == null) {
    // Caused either by removing the focused element (e.g. just entered edit mode)
    // or by tabbing/clicking to a non-focusable spot; wait a frame to see where
    // focus actually settled before deciding to commit.
    scheduleCommitOnIdleFocus()
  } else if(!isFocusInsideRoot(related as Node)) {
    attemptCommit()
  }
}

defineExpose({ startEditing })

onMounted(() => {
  if(!props.autofocus || editing.value || !canEdit.value) {
    return
  }
  const initial = firstConformingForm(forms.value, value.value)
  if(initial != null) {
    beginEditingWith(initial)
  }
})
</script>

<template>
  <div class="omni-input" ref="rootEl" @keydown.esc.prevent="discardEditing" @focusout="onFocusOut">
    <div class="omni-head">
      <div class="omni-types" role="radiogroup" :aria-label="'类型：' + spec.label">
        <button
          v-for="radio in radios"
          :key="radio.letter"
          type="button"
          role="radio"
          :disabled="!canEdit"
          :aria-checked="isTypeActive(radio.form)"
          :class="[ 'omni-radio', { active: isTypeActive(radio.form) } ]"
          :title="radio.form.form"
          @click="handleTypeClick(radio.form)"
        >
          {{ radio.letter }}
        </button>
      </div>
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
        <div class="omni-control" :class="{ 'omni-invalid': commitFailed }">
          <FancyInput
            v-if="isTextForm(editorForm)"
            ref="textControl"
            v-model="draftText"
            :theme="props.theme"
            :disabled="props.disabled"
            :smaller="props.smaller"
            :textarea="editorForm?.form == 'unknown'"
            :rows="6"
            @submit="attemptCommit"
          />
          <FancySelect
            v-else-if="editorForm?.form == 'boolean'"
            ref="selectControl"
            v-model="booleanSelectValue"
            :theme="props.theme"
            :disabled="props.disabled"
            :smaller="props.smaller"
            placeholder="—"
            :options="booleanOptions"
            @submit="attemptCommit"
          />
          <FancySelect
            v-else-if="editorForm?.form == 'choice'"
            ref="selectControl"
            v-model="draftChoice"
            :theme="props.theme"
            :disabled="props.disabled"
            :smaller="props.smaller"
            placeholder="—"
            :options="choiceOptions"
            @submit="attemptCommit"
            @pick="attemptCommit"
          />
          <FancyInput
            v-else-if="editorForm?.form == 'null'"
            ref="textControl"
            v-model="nullText"
            :theme="props.theme"
            :disabled="props.disabled"
            :smaller="props.smaller"
            readonly
            placeholder="空"
            @submit="attemptCommit"
          />
          <FancyButton
            class="omni-discard"
            :theme="props.theme"
            :smaller="props.smaller"
            aria-label="放弃编辑"
            title="放弃编辑"
            @click="discardEditing"
          >
            <v-icon name="la-undo-alt-solid" />
          </FancyButton>
        </div>
      </div>
    </template>

    <div
      v-else
      class="omni-display global-themed"
      :class="[
        'theme-' + props.theme,
        { editable: canEdit, mismatched: !conforming, smaller: props.smaller, disabled: props.disabled }
      ]"
      role="button"
      tabindex="0"
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
  gap: 8px;
  min-width: 0;
}
.omni-types {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.omni-label {
  opacity: .75;
  white-space: nowrap;
}
.omni-warn {
  color: var(--color-caution);
  display: inline-flex;
  margin-left: auto;
  flex-shrink: 0;
}
.omni-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.omni-radio {
  border: none;
  padding: 2px 6px;
  cursor: pointer;
  background: var(--color-ambient);
  color: inherit;
  font-weight: bold;
  line-height: 1.2;
}
.omni-radio:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.omni-radio.active {
  background: var(--color-t0);
  color: var(--color-r0);
}
.omni-control {
  display: flex;
  align-items: start;
  gap: 6px;
}
.omni-control :deep(.FancyInput),
.omni-control :deep(.FancySelect) {
  flex: 1 1 auto;
  min-width: 0;
  resize: vertical;
}
.omni-discard {
  flex-shrink: 0;
  flex-grow: 0;
}
.omni-control.omni-invalid {
  outline: 2px solid var(--color-caution);
  outline-offset: 2px;
  animation: omni-shake .12s ease-in-out 2;
}
.omni-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  min-height: 1.4em;
  cursor: default;
  user-select: text;
  box-sizing: border-box;
  font: inherit;
  line-height: 1.4;
}
.omni-display.smaller {
  padding: 6px 8px;
}
.omni-display.editable {
  cursor: pointer;
}
.omni-display.disabled {
  opacity: .5;
  cursor: not-allowed;
}
.omni-display.mismatched {
  outline: 2px solid var(--color-caution);
  outline-offset: -2px;
}
.omni-display-inner {
  width: 0;
  flex: 1;
  /* min-width: 0; */
  min-height: 1.4em;
  white-space: pre;
  /* white-space: pre-wrap; */
  /* word-break: break-word; */
  max-height: 12em;
  overflow: auto;
  scrollbar-width: none;
}
.omni-actual-kind {
  align-self: flex-start;
  flex-shrink: 0;
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
