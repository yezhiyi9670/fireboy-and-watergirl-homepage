<script setup lang="ts">
const props = defineProps<{
  caution?: boolean
}>()
</script>

<template>
  <div :class="'extra-info ' + (props.caution ? 'caution' : '')">
    <div class="info-icon">
      <v-icon
        :name="props.caution ? 'la-exclamation-triangle-solid' : 'la-info-circle-solid'"
        :scale="1.2"
      />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.extra-info {
  font-size: 0.95em;
  line-height: 1.25;
  padding-top: 8px;
  color: var(--color-t1);
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
.extra-info.caution {
  color: var(--color-caution-text);
}
</style>
