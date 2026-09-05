<script setup lang="ts">
import { computed, inject } from 'vue';
import type LevelItemData from '../../common/data_model/temples/LevelItemData';
import { Api } from '../../common/api/Api';
import TempleItemData from '../../common/data_model/temples/TempleItemData';
import GameItemData from '../../common/data_model/home/GameItemData';

const props = defineProps<{
  level: LevelItemData
}>()
const templeKey = inject(TempleItemData.kInjectionKey)
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
</script>

<template>
  <img class="level-preview" :srcset="levelPreviewUrl" />
</template>

<style lang="css" scoped>
.level-preview {
  display: block;
  aspect-ratio: 39 / 29;
  object-fit: contain;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
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
