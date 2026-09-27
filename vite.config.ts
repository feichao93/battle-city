import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createLanRelay } from './bin/lan-relay.js'
import pkg from './package.json'

/** 把 `battle-city host` 的联机中继挂到 dev server 上；HMR 的升级请求路径不同，互不干扰 */
function lanRelay(): Plugin {
  return {
    name: 'battle-city-lan-relay',
    configureServer(server) {
      const relay = createLanRelay({ base: server.config.base })
      // 直接挂在 configureServer 里，排在 vite 的 base 重定向之前
      server.middlewares.use((req, res, next) => {
        if (!relay.handleRequest(req, res)) next()
      })
      server.httpServer?.on('upgrade', (req, socket, head) => {
        relay.handleUpgrade(req, socket, head)
      })
      server.httpServer?.on('close', () => relay.close())
    },
  }
}

// GitHub Pages 部署在 /battle-city/ 子路径下
export default defineConfig({
  base: '/battle-city/',
  plugins: [react(), lanRelay()],
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
