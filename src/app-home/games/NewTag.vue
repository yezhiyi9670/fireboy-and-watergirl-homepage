<template>
  <span class="new-tag"><slot /></span>
</template>

<style scoped>
.new-tag {
  display: inline-block;
  background: var(--color-emphasize);
  color: var(--color-r0);
  font-size: calc(min(1em, max(12px, .6em)));
  line-height: 1;
  vertical-align: text-bottom;
  padding: 0.3em 0.3em;
  border-radius: .2em;
  font-weight: normal;
  margin-left: .6em;
}
</style>
