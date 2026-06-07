import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '',
  server: {
    port: 5181,
    proxy: {
      '/api': 'http://localhost:82/goodlive/fireboy-and-watergirl/homepage',
      '/A': 'http://localhost:82/goodlive/fireboy-and-watergirl',
      '/B': 'http://localhost:82/goodlive/fireboy-and-watergirl',
      '/C': 'http://localhost:82/goodlive/fireboy-and-watergirl',
      '/D': 'http://localhost:82/goodlive/fireboy-and-watergirl',
      '/E': 'http://localhost:82/goodlive/fireboy-and-watergirl',
      '/F': 'http://localhost:82/goodlive/fireboy-and-watergirl',
      '/G': 'http://localhost:82/goodlive/fireboy-and-watergirl'
    },
  },
  optimizeDeps: {
    exclude: ['vue-demi']
  }
})
