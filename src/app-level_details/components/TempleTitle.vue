<script setup lang="ts">
import type TempleItemData from '../../common/data_model/temples/TempleItemData';

const props = defineProps<{
  temple: TempleItemData
}>()
const expanded = defineModel<boolean>()
</script>

<template>
  <h2
    class="temple-title"
    tabindex="0"
    @click="expanded = !expanded"
    :style="{
      marginBottom: expanded ? '.5em' : '0'
    }"
  >
    <v-icon :name="expanded ? 'fa-chevron-down' : 'fa-chevron-right'" width=".75em" height=".75em" />
    <span class="temple-label">{{ temple.label }}</span>
    <span class="temple-badge" :style="{backgroundColor: temple.color}"></span>
  </h2>
</template>

<style lang="css" scoped>
.temple-title {
  margin: 0;
  display: flex;
  gap: 0.5em;
  cursor: pointer;
  align-items: center;
  user-select: none;
}
.temple-badge {
  display: inline-block;
  height: 1em;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 0.1em var(--color-ambient);
}
</style>
