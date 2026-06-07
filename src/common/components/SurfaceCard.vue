<template>
  <div class="SurfaceCard">
    <slot />
  </div>
</template>

<style scoped>
.SurfaceCard {
  background: var(--color-surface);
  margin: 16px 0;
  padding: 16px;
}
@media(max-width: 599px) {
  .SurfaceCard {
    margin: 16px -24px;
    padding: 16px 24px;
  }
}
</style>
