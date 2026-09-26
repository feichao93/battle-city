import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// GitHub Pages 部署在 /battle-city/ 子路径下
export default defineConfig({
  base: '/battle-city/',
  plugins: [react()],
  // 帮助面板里显示的版本号与编译时间（旧版 COMPILE_VERSION / COMPILE_DATE）
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString('zh-CN', { hour12: false })),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
})
