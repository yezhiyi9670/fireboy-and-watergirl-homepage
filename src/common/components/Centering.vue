<template>
  <div class="outer">
    <div class="inner">
      <slot />
    </div>
  </div>  
</template>

<style scoped>
.outer {
  display: flex;
  height: 100%;
}
.inner {
  margin: auto;
  padding: 16px;
}
</style>
