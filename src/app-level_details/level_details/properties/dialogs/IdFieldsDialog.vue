<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from '../../../../common/components/Dialog.vue';
import ExtraInfo from '../../../../common/components/ExtraInfo.vue';
import OmniInput from '../../../../common/components/edit/OmniInput.vue';
import type { FieldSpecifier } from '../../../../common/data_model/field_specifier.ts';
import DialogProse from '../../../../common/components/DialogProse.vue';

const props = defineProps<{
  open: boolean
  title: string
  idInitial: string | number
  iidInitial: string | number
  warn?: string
  /** Returns an error message, or null when accepted. */
  onSubmit: (id: string | number, iid: string | number) => string | null
}>()
const emit = defineEmits<{
  close: []
  done: []
}>()

const idSpec: FieldSpecifier = { label: 'id（用作一般编号）', type: ['number', 'string'] }
const iidSpec: FieldSpecifier = { label: '_id（用作唯一标识符）', type: ['number', 'string'] }

const idValue = ref<string | number | null>(props.idInitial)
const iidValue = ref<string | number | null>(props.iidInitial)
const error = ref<string | null>(null)

watch(() => props.open, (open) => {
  if(open) {
    idValue.value = props.idInitial
    iidValue.value = props.iidInitial
    error.value = null
  }
})

function onDialogClose(closeType: false | null | true) {
  if(closeType !== true) {
    emit('close')
    return
  }
  const id = idValue.value
  const iid = iidValue.value
  if(id == null || iid == null) {
    error.value = '请填写完整'
    return
  }
  const err = props.onSubmit(id, iid)
  if(err != null) {
    error.value = err
    return
  }
  emit('done')
  emit('close')
}
</script>

<template>
  <Dialog
    :open="props.open"
    :title="props.title"
    :has-confirm="'确定'"
    :has-cancel="'取消'"
    :initial-focus="false"
    dismissable
    @close="onDialogClose"
  >
    <DialogProse>
      <p>输入新的关卡 ID：</p>
      <div class="id-fields">
        <OmniInput
          v-model="idValue"
          :spec="idSpec"
          autofocus
        />
        <OmniInput
          v-model="iidValue"
          :spec="iidSpec"
        />
      </div>
      <ExtraInfo v-if="props.warn != null" caution>
        <p>{{ props.warn }}</p>
      </ExtraInfo>
      <ExtraInfo v-if="error != null" error>
        <p>{{ error }}</p>
      </ExtraInfo>
    </DialogProse>
  </Dialog>
</template>

<style lang="css" scoped>
.id-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}
</style>
