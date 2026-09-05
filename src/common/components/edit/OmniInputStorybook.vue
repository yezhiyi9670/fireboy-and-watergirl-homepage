<script setup lang="ts">
import { reactive } from 'vue';
import OmniInput from './OmniInput.vue';
import type { FieldSpecifier } from '../../data_model/field_specifier.ts';

interface FieldCase {
  note: string
  spec: FieldSpecifier
  theme?: 'ambient' | 'primary' | 'caution' | 'tertiary'
  readonly?: boolean
  disabled?: boolean
  smaller?: boolean
  value: unknown
}

const cases = reactive<FieldCase[]>([
  { note: '数字', spec: { label: '多人限时', type: 'number' }, value: 120 },
  { note: '字符串', spec: { label: '文件名', type: 'string' }, value: 'lvl_001.txt' },
  { note: '布尔', spec: { label: '初始关卡', type: 'boolean' }, value: true },
  { note: 'unknown/JSON', spec: { label: '自定义数据', type: 'unknown' }, value: { a: 1, b: 'x' } },
  { note: 'Union number|null', spec: { label: '单人限时', type: ['number', 'null'] }, value: 45.5 },
  { note: 'Union choice|null', spec: { label: '类型', type: [{
    'general': '常规', 'speed': '竞速', 'puzzle': '解密', 'dark': '黑暗',
  }, 'null'] }, value: 'speed' },
  { note: '只读', spec: { label: '只读字符串', type: 'string' }, readonly: true, value: 'fixed value' },
  { note: '禁用', spec: { label: '禁用字符串', type: 'string' }, disabled: true, value: 'cannot edit' },
  { note: '主题 primary', spec: { label: '主色数字', type: 'number' }, theme: 'primary', value: 7 },
  { note: '主题 caution + smaller', spec: { label: '小号警示', type: 'string' }, theme: 'caution', smaller: true, value: 'small' },
  { note: '类型不符 number↔string', spec: { label: '应为数字', type: 'number' }, value: 'not-a-number' },
  { note: '类型不符 string↔object', spec: { label: '应为字符串', type: 'string' }, value: { hello: 'world' } },
  { note: 'null 单值', spec: { label: '空值', type: 'null' }, value: null },
])
</script>

<template>
  <main class="omni-story">
    <h1>OmniInput Storybook</h1>
    <p class="omni-tip">单击可编辑的行进入编辑；Enter/✓ 提交，Esc/× 放弃；Union 类型旁可用 N/S/B/U/V 切换形态。</p>
    <section v-for="(c, i) in cases" :key="i" class="omni-case">
      <span class="omni-note">{{ c.note }}</span>
      <OmniInput
        v-model="c.value"
        :spec="c.spec"
        :theme="c.theme"
        :readonly="c.readonly"
        :disabled="c.disabled"
        :smaller="c.smaller"
      />
      <code class="omni-value">{{ JSON.stringify(c.value) }}</code>
    </section>
  </main>
</template>

<style lang="css" scoped>
.omni-story {
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.omni-tip {
  opacity: .7;
}
.omni-case {
  display: grid;
  grid-template-columns: 160px 1fr auto;
  gap: 12px;
  align-items: center;
}
.omni-note {
  opacity: .6;
  font-size: .85em;
}
.omni-value {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: .8em;
  opacity: .6;
}
</style>
