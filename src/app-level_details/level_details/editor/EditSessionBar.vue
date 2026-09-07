<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { instanceToPlain } from 'class-transformer';
import FancyButton from '../../../common/components/FancyButton.vue';
import Dialog from '../../../common/components/Dialog.vue';
import DialogProse from '../../../common/components/DialogProse.vue';
import ExtraInfo from '../../../common/components/ExtraInfo.vue';
import ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts';
import EditSessionState from '../../../common/data_model/temples/EditSessionState.ts';
import { Api } from '../../../common/api/Api.ts';
import { computeSubmitPlan, type SubmitPlan } from './submitPlan.ts';

const session = inject(EditSessionState.injectionKey)
const templesData = inject(ApiTemplesData.injectionKey)

const active = computed(() => session?.isActive() ?? false)
const serverAllowed = computed(() => templesData?.value?.editing_allowed ?? false)
const anyDirty = computed(() => {
  const data = templesData?.value
  if(data == null) {
    return false
  }
  return Object.values(data.temples).some(temple => temple.isDirty())
})

function startEdit() {
  const data = templesData?.value
  if(data == null || active.value) {
    return
  }
  session?.start(data)
}

// --- discard -----------------------------------------------------------------

const abandonOpen = ref(false)
function discardOrConfirm() {
  if(!anyDirty.value) {
    session?.cancel()
    return
  }
  abandonOpen.value = true
}
function onAbandonClose(closeType: false | null | true) {
  if(closeType === true) {
    session?.cancel()
    abandonOpen.value = false
    return
  }
  abandonOpen.value = false
}

// --- submit ------------------------------------------------------------------

const submitOpen = ref(false)
const pending = ref(false)
const submitError = ref<string | null>(null)
const submitPlan = ref<SubmitPlan | null>(null)

const dirtyTempleNames = computed(() => {
  const plan = submitPlan.value
  if(plan == null) {
    return []
  }
  return plan.dirtyTemples.map(({ templeKey, temple }) => templeKey + '（' + temple.label + '）')
})

function openSubmit() {
  if(!anyDirty.value) {
    return
  }
  const after = templesData?.value
  const baseline = session?.baselineData()
  if(after == null || baseline == null) {
    return
  }
  submitPlan.value = computeSubmitPlan(after, baseline as unknown as ApiTemplesData)
  submitError.value = null
  submitOpen.value = true
}

function onSubmitClose(closeType: false | null | true) {
  if(pending.value) {
    return
  }
  if(closeType === true) {
    void runSubmit()
    return
  }
  submitOpen.value = false
}

async function runSubmit() {
  if(pending.value) {
    return
  }
  pending.value = true
  submitError.value = null
  const after = templesData?.value
  const plan = submitPlan.value
  try {
    if(after == null || plan == null) {
      submitError.value = '数据未就绪'
      return
    }
    const temples: Record<string, unknown> = {}
    for(const { templeKey, temple } of plan.dirtyTemples) {
      temples[templeKey] = instanceToPlain(temple)
    }
    const payload = {
      temples,
      files: {
        delete: plan.deleteFiles,
        new: plan.newFiles,
        sources: plan.sources,
      },
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 15000)
    let result: any = null
    try {
      const response = await fetch(Api.getUrl('apply_changes'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      result = await response.json()
    } finally {
      window.clearTimeout(timer)
    }
    if(result?.success) {
      submitOpen.value = false
      session?.commitDone()
      return
    }
    submitError.value = (result?.data?.message ?? '提交失败')
  } catch(err) {
    submitError.value = (err instanceof DOMException && err.name === 'AbortError')
      ? '提交超时'
      : '网络错误'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div v-if="!active && serverAllowed" class="session-group">
    <FancyButton
      class="session-btn"
      theme="caution"
      aria-label="编辑"
      title="编辑"
      @click="startEdit"
    >
      <v-icon name="la-pencil-alt-solid" />
    </FancyButton>
  </div>
  <div v-else-if="active" class="session-group">
    <FancyButton
      class="session-btn"
      theme="ambient"
      aria-label="放弃"
      title="放弃"
      @click="discardOrConfirm"
    >
      <v-icon name="la-times-solid" />
    </FancyButton>
    <FancyButton
      class="session-btn"
      theme="caution"
      :class="{ 'is-disabled': !anyDirty }"
      aria-label="提交"
      title="提交"
      @click="openSubmit"
    >
      <v-icon name="la-paper-plane" />
    </FancyButton>
  </div>

  <Dialog
    :open="abandonOpen"
    title="放弃编辑"
    :has-confirm="'确认放弃'"
    :has-cancel="'取消'"
    dismissable
    @close="onAbandonClose"
  >
    <DialogProse>
      <p>确认放弃本次编辑？所有未保存的修改将被撤销。</p>
    </DialogProse>
  </Dialog>

  <Dialog
    :open="submitOpen"
    title="提交修改"
    :has-confirm="pending ? undefined : '提交'"
    :has-cancel="pending ? undefined : '取消'"
    dismissable
    @close="onSubmitClose"
  >
    <DialogProse>
      <template v-if="submitPlan != null">
        <p v-if="dirtyTempleNames.length">将提交以下圣殿的修改：</p>
        <ul>
          <li v-for="name in dirtyTempleNames" :key="name">{{ name }}</li>
        </ul>
        <template v-if="submitPlan.deleteFiles.length">
          <p>以下关卡文件将被删除：</p>
          <ul>
            <li v-for="file in submitPlan.deleteFiles" :key="file">{{ file }}</li>
          </ul>
        </template>
        <template v-if="submitPlan.newFiles.length">
          <p>以下关卡文件将被新建：</p>
          <ul>
            <li v-for="file in submitPlan.newFiles" :key="file">{{ file }}</li>
          </ul>
        </template>
      </template>
      <p v-if="pending">正在提交，请稍候……</p>
      <ExtraInfo v-if="submitError != null" error>
        <p>{{ submitError }}</p>
      </ExtraInfo>
    </DialogProse>
  </Dialog>
</template>

<style lang="css" scoped>
.session-group {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}
.session-btn {
  flex-shrink: 0;
}
.session-btn.is-disabled {
  opacity: .4;
  cursor: not-allowed;
}
</style>
