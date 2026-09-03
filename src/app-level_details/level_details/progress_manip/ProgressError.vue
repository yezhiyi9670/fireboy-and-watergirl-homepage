<script setup lang="ts">
import { ref } from 'vue';
import Dialog from '../../../common/components/Dialog.vue';
import FancyButton from '../../../common/components/FancyButton.vue';
import ExtraInfo from '../../../common/components/ExtraInfo.vue';

const props = defineProps<{
  error?: Error
}>()

const dialogOpen = ref(false)
</script>

<template>
  <div class="outer">
    <div class="text">游戏进程数据读取失败。</div>
    <div class="action">
      <FancyButton theme="ambient" smaller @click="dialogOpen=true">详情</FancyButton>
    </div>
  </div>
  <Dialog
    :open="dialogOpen"
    title="错误详情"
    dismissable
    hasConfirm
    @close="dialogOpen=false"
  >
    <div style="display: flex; flex-direction: column; gap: 0.5em">
      <div>游戏进程数据无法读取，可能已经损坏。</div>
      <div>请检查游戏内是否也存在异常。如果无异常，这应该只是关卡明细查看器的漏洞。如果有异常，你很可能需要回主页清除游戏数据以使游戏恢复正常。</div>
      <ExtraInfo v-if="error">
        <div>{{ error.message }}</div>
      </ExtraInfo>
    </div>
  </Dialog>
</template>

<style lang="css" scoped>
.outer {
  display: flex;
  align-items: center;
}
.text {
  width: 0;
  flex: 1;
}
</style>
