<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import { ref, watchEffect } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';

const props = defineProps<{
  storageNamespace: string,
  cheatFlagKey: string
}>()
const emit = defineEmits<{
  change: [newState: boolean]
}>()

const myState = ref(false)
function readState() {
  myState.value = !!localStorage.getItem(props.storageNamespace + ':' + props.cheatFlagKey)
}
watchEffect(() => readState())
useIntervalFn(readState, 1500)

function updateState(state: boolean) {
  localStorage.setItem(props.storageNamespace + ':' + props.cheatFlagKey, state ? 'yes' : '')
  readState()
  emit('change', myState.value)
}

</script>

<template>
  <FancyButton smaller :theme="myState ? 'caution' : 'ambient'" @click="updateState(!myState)">
    <v-icon name="la-check-solid" v-if="myState" />
    <v-icon name="la-minus-solid" v-else />
  </FancyButton>
</template>
