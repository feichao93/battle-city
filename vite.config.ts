import { loadEnv } from 'vite'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createDecisionProxy } from './bin/decision-proxy.js'
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

/** 决策模型转发；Key 从 .env 或环境变量读，只留在 Node 这边 */
function decisionProxy(): Plugin {
  return {
    name: 'battle-city-decision-proxy',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), 'DASHSCOPE_')
      const proxy = createDecisionProxy({
        apiKey: env.DASHSCOPE_API_KEY,
        workspaceId: env.DASHSCOPE_WORKSPACE_ID,
      })
      server.middlewares.use((req, res, next) => {
        if (!proxy.handleRequest(req, res)) next()
      })
    },
  }
}

// 开发服务器沿用旧版 GitHub Pages 的 /battle-city/ 子路径；打包都用 --base ./，放在哪个路径下都能打开
export default defineConfig({
  base: '/battle-city/',
  plugins: [react(), lanRelay(), decisionProxy()],
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
