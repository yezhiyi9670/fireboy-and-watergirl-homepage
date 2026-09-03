<script setup lang="ts">
import FancyButton from '../../common/components/FancyButton.vue';

const history = window.history
</script>

<template>
  <div class="toplevel">
    <div class="tabs">
      <FancyButton
        theme="none"
        @click="evt => (history.go(-1), evt.preventDefault())"
        href="#/home"
      >
        <v-icon style="transform:scale(1.15)" name="la-map" />
      </FancyButton>
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
