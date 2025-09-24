// intro-start-vue/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/introwcfinder/', // repo name (keeps CSS/JS paths correct on Pages)
  plugins: [vue()],
})