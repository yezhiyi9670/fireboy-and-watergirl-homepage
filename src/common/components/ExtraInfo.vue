<script setup lang="ts">
const props = defineProps<{
  caution?: boolean
  error?: boolean
}>()
</script>

<template>
  <div class="extra-info" :class="{
    caution: props.caution,
    error: props.error,
  }">
    <div class="info-icon">
      <v-icon
        :name="
          props.error ? 'la-window-close' :
          props.caution ? 'la-exclamation-triangle-solid' :
          'la-info-circle-solid'
        "
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
.extra-info.error {
  color: var(--color-emphasize);
}
.extra-info>:deep(p) {
  margin: 0;
}
</style>
