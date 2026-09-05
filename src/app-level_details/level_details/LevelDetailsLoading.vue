<script setup lang="ts">
import FancyButton from '../../common/components/FancyButton.vue';
import HomeBackButton from '../components/HomeBackButton.vue';
</script>

<template>
  <div class="toplevel">
    <div class="tabs">
      <HomeBackButton />
      <FancyButton theme="none" not-button>加载中……</FancyButton>
    </div>
    <div class="container"></div>
  </div>
</template>

<style lang="css" scoped>
.toplevel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tabs {
  border-bottom: 4px solid var(--color-ambient);
  display: flex;
  overflow-x: auto;
}
.container {
  height: 0;
  flex: 1;
}
</style>
