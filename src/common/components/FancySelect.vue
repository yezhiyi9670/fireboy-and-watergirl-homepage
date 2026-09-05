<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

export type FancySelectOption = {
  value: string | number | boolean
  label: string
}

const props = withDefaults(defineProps<{
  theme: 'ambient' | 'primary' | 'caution' | 'tertiary',
  options?: readonly FancySelectOption[],
  placeholder?: string,
  readonly?: boolean,
  disabled?: boolean,
  smaller?: boolean,
}>(), {
  theme: 'ambient',
  options: () => [],
  placeholder: '—',
})
const model = defineModel<string | number | boolean | null>()
const emit = defineEmits<{
  submit: []
  pick: []
}>()

const classList = computed(() => [
  'FancySelect',
  'global-themed',
  'theme-' + props.theme,
  ...(props.smaller ? ['smaller'] : []),
  ...(props.disabled ? ['disabled'] : []),
])

const selectValue = computed(() => {
  return model.value == null ? '' : String(model.value)
})

const domElement = useTemplateRef('domElement')
defineExpose({ domElement })

function onChange() {
  if(props.readonly || props.disabled) {
    return
  }
  const raw = domElement.value?.value ?? ''
  const matched = props.options.find(option => String(option.value) === raw)
  model.value = matched ? matched.value : null
  emit('pick')
}
function onSubmit(evt: KeyboardEvent) {
  if(props.disabled || props.readonly) {
    return
  }
  evt.preventDefault()
  emit('submit')
}
</script>

<template>
  <select
    ref="domElement"
    :class="classList"
    :value="selectValue"
    :disabled="props.disabled || props.readonly"
    :aria-disabled="props.disabled"
    @change="onChange"
    @keydown.enter="onSubmit"
  >
    <option value="" disabled>{{ props.placeholder }}</option>
    <option
      v-for="option in props.options"
      :key="String(option.value)"
      :value="String(option.value)"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
.FancySelect {
  padding: 8px 10px;
  display: inline-block;
  box-sizing: border-box;
  font: inherit;
  line-height: 1.4;
}
.FancySelect.smaller {
  padding: 6px 8px;
}
.FancySelect.disabled {
  opacity: .5;
  cursor: not-allowed;
}
</style>
