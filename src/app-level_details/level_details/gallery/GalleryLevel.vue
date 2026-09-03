<script setup lang="ts">
import { computed, inject, toRef } from 'vue';
import { Api } from '../../../common/api/Api';
import LevelTypeIcon from '../../components/LevelTypeIcon.vue';
import { TempleItemData } from '../../../common/data_model/temples/TempleItemData.ts';
import { LevelItemData } from '../../../common/data_model/temples/LevelItemData.ts';
import { GameItemData } from '../../../common/data_model/home/GameItemData.ts';
import { ApiTemplesData } from '../../../common/data_model/temples/ApiTemplesData.ts';

const props = defineProps<{
  level: LevelItemData
}>()

const templeKey = inject(TempleItemData.kInjectionKey)
const temple = inject(TempleItemData.injectionKey)

const gameKey = inject(GameItemData.kInjectionKey)

const levelPreviewUrl = computed(() => {
  return Api.getUrl('level_preview', {
    game: gameKey?.value,
    temple: templeKey?.value,
    level_filter: {
      ...(('id' in props.level) ? { id: props.level.id } : { }),
      ...(('_id' in props.level) ? { _id: props.level._id } : { }),
      ...(('filename' in props.level) ? { filename: props.level.filename } : { }),
    }
  })
})

const shownTitle = computed(() => {
  return props.level.getShownTitle()
})
const disambiguousNumbering = ApiTemplesData.useDisambiguousNumbering(toRef(props, 'level'))

</script>

<template>
  <section class="gallery-level">
    <img class="level-preview" :srcset="levelPreviewUrl" />
    <h3 class="level-title">
      <div class="level-label">{{ shownTitle }}</div>
      <div class="level-type"><LevelTypeIcon :type="level.type" height="1em" width="1em" /></div>
    </h3>
    <p class="level-info">
      <v-icon title="关卡号" name="md-numbers-twotone" />
      {{ disambiguousNumbering }}
      <span class="spacer" />
      <v-icon
        title="放映时间（多人/单人）"
        :name="level.type != 'puzzle' ? 'md-hourglasstop-twotone' : 'md-hourglassdisabled-twotone'"
      />
      {{ LevelItemData.formatWalkthroughDuration(level.time) }}
      /
      {{ LevelItemData.formatWalkthroughDuration(level.mobileTime) }}
    </p>
    <p class="level-info">
      <template v-if="temple?.type == 'rows'">
        <v-icon title="解锁方式" name="bi-patch-question" />
        未知进度控制方式
      </template>
      <template v-else-if="temple?.type == 'tree'">
        <template v-if="level.initial">
          <v-icon title="解锁方式" name="md-lockopen-twotone" />
          {{ level.skippable ? '新手教程' : '初始关卡' }}
        </template>
        <template v-else-if="level.requirePerfects">
          <v-icon title="解锁方式" name="md-lock-twotone" />
          需要周围所有关卡等级 A
        </template>
        <template v-else>
          <v-icon title="解锁方式" name="md-lock-twotone" />
          通关一个相邻关卡以解锁
        </template>
      </template>
      <template v-else>
        <v-icon title="解锁方式" name="bi-patch-question" />
        未知进度控制方式
      </template>
    </p>
  </section>
</template>

<style lang="css" scoped>
.gallery-level {
  background: var(--color-surface);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.level-preview {
  display: block;
  aspect-ratio: 1.3448275862068966; /* 39/29 */
  object-fit: contain;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}
.level-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.level-info {
  margin: 0;
}
.spacer {
  display: inline-block;
  width: 1em;
}
@media (max-width: 499px) {
  .gallery-level {
    margin: 0 -24px;
    padding: 16px 24px;
  }
}
@media (prefers-color-scheme: light) {
  .level-preview {
    filter: sepia() invert() hue-rotate(180deg) brightness(0.9) contrast(1.3);
  }
}
@media (prefers-color-scheme: dark) {
  .level-preview {
    filter: sepia() contrast(0.88) brightness(1.05);
  }
}
</style>
