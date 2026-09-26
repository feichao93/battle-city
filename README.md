# 坦克大战复刻版（Battle City Remake）

经典坦克大战的网页复刻，支持单人、双人、关卡编辑和 AI 托管。当前 dev 分支正在开发 0.4.0，使用 TypeScript、React 19、PixiJS v8 和 zustand，尚未正式发布。

2026-09-27，在 Claude Opus 5.5 的帮助下进行了一次全面重写：引擎与渲染分离、重写电脑玩家 AI、新增玩家托管和全键盘操作等，详见下方 Milestone 0.4.0。

在线游玩（0.3 版本）: https://battle-city.js.org

0.3 版本的详细介绍见知乎专栏文章: [https://zhuanlan.zhihu.com/p/35551654](https://zhuanlan.zhihu.com/p/35551654)

如果游戏过程中发现任何 BUG 的话，欢迎提 [issue](https://github.com/feichao93/battle-city/issues/new)。

### 开发进度：

0.2、0.3 版本（2018 年）使用 React 将原版素材封装为组件、用 SVG 渲染，使用 Immutable.js、redux 和 redux-saga/little-saga 管理游戏状态与逻辑。

<details>
  <summary><b>Milestone 0.2（已完成于 2018-04-16)</b></summary>

- [x] 游戏的基本框架
- [x] 单人模式
- [x] 展览页面
- [x] 关卡编辑器与自定义关卡管理

</details><br>

<details>
  <summary><b>Milestone 0.3（已完成于 2018-11-03）</b></summary>

- [x] 性能优化
- [x] 完整的游戏音效（有一些小瑕疵）
- [x] 双人模式（已完成）

</details><br>

**Milestone 0.4.0（开发中，尚未发布；进展更新于 2026-09-27）**

- [x] 技术栈重写：Vite 6 + React 19 + PixiJS v8 + zustand；战场用 PixiJS 绘制，界面用 React + SVG，画面固定放大 2 倍；游戏逻辑为 60Hz 定步引擎，与渲染分离
- [x] 坦克数值、bot 出生规则对齐 NES 原版；玩家坦克在冰面上会滑行
- [x] 更合理的电脑玩家：进攻老鹰时按需打砖开路，开局多游荡、越往后越凶，偶尔转身打侧面的玩家
- [x] 玩家托管：一段时间不操作后由 AI 接管（Options 里可关闭）；双人托管分工配合、躲子弹、守老鹰
- [x] 全键盘操作：标题页、选关、关卡列表、编辑器、画廊和弹窗；Options 页可改键位；Esc 暂停菜单
- [x] 界面细节：GAME OVER / 通关页展示分数与最高分，双人模式借命提示，页面背景跟随系统亮色 / 暗色主题
- [x] 无头试打（arena）与对局快照测试，调 AI 时用数据对比
- [x] npm 打包与本地启动 CLI（`battle-city` 命令）
- [ ] 正式发布：构建 0.4.0、上线 battle-city.js.org、发布 npm 包

### 命令行一键启动（npm 包正式发布后可用）

需要 Node.js 18 及以上：

```bash
npx battle-city            # 或者 npm i -g battle-city 之后运行 battle-city
npx battle-city --port 3000
```

启动后按 Enter 在浏览器中打开，Ctrl+C 退出。默认端口 8080，被占用时依次往后找。

发布之前可以从 dev 分支本地构建后启动：

```bash
git clone -b dev https://github.com/feichao93/battle-city.git && cd battle-city
pnpm install
pnpm build:npm && node bin/battle-city.js
```

### 本地开发

1.  克隆该项目到本地
2.  运行 `pnpm install` 安装依赖
3.  运行 `pnpm dev` 开启 vite 开发服务器
4.  运行 `pnpm build` 打包到 `dist/`（部署在 `/battle-city/` 子路径下）；`pnpm build:npm` 按相对路径打包到 `www/`，npm 包用的就是它
5.  运行 `pnpm test` 跑单测，`pnpm arena` 跑托管 AI 对 bot 的无头对局统计
