# 坦克大战复刻版（Battle City Remake）

经典坦克大战的网页复刻，支持单人、双人、局域网联机、关卡编辑和 AI 托管。

在线游玩：https://battle-city.js.org

- 0.4.0 的设计与实现：[resources/introduction.md](resources/introduction.md)
- 0.3 版本的开发介绍：[知乎专栏](https://zhuanlan.zhihu.com/p/35551654)

如果游戏过程中发现任何 BUG 的话，欢迎提 [issue](https://github.com/feichao93/battle-city/issues/new)。

### 命令行一键启动

需要 Node.js 18 及以上：

```bash
npx battle-city            # 或者 npm i -g battle-city 之后运行 battle-city
npx battle-city --port 3000
npx battle-city host       # 局域网联机主机，把打印出的地址发给同一网络里的另一位玩家
```

启动后按 Enter 在浏览器中打开，Ctrl+C 退出。默认端口 8080，被占用时依次往后找。

### 本地开发

```bash
pnpm install
pnpm dev         # vite 开发服务器
pnpm test        # 单测；pnpm arena 跑托管 AI 对 bot 的无头对局统计
pnpm build       # 按相对路径打包到 dist/，放在任意路径下都能打开
pnpm build:npm   # 按相对路径打包到 www/，npm 包用的就是它
```

### 开发进度

**Milestone 0.4.0（2026-09-28）**

在 Claude Opus 5.5 的帮助下全面重写：

- [x] 技术栈：TypeScript + Vite 6 + React 19 + PixiJS v8 + zustand；战场用 PixiJS 绘制，界面用 React + SVG；游戏逻辑为 60Hz 定步引擎，与渲染分离
- [x] 坦克数值、bot 出生规则对齐 NES 原版；玩家坦克在冰面上会滑行
- [x] 更合理的电脑玩家：进攻老鹰时按需打砖开路，开局多游荡、越往后越凶，偶尔转身打侧面的玩家
- [x] 玩家托管：一段时间不操作后由 AI 接管（Options 里可关闭）；双人托管分工配合、躲子弹、守老鹰
- [x] 局域网联机：`battle-city host` 启动大厅，同一网络里的两人创建或加入房间对战
- [x] 全键盘操作：标题页、选关、关卡列表、编辑器、画廊和弹窗；Options 页可改键位；Esc 暂停菜单
- [x] 界面细节：GAME OVER / 通关页展示分数与最高分，双人模式借命提示，页面背景跟随系统亮色 / 暗色主题
- [x] 无头试打（arena）与对局快照测试，调 AI 时用数据对比
- [x] npm 包与命令行一键启动

<details>
  <summary><b>Milestone 0.3（2018-11-03）</b></summary>

- [x] 性能优化
- [x] 完整的游戏音效（有一些小瑕疵）
- [x] 双人模式

</details>

<details>
  <summary><b>Milestone 0.2（2018-04-16）</b></summary>

- [x] 游戏的基本框架
- [x] 单人模式
- [x] 展览页面
- [x] 关卡编辑器与自定义关卡管理

</details>

0.2、0.3 使用 React 将原版素材封装为组件、用 SVG 渲染，使用 Immutable.js、redux 和 redux-saga/little-saga 管理游戏状态与逻辑，开发过程见 [resources/journal.md](resources/journal.md)。
