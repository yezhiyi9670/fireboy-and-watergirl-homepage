<script setup lang="ts">
import { inject } from 'vue';
import ArticleContainer from '../common/components/ArticleContainer.vue';
import { DataModel } from '../common/api/DataModel.ts';
import Branding from '../branding/Branding.ts';
import FancyButton from '../common/components/FancyButton.vue';

const homeData = inject(DataModel.apiHomeKey)
</script>

<template>
  <ArticleContainer>
    <h1>修改说明 — {{ Branding.systemTitle }}</h1>
    <FancyButton theme="ambient" href="#/">&lt; 返回主页</FancyButton>

    <div v-html="homeData && homeData.texts.modification_notes"></div>
  </ArticleContainer>
</template>
