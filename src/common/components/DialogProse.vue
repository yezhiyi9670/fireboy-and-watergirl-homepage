<template>
  <div class="dialog-prose">
    <slot />
  </div>
</template>

<style lang="css" scoped>
.dialog-prose {
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
.dialog-prose>:deep(p) {
  margin-top: 0;
  margin-bottom: 0;
}
.dialog-prose :deep(ul) {
  margin: 0 0;
  line-height: normal;
}
</style>
