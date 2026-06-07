<script setup lang="ts">
</script>

<template>
  <div class="article-container">
    <article>
      <slot />
    </article>
  </div>
  <div v-html="'<style>#app {height: unset}</style>'" />
</template>

<style scoped lang="less">
  .article-container {
    padding: 0 16px;
    margin: 0;
    line-height: normal;
  }
  article {
    margin: 16px auto;
    width: 100%;
    max-width: 960px;
    box-sizing: border-box;
    border: 1px solid var(--color-separator);
    padding: 16px 24px;

    :deep(p) {
      line-height: 1.5em;
      margin: 0.8em 0;
    }
    :deep(li) {
      line-height: 1.5em;
    }
    :deep(h1:first-child) {
      margin-top: 8px;
    }
    :deep(h1), :deep(h2) {
      border-bottom: 1px solid var(--color-separator);
    }
    /* 标题字体与尺寸 */
    :deep(h1) {
      font-size: 2.3em;
      padding-bottom: 0.1em;
    }
    :deep(h2) {
      font-size: 1.8em;
      padding-bottom: 0.1em;
    }
    :deep(h3) {
      font-size: 1.4em;
    }
    :deep(h4) {
      font-size: 1.2em;
    }
    :deep(h5) {
      font-size: 1em;
    }
    /* 标题间距 */
    :deep(h2) {
      margin-top: calc(2.0em / 1.8);
      margin-bottom: calc(0.8em / 1.8)
    }
    // :deep(h2+h3), :deep(h2+.sync-line+h3) {
    //   /* margin-top: calc(0.8em / 1.4); */
    // }
    :deep(h3) {
      margin-top: calc(1.6em / 1.4);
      margin-bottom: calc(0.8em / 1.4);
    }
    :deep(h3+h4), :deep(h3+.sync-line+h4) {
      margin-top: calc(0.8em / 1.2);
    }
    :deep(h4) {
      margin-top: calc(1.2em / 1.2);
      margin-bottom: calc(0.8em / 1.2);
    }
    :deep(h4+h5), :deep(h4+.sync-line+h5) {
      margin-top: calc(0.8em / 1);
    }
    :deep(h5) {
      margin-top: calc(1.0em / 1);
      margin-bottom: calc(0.8em / 1);
    }
    :deep(li) {
      margin-left: 2em;
      /*padding-left: 2em;*/
    }
    :deep(ul), :deep(ol) {
      margin-left: 0;
      padding-left: 0;
    }
  }
  @media(max-width:799px) {
    .article-container {
      padding: 0;
    }
    article {
      border: none;
      margin: 0;
    }
  }
</style>
