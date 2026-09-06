<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from 'vue';
import type { FieldSpecifier } from '../../data_model/field_specifier.ts';
import FancyButton from '../FancyButton.vue';
import FancyInput from '../FancyInput.vue';
import FancySelect from '../FancySelect.vue';
import {
  convertTextToForm,
  firstConformingForm,
  primitiveToForm,
  typeToForms,
  unionLetters,
  valueConforms,
  valueToEditableText,
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

const value = computed(() => props.modelValue)
const forms = computed(() => typeToForms(props.spec.type))
const radios = computed(() => unionLetters(props.spec.type))
const conforming = computed(() => valueConforms(value.value, props.spec.type))
/** Readonly/disabled or a mismatched value must never be editable. */
const canType = computed(() => !props.readonly && !props.disabled && conforming.value)
const controlReadonly = computed(() => props.readonly || !conforming.value)

const displayForm = computed<EditorForm>(() => {
  if(conforming.value) {
    return firstConformingForm(forms.value, value.value) ?? forms.value[0] ?? primitiveToForm(valueToPrimitiveKind(value.value))
  }
  return primitiveToForm(valueToPrimitiveKind(value.value))
})

const editing = ref(false)
const commitFailed = ref(false)
const editorForm = shallowRef<EditorForm | null>(null)
const draftText = ref('')

const controlForm = computed<EditorForm>(() => {
  if(editing.value && editorForm.value != null) {
    return editorForm.value
  }
  return displayForm.value
})

function isTextKind(form: EditorForm | null) {
  return form?.form == 'number' || form?.form == 'string' || form?.form == 'unknown'
}
function isSelectKind(form: EditorForm | null) {
  return form?.form == 'boolean' || form?.form == 'choice'
}

// --- element refs ----------------------------------------------------------

const textControl = useTemplateRef('textControl')
const selectControl = useTemplateRef('selectControl')
const rootEl = useTemplateRef('rootEl')

function isFocusInsideRoot(node: Node | null) {
  return node != null && rootEl.value != null && rootEl.value.contains(node)
}

async function focusControl() {
  await nextTick()
  if(isSelectKind(controlForm.value)) {
    selectControl.value?.domElement?.focus()
  } else {
    textControl.value?.domElement?.focus()
  }
}

/** Best-effort: natively open a <select> dropdown on supporting browsers. */
function tryOpenSelect(select: HTMLSelectElement | null | undefined) {
  if(select == null) {
    return
  }
  const pickable = select as HTMLSelectElement & { showPicker?: () => void }
  if(typeof pickable.showPicker === 'function') {
    try {
      pickable.showPicker()
    } catch {
      // Not user-activated or unsupported; fall back to a focused (closed) select.
    }
  }
}

async function focusAndMaybeOpen(form: EditorForm, openChoice: boolean) {
  await focusControl()
  if(openChoice && (form.form == 'choice' || form.form == 'boolean')) {
    tryOpenSelect(selectControl.value?.domElement)
  }
}

// --- committed-value helpers -----------------------------------------------

function serializeForText(form: EditorForm): string {
  const v = value.value
  switch(form.form) {
    case 'number':
      return typeof v === 'number' ? String(v) : ''
    case 'string':
      return typeof v === 'string' ? v : ''
    case 'unknown':
      if(v === null) {
        return 'null'
      }
      if(typeof v === 'string') {
        return JSON.stringify(v)
      }
      return JSON.stringify(v, null, 2)
    default:
      return ''
  }
}

const textModel = computed<string>({
  get: () => {
    if(editing.value && isTextKind(editorForm.value)) {
      return draftText.value
    }
    return serializeForText(controlForm.value)
  },
  set: (text: string) => {
    if(!canType.value) {
      return
    }
    if(!editing.value) {
      beginEditingWith(controlForm.value)
    }
    if(isTextKind(editorForm.value)) {
      draftText.value = text
      commitFailed.value = false
    }
  },
})

// --- editing lifecycle -----------------------------------------------------

function beginEditingWith(form: EditorForm, openChoice = false) {
  editing.value = true
  commitFailed.value = false
  editorForm.value = form
  if(isTextKind(form)) {
    const initial = firstConformingForm(forms.value, value.value)
    if(initial != null && initial.form === form.form) {
      draftText.value = serializeForText(form)
    } else {
      draftText.value = convertTextToForm(valueToEditableText(value.value), form) ?? ''
    }
  }
  void focusAndMaybeOpen(form, openChoice)
}

function markInvalid() {
  commitFailed.value = true
}

/** Commit a text/null edit. Returns true when it left edit mode. */
function finishTextCommit(): boolean {
  const form = editorForm.value
  if(form == null) {
    return true
  }
  if(form.form == 'null') {
    editing.value = false
    commitFailed.value = false
    emit('update:modelValue', null)
    return true
  }
  if(form.form == 'undefined') {
    editing.value = false
    commitFailed.value = false
    emit('update:modelValue', undefined)
    return true
  }
  if(form.form == 'number') {
    const text = draftText.value.trim()
    if(text === '' || !Number.isFinite(Number(text))) {
      markInvalid()
      return false
    }
    editing.value = false
    commitFailed.value = false
    emit('update:modelValue', Number(text))
    return true
  }
  if(form.form == 'string') {
    editing.value = false
    commitFailed.value = false
    emit('update:modelValue', draftText.value)
    return true
  }
  if(form.form == 'unknown') {
    const text = draftText.value
    if(text.trim() === '') {
      markInvalid()
      return false
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      markInvalid()
      return false
    }
    editing.value = false
    commitFailed.value = false
    emit('update:modelValue', parsed)
    return true
  }
  return true
}

function undoEditing() {
  editing.value = false
  commitFailed.value = false
  draftText.value = ''
  editorForm.value = null
}

function onFocusOut(evt: FocusEvent) {
  if(!editing.value || editorForm.value == null) {
    return
  }
  const related = evt.relatedTarget
  if(related != null && isFocusInsideRoot(related as Node)) {
    return
  }
  if(isTextKind(editorForm.value)
    || editorForm.value.form == 'null'
    || editorForm.value.form == 'undefined') {
    finishTextCommit()
  } else if(isSelectKind(editorForm.value)) {
    // Selects commit immediately on change; closing without a change just ends edit.
    editing.value = false
    commitFailed.value = false
  }
}

// --- manual entry ----------------------------------------------------------

function onF2() {
  if(!canType.value || editing.value) {
    return
  }
  beginEditingWith(displayForm.value)
}

function toggleNullEdit() {
  if(!canType.value) {
    return
  }
  const form = controlForm.value.form
  if(form !== 'null' && form !== 'undefined') {
    return
  }
  if(editing.value && editorForm.value?.form === form) {
    undoEditing()
    return
  }
  beginEditingWith(form === 'null' ? { form: 'null' } : { form: 'undefined' })
}

// --- select commits --------------------------------------------------------

function commitSelectValue(newValue: string | number | boolean | null) {
  if(!canType.value) {
    return
  }
  editing.value = false
  commitFailed.value = false
  emit('update:modelValue', newValue)
}

const booleanSelectValue = computed<boolean | null>({
  get: () => (typeof value.value === 'boolean' ? value.value : null),
  set: (v) => commitSelectValue(v),
})
const choiceSelectValue = computed<string | null>({
  get: () => (typeof value.value === 'string' ? value.value : null),
  set: (v) => commitSelectValue(v),
})
const booleanOptions = [
  { value: true, label: '是' },
  { value: false, label: '否' },
]
const choiceOptions = computed(() => {
  const choice = forms.value.find(form => form.form == 'choice')
  if(choice == null || choice.form != 'choice') {
    return []
  }
  return Object.entries(choice.mapping).map(([ value, label ]) => ({ value, label }))
})

// --- type switch (always allowed to enter editing) -------------------------

function isTypeActive(form: EditorForm) {
  if(editing.value && editorForm.value != null) {
    return editorForm.value.form === form.form
  }
  return displayForm.value.form === form.form
}
function handleTypeClick(form: EditorForm) {
  if(!canType.value) {
    return
  }
  // Switching a value to `undefined` commits immediately so transient fields
  // disappear right away.
  if(form.form === 'undefined') {
    editing.value = false
    commitFailed.value = false
    emit('update:modelValue', undefined)
    return
  }
  if(!editing.value) {
    // Opening a dropdown needs the user gesture from this click.
    beginEditingWith(form, true)
    return
  }
  const current = editorForm.value
  if(current == null || current.form === form.form) {
    return
  }
  if(isTextKind(form)) {
    const sourceText = isTextKind(current)
      ? draftText.value
      : valueToEditableText(value.value)
    draftText.value = convertTextToForm(sourceText, form) ?? ''
    editorForm.value = form
  } else {
    editorForm.value = form
  }
  void focusAndMaybeOpen(form, true)
}

// --- autofocus (focus only, do not enter editing) --------------------------

onMounted(() => {
  if(!props.autofocus || props.readonly || props.disabled || !conforming.value) {
    return
  }
  void focusControl()
})

function exposeFocus() {
  void focusControl()
}
defineExpose({ focus: exposeFocus })
</script>

<template>
  <div class="omni-input" ref="rootEl" @keydown.esc.prevent="undoEditing" @keydown.f2.prevent="onF2" @focusout="onFocusOut">
    <div class="omni-head">
      <div class="omni-types" role="radiogroup" :aria-label="'类型：' + spec.label">
        <button
          v-for="radio in radios"
          :tabindex="editing ? 0 : -1"
          :key="radio.letter"
          type="button"
          role="radio"
          :disabled="!canType"
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

    <div class="omni-control" :class="{ 'omni-invalid': commitFailed }">
      <FancyInput
        v-if="isTextKind(controlForm)"
        ref="textControl"
        :model-value="textModel"
        @update:model-value="v => textModel = v"
        :theme="props.theme"
        :readonly="controlReadonly"
        :disabled="props.disabled"
        :smaller="props.smaller"
        :textarea="controlForm.form == 'unknown'"
        :rows="6"
        class="omni-edit"
        :class="{ mismatched: !conforming }"
        @submit="finishTextCommit()"
      />
      <FancySelect
        v-else-if="controlForm.form == 'boolean'"
        ref="selectControl"
        v-model="booleanSelectValue"
        :theme="props.theme"
        :readonly="controlReadonly"
        :disabled="props.disabled"
        :smaller="props.smaller"
        placeholder="—&#x3000;"
        :options="booleanOptions"
        class="omni-edit"
        :class="{ mismatched: !conforming }"
        @focus="beginEditingWith({ form: 'boolean' })"
      />
      <FancySelect
        v-else-if="controlForm.form == 'choice'"
        ref="selectControl"
        v-model="choiceSelectValue"
        :theme="props.theme"
        :readonly="controlReadonly"
        :disabled="props.disabled"
        :smaller="props.smaller"
        placeholder="—&#x3000;"
        :options="choiceOptions"
        class="omni-edit"
        :class="{ mismatched: !conforming }"
      />
      <FancyButton
        v-else-if="controlForm.form == 'null' || controlForm.form == 'undefined'"
        :theme="props.theme"
        :disabled="controlReadonly || props.disabled"
        :smaller="props.smaller"
        class="omni-edit"
        :class="{ mismatched: !conforming }"
        @click="toggleNullEdit"
      >
        {{ controlForm.form === 'null' ? '空值' : '未定义' }}
      </FancyButton>

      <FancyButton
        tabindex="-1"
        :disabled="!editing"
        class="omni-discard"
        :theme="theme"
        :smaller="smaller"
        aria-label="撤销"
        title="撤销"
        @click="undoEditing"
      >
        <v-icon name="la-undo-alt-solid" />
      </FancyButton>
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
  width: 0;
  flex: 1;
  opacity: .75;
  white-space: pre-wrap;
}
.omni-warn {
  color: var(--color-caution);
  display: inline-flex;
  flex-shrink: 0;
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
.omni-control .omni-edit {
  flex: 1 1 auto;
  min-width: 0;
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
.omni-control>.mismatched {
  box-shadow: inset 0 0 0 2px var(--color-caution);
}
@keyframes omni-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
</style>
