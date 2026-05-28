import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '',
  server: {
    port: 5181,
    proxy: {
      '/api': 'http://localhost:82/goodlive/fireboy-and-watergirl/level_details',
      '/../api': 'http://localhost:82/goodlive/fireboy-and-watergirl/level_details',
    },
  }
})
