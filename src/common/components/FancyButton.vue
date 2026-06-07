<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

const props = defineProps<{
  theme: 'ambient' | 'primary' | 'caution' | 'tertiary',
  href?: string,
  target?: string,
  smaller?: boolean,
  disabled?: boolean,
}>()
const emit = defineEmits<{
  click: []
}>()

const classList = computed(() => [
  'FancyButton',
  'global-themed',
  'theme-' + props.theme,
  ...(props.smaller ? ['smaller'] : []),
  ...(props.disabled ? ['disabled'] : []),
])

function handleClick() {
  if(props.disabled) {
    return
  }
  emit('click')
}

const domElement = useTemplateRef('domElement')
defineExpose({ domElement })
</script>

<template>
  <template v-if="props.href == null">
    <button
      ref="domElement"
      @click="handleClick"
      :class="classList"
      :disabled="props.disabled"
      :aria-disabled="props.disabled"
    ><slot /></button>
  </template>
  <template v-else>
    <a
      ref="domElement"
      @click="handleClick"
      :href="props.href"
      :target="props.target"
      :class="classList"
      :aria-disabled="props.disabled"
    ><slot /></a>
  </template>
</template>

<style scoped>
.FancyButton {
  padding: 8px 10px;
  cursor: pointer;
  display: inline-block;
  text-decoration: none;
  line-height: 1.4;
  box-sizing: border-box;
}
.FancyButton.smaller {
  padding: 6px 8px;
}
.FancyButton.disabled {
  opacity: .5;
  cursor: not-allowed;
}
</style>
