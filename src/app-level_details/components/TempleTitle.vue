<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import FancyButton from '../../common/components/FancyButton.vue';
import ApiTemplesData from '../../common/data_model/temples/ApiTemplesData';
import type TempleItemData from '../../common/data_model/temples/TempleItemData';
import TempleItemDataClass from '../../common/data_model/temples/TempleItemData';
import IdFieldsDialog from '../level_details/properties/dialogs/IdFieldsDialog.vue';
import { useLocateView } from '../level_details/properties/locate.ts';
import EdgeCreateState from '../level_details/state/EdgeCreateState.ts';

const props = defineProps<{
  temple: TempleItemData
}>()
const expanded = defineModel<boolean>()

const isEditingAllowed = ApiTemplesData.useIsEditingAllowed()
const templeKey = inject(TempleItemDataClass.kInjectionKey)
const edgeCreate = inject(EdgeCreateState.injectionKey)
const { revealCreatedLevel } = useLocateView()

const linkingHere = computed(() => {
  const key = templeKey?.value
  if(key == null) {
    return false
  }
  return edgeCreate?.isSourceTemple(key) ?? false
})

const newOpen = ref(false)
const newIdInit = ref<string | number>(0)
const newIidInit = ref<string | number>(0)
const pendingNewIid = ref<string | number | null>(null)

function cancelLinking() {
  edgeCreate?.cancel()
}

function openNewLevel() {
  newIdInit.value = props.temple.nextFreeLevelId()
  newIidInit.value = props.temple.nextFreeLevelIid()
  pendingNewIid.value = null
  newOpen.value = true
}
function submitNewLevel(id: string | number, iid: string | number): string | null {
  try {
    props.temple.createLevel_(id, iid)
    pendingNewIid.value = iid
    return null
  } catch(e) {
    return (e as Error).message
  }
}
function onNewLevelDone() {
  const key = templeKey?.value
  const iid = pendingNewIid.value
  pendingNewIid.value = null
  if(key != null && iid != null) {
    revealCreatedLevel(key, iid)
  }
}

defineExpose({ openNewLevel })
</script>

<template>
  <h2
    class="temple-title"
    tabindex="0"
    @click="expanded = !expanded"
    :style="{
      marginBottom: expanded ? '.5em' : '0'
    }"
  >
    <div class="title-part">
      <v-icon :name="expanded ? 'fa-chevron-down' : 'fa-chevron-right'" width=".75em" height=".75em" />
      <span class="temple-label">{{ temple.label }}</span>
      <span class="temple-badge" :style="{backgroundColor: temple.color}"></span>
    </div>
    <div v-if="isEditingAllowed && linkingHere" class="actions">
      <FancyButton
        theme="caution"
        @click.stop="cancelLinking"
        smaller
      >
        点选另一关卡进行连接
      </FancyButton>
    </div>
    <div v-else-if="isEditingAllowed" class="actions">
      <FancyButton
        theme="tertiary"
        @click.stop="openNewLevel"
        smaller
      >
        新关卡
      </FancyButton>
    </div>
  </h2>

  <IdFieldsDialog
    :open="newOpen"
    title="新关卡"
    :id-initial="newIdInit"
    :iid-initial="newIidInit"
    :on-submit="submitNewLevel"
    @done="onNewLevelDone"
    @close="newOpen = false"
  />
</template>

<style lang="css" scoped>
.temple-title {
  margin: 0;
  display: flex;
  gap: 0.5em;
  cursor: pointer;
  align-items: center;
  user-select: none;
  flex-wrap: wrap;
  min-height: 1.4em;
}
.title-part {
  display: flex;
  gap: 0.5em;
  align-items: center;
}
.temple-badge {
  display: inline-block;
  height: 1em;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 0.1em var(--color-ambient);
}
.actions {
  padding-left: 1em;
  font-size: 0.65em;
  font-weight: normal;
  display: flex;
  gap: 12px;
}
</style>
