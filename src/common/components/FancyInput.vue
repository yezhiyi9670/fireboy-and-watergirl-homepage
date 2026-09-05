<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

const props = defineProps<{
  theme: 'ambient' | 'primary' | 'caution' | 'tertiary',
  textarea?: boolean,
  rows?: number,
  type?: string,
  placeholder?: string,
  readonly?: boolean,
  disabled?: boolean,
  smaller?: boolean,
}>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{
  submit: []
}>()

const classList = computed(() => [
  'FancyInput',
  'global-themed',
  'theme-' + props.theme,
  ...(props.smaller ? ['smaller'] : []),
  ...(props.disabled ? ['disabled'] : []),
])

const domElement = useTemplateRef('domElement')
defineExpose({ domElement })
</script>

<template>
  <template v-if="!props.textarea">
    <input
      ref="domElement"
      v-model="model"
      :class="classList"
      :readonly="props.readonly"
      :disabled="props.disabled"
      :aria-disabled="props.disabled"
      :type="props.type"
      :placeholder="props.placeholder"
      @keydown.enter.prevent="emit('submit')"
    />
  </template>
  <template v-else>
    <textarea
      ref="domElement"
      v-model="model"
      :rows="props.rows"
      :class="classList"
      :readonly="props.readonly"
      :disabled="props.disabled"
      :aria-disabled="props.disabled"
      :placeholder="props.placeholder"
      @keydown.enter.ctrl.prevent="emit('submit')"
    />
  </template>
</template>

<style scoped>
.FancyInput {
  padding: 8px 10px;
  display: inline-block;
  box-sizing: border-box;
  font: inherit;
  line-height: 1.4;
}
.FancyInput.smaller {
  padding: 6px 8px;
}
.FancyInput.disabled {
  opacity: .5;
  cursor: not-allowed;
}
</style>
