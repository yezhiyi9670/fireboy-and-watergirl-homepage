<script setup lang="ts">
import { useRouter } from 'vue-router';
import FancyButton from '../../common/components/FancyButton.vue';
import { previousRoutePath } from '../../plugins/router';

const router = useRouter()

function goBackHome(evt: MouseEvent) {
  evt.preventDefault()
  if(previousRoutePath.value === '/home') {
    router.back()
  } else {
    router.push('/home')
  }
}
</script>

<template>
  <FancyButton
    theme="none"
    href="#/home"
    @click="goBackHome"
  >
    <v-icon style="transform:scale(1.15)" name="la-map" />
  </FancyButton>
</template>
