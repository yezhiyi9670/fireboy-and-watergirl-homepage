<script setup lang="ts">
import FancyButton from './FancyButton.vue';
import { FocusTrap } from 'focus-trap-vue';

const props = defineProps<{
  open?: boolean,
  title?: string,
  dismissable?: boolean,
  hasCancel?: boolean,
  hasNeutral?: boolean,
  hasConfirm?: boolean,
  theme?: 'primary' | 'caution' | 'tertiary'
}>()
const emit = defineEmits<{
  close: [ closeType: false | null | true ]
}>()

function emitClose(closeType: false | null | true) {
  emit('close', closeType)
}

function tryDismiss() {
  if(!props.dismissable) {
    return false
  }
  emitClose(false)
}

</script>

<template>
  <portal to="dialog-outlet" v-if="props.open">
    <div class="dialog-cover" @click="tryDismiss">
      <FocusTrap :active="props.open" :initial-focus="() => $refs.dialogInner">
        <div class="dialog-focus-trap">
          <div class="dialog" tabindex="-1" @click.stop @keydown.esc="tryDismiss" ref="dialogInner">
            <div class="dialog-title" v-if="props.title != null">
              {{ props.title }}
            </div>
            <div class="dialog-body">
              <slot />
            </div>
            <div class="dialog-footer" v-if="props.hasCancel || props.hasNeutral || props.hasConfirm">
              <FancyButton :theme="props.theme ?? 'primary'" v-if="props.hasConfirm" @click="emitClose(true)">确定</FancyButton>
              <FancyButton :theme="props.theme ?? 'primary'" v-if="props.hasNeutral" @click="emitClose(null)">完成</FancyButton>
              <FancyButton theme="ambient" v-if="props.hasCancel" @click="emitClose(false)">取消</FancyButton>
            </div>
          </div>
        </div>
      </FocusTrap>
    </div>
  </portal>
</template>

<style scoped>
.dialog-cover {
  position: fixed;
  z-index: 999;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: var(--color-cover);
}
.dialog-focus-trap {
  display: flex;
  height: 100%;
}
.dialog {
  margin: auto;
  width: 500px;
  max-width: 100%;
  max-height: 100%;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
}
.dialog-title {
  padding: 16px 16px;
  font-size: 1.2em;
  font-weight: bold;
  border-bottom: 1px solid var(--color-separator);
}
.dialog-body {
  flex-shrink: 1;
  overflow-y: auto;
  padding: 16px;
}
.dialog-footer {
  border-top: 1px solid var(--color-separator);
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 12px 16px;
}

@media (max-width: 599px) {
  .dialog-footer {
    gap: 10px;
  }
}

</style>
