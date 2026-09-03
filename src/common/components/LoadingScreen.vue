<script setup lang="ts">
import Centering from './Centering.vue';

const props = defineProps<{
  error?: Error
}>()

const emit = defineEmits<{
  reload: []
}>()

</script>

<template>
  <Centering>
    <p>加载中……</p>
  </Centering>
</template>
