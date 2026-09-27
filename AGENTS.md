# battle-city

坦克大战复刻 · TypeScript + React 19 + PixiJS v8 + zustand · vite · vitest · pnpm

## 命令

- `pnpm dev`：http://localhost:5173/battle-city/（hash 路由）；`--host` 后局域网可连 `#/lobby`
- `pnpm test`；`./node_modules/.bin/tsc --noEmit`
- `pnpm arena`：托管 AI 对 bot 的无头统计；结果对种子敏感，结论换一组 `ARENA_SEEDS` 复核
- `pnpm build:npm` 构建 `www/` 后，`node bin/battle-city.js host` 起联机主机

## 目录

- `src/engine` 纯逻辑无 DOM；`src/render` PixiJS；`src/ui` React + SVG；`src/lan` 局域网联机（主机权威）
- `bin/`：npm 包的 CLI 和联机中继
- `resources/`：收集的资料，代码不引用
- `build/<version>/`：只放正式版本，被 gitignore，需 `git add -f`
- `staging/`（gitignore）：`NOTE.md` 进度追踪，其余是临时文档

## 约定

- 开发分支 `dev`；commit 写 `<type>(<scope>): <中文描述>`，body 写 why
- 注释只写「为什么」；prettier 只对改动的文件跑

## 发版

- `package.json` 改版本号；`vite build --base ./ --outDir build/<version> --emptyOutDir` 后 `git add -f build/<version>`，提交 `chore(release): <version>`，打 annotated tag `v<version>`，master 快进到该提交
- gh-pages：保留 `CNAME`（battle-city.js.org，根路径）、`favicon.ico`、`LICENSE`，其余换成 `build/<version>` 的文件
- `npm publish` 会经 `prepack` 构建 `www/`

## 坑

- `src/` 会打进浏览器包：读 `process.env` 前先判断 `typeof process`
- 引擎是确定性的：`test/trace.test.ts` 快照变了先查原因，不能直接 `-u`
- 浮层按键监听挂在 document 捕获阶段：同一次按键用 `preventDefault` + `defaultPrevented` 标记已处理
- 发 npm：仓库 `.npmrc` 是镜像，`npm whoami` / `login` 要带 `--registry https://registry.npmjs.org`
