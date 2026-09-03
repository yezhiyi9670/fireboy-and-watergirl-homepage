<script setup lang="ts">
import { inject } from 'vue';
import ArticleContainer from '../common/components/ArticleContainer.vue';
import Branding from '../branding/Branding.ts';
import FancyButton from '../common/components/FancyButton.vue';
import { useTitle } from '@vueuse/core';
import ApiHomeData from '../common/data_model/home/ApiHomeData.ts';

const homeData = inject(ApiHomeData.injectionKey)
useTitle('修改说明 – ' + Branding.systemTitle)
</script>

<template>
  <ArticleContainer>
    <h1>修改说明 – {{ Branding.systemTitle }}</h1>
    <FancyButton theme="ambient" href="#/">&lt; 返回主页</FancyButton>

    <div v-html="homeData && homeData.texts.modification_notes"></div>
  </ArticleContainer>
</template>
