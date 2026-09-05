<script setup lang="ts">
import FancyButton from '../../common/components/FancyButton.vue';
import ApiTemplesData from '../../common/data_model/temples/ApiTemplesData';
import type TempleItemData from '../../common/data_model/temples/TempleItemData';

const props = defineProps<{
  temple: TempleItemData
}>()
const expanded = defineModel<boolean>()

const isEditingAllowed = ApiTemplesData.useIsEditingAllowed()
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
    <div class="actions">
      <FancyButton
        v-if="isEditingAllowed"
        theme="tertiary"
        @click.stop="console.log('TODO new level')"
      >
        新关卡
      </FancyButton>
      <FancyButton
        v-if="isEditingAllowed"
        theme="tertiary"
        @click.stop="console.log('TODO new edge')"
      >
        新连接线
      </FancyButton>
    </div>
  </h2>
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
