<script setup lang="ts">
import Centering from '../common/components/Centering.vue';
import FancyButton from '../common/components/FancyButton.vue';

</script>

<template>
  <Centering>
    <p>找不到对应路径 <code>{{ $route.path }}</code> 的子页面。</p>
    <FancyButton theme="ambient" @click="$router.push('/')">
      <v-icon name="la-angle-left-solid" /> 返回主页
    </FancyButton>
  </Centering>
</template>
