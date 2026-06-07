<script setup lang="ts">
import Centering from './Centering.vue';
import FancyButton from './FancyButton.vue';


const props = defineProps<{
  error?: Error
}>()

const emit = defineEmits<{
  reload: []
}>()

</script>

<template>
  <Centering>
    <p>数据加载失败。</p>
    <p v-if="props.error">错误信息：{{ props.error.message }}</p>
    <FancyButton theme="ambient" @click="emit('reload')">
      <v-icon name="la-undo-alt-solid" /> 重试
    </FancyButton>
  </Centering>
</template>
