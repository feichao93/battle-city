# battle-city

<!-- 供 AI 编码助手使用的项目速查。保持精简：只写事实（命令、路径、约定、坑），不写描述性说明。 -->

坦克大战复刻 · TypeScript + React 19 + PixiJS v8 + zustand · vite · vitest · pnpm

## 命令

- `pnpm dev`：http://localhost:5173/battle-city/（hash 路由，如 `#/stage/3`、`#/editor/map`）
- `pnpm test`；单个文件 `./node_modules/.bin/vitest run test/xxx.test.ts`
- `./node_modules/.bin/tsc --noEmit`
- `pnpm arena`：托管 AI 对 bot 的无头对局统计，`ARENA_SEEDS` 控制每关种子数（默认 3），种子多时要跑几分钟
- `pnpm build` → `dist/`（base `/battle-city/`）；`pnpm build:npm` → `www/`（base `./`，npm 包用）
- 发 npm：`npm publish`（`publishConfig` 已指向 npmjs；仓库 `.npmrc` 是 npmmirror 镜像，`npm whoami` / `npm login` 要带 `--registry https://registry.npmjs.org`）

## 目录

- `src/engine`：纯逻辑，无 DOM；`ai/`（BotBrain、TeammateBrain 等）
- `src/render`：PixiJS 渲染；`src/ui`：React + SVG 像素界面；`src/input`、`src/audio`、`src/stages`
- `bin/battle-city.js`：npm 包的 CLI（零依赖静态服务器）
- `resources/`：收集的资料（原版素材图、`nes-values/` NES 原版数值与 AI 调研）
- `build/<version>/`：正式版本产物，gh-pages 经 jsDelivr 加载；该目录被 gitignore，需 `git add -f`
- `staging/`（gitignore）：`staging/NOTE.md` 进度追踪，`staging/dev/*.html` 设计文档
- 旧版代码（redux-saga 实现的 `app/`）已删除，需要时看 745c369

## 约定

- 主分支 `master`，开发分支 `dev`
- commit：`<type>(<scope>): <中文描述>`，type/scope 英文小写，body 写 why
- 注释只写「为什么」，不写变更史
- prettier 配置在 package.json；只对改动的文件跑，别带进无关格式化（如 `<!DOCTYPE html>` 被改小写）
- 设计文档用 html（亮色主题）放 `staging/dev/`

## 坑

- `src/` 会被打进浏览器包：读 `process.env` 必须先判断 `typeof process`，否则浏览器里直接白屏
- 引擎是确定性的（`SessionOptions.random` 注入种子）：`test/trace.test.ts` 的轨迹快照变了必须先查清原因，不能直接 `-u`
- 调 AI 参数看 arena：结果对种子敏感，结论要换一组种子复核
- 坐标：格子 16px（BLOCK_SIZE），战场 13×13 格；坦克垂直转向时吸附到 8px 格点
- 浮层按键监听挂在 document 捕获阶段；真实按键在两个监听器之间会跑微任务，同一次按键要用 `preventDefault` + `defaultPrevented` 标记已处理
- 浏览器 localStorage 键 `battle-city-ui`（键位、托管开关、最高分）
