<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type?: string
}>()

const normalizedType = computed(() => {
  return props.type ?? 'general'
})
</script>

<template>
  <v-icon v-if="normalizedType == 'general'" title="常规" name="bi-hexagon" />
  <v-icon v-else-if="normalizedType == 'puzzle'" title="解密" name="co-diamond" />
  <v-icon v-else-if="normalizedType == 'speed'" title="竞速" name="co-av-timer" />
  <v-icon v-else-if="normalizedType == 'dark'" title="黑暗" name="bi-lightbulb-off" />
  <v-icon v-else title="未知关卡类型" name="bi-patch-question" />
</template>
