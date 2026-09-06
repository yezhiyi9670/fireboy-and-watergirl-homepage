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
</style>
