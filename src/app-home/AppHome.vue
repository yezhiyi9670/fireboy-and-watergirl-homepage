<script setup lang="ts">
import { inject } from 'vue';
import Branding from '../branding/Branding.js';
import ArticleContainer from '../common/components/ArticleContainer.vue';
import GameEntry from './games/GameEntry.vue';
import ProgressManager from './progress/ProgressManager.vue';
import { useTitle } from '@vueuse/core';
import ApiHomeData from '../common/data_model/home/ApiHomeData.ts';

const homeData = inject(ApiHomeData.injectionKey)

useTitle(Branding.systemTitle)
</script>

<template>
  <ArticleContainer v-if="homeData">
    <h1>{{ Branding.systemTitle }}</h1>

    <div v-html="homeData.texts.homepage_pre"></div>

    <h2>游戏列表</h2>
    <GameEntry v-for="game, gameKey in homeData.games" :key="gameKey" :gameKey="gameKey" :game="game" />

    <div v-html="homeData.texts.gamelist_post"></div>

    <h2>游戏数据管理</h2>
    <p>你的游戏进程数据离线存储于浏览器上，你可使用下方工具转移它们。</p>
    <ProgressManager :games="homeData.games" />
    <div v-html="homeData.texts.progress_post"></div>

    <div v-html="homeData.texts.homepage_post"></div>
  </ArticleContainer>
</template>
