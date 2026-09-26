# NES 原版数值调研

以 NES 版 Battle City（1985）的 ROM 反汇编为一手资料，核对重写版用到的各项数值。
每项都注明 NES 原值、换算后的 ms / px、来源地址、可信度，以及与我们当前实现是否一致。

- 1 帧 = 1000/60 ms；1 block = 16px。
- `docs/values/readme.md` 是早年用网页版实测的笔记，与本目录冲突时以本目录为准。

## 文档

| 文档 | 内容 |
| --- | --- |
| [tank-and-bullet.md](tank-and-bullet.md) | 移动速度、转向对齐、子弹速度 / 上限 / 冷却 / 威力 / 互撞、子弹生成位置、HP、颜色闪烁、玩家星级、冰面滑行 |
| [powerups-effects-flow.md](powerups-effects-flow.md) | 道具效果与时长、护盾、出生星星、爆炸、得分与加命、关卡流程（幕布 / 结算 / GAME OVER）、暂停 |
| [spawn-ai.md](spawn-ai.md) | bot 出生调度、出生点、冻结、bot 移动决策与开火、坦克之间的阻挡 |

## 与当前实现的主要差异

按对手感的影响从大到小排列，细节和来源见各文档。已对齐的项不列。

| # | 差异 | NES 原版 | 我们当前 | 文档 |
| --- | --- | --- | --- | --- |
| 1 | bot 移动决策 | 格点 1/16 概率决策，按时间分随机 / 追玩家 / 追老鹰三段 | 寻路 + 攻击老鹰 | spawn-ai |
| 2 | bot 开火 | 无子弹在场时每帧 1/32，不看环境 | 按环境估算概率 | spawn-ai |
| 3 | 子弹速度 | 玩家 1～3 星 4px/帧；bot fast / armor 2px/帧 | 玩家 1 星起 3px/帧；bot fast / armor 3px/帧 | tank-and-bullet |
| 4 | 玩家开火 | 按下那一帧开火，无冷却；子弹消失后 9 帧才能再发 | 按住连发，冷却 300 / 200ms | tank-and-bullet |
| 5 | 加命 | 每名玩家整局只在首次到 20000 分时加一次 | 每 10000 分加一次 | powerups-effects-flow |
| 6 | 结束流程 | 两种结束方式都先升 GAME OVER，再结算，再显示砖纹画面；老鹰被毁有 39 帧大爆炸 | 老鹰被毁立即结束、不结算；命用完先结算后升字样 | powerups-effects-flow |
| 7 | 冰面滑行 | 仅玩家：起步 13px 内不能转向和停止，点按一下共滑 29px | 已实现，有意比原版短：起步约 8px 内不能转向，点按共滑约 17px（试玩觉得原版太滑，constants.ts SNOW_SLIDE_*） | tank-and-bullet |
| 8 | 第 35 关之后 | 进入 36～70 关（地图循环，难度固定按第 35 关），70 关后回第 1 关 | 打完最后一关结束 | powerups-effects-flow |
| 9 | 道具出现位置与种类 | 16 个固定点，不看地形；star、grenade 各 2/8，其余各 1/8 | 有偏置 | powerups-effects-flow |
| 10 | 子弹互撞 | 只在至少一方是玩家子弹时抵消，距离 < 6 | 所有子弹两两抵消 | tank-and-bullet |
| 11 | 3 星打砖 | 整块 8×8 清除 | 削 4px | tank-and-bullet |
| 12 | 砖块阻挡 | 8×8 格只剩一小块也整格挡住坦克 | 按 4px 判定 | tank-and-bullet |
| 13 | 流程计时 | 过关约 2.9s 进结算；TOTAL 停 2250ms；幕布合拢 16 / 停 ≥78 / 打开 16 帧；GAME OVER 每帧升 1px | 4s；1000ms；30 / 40 / 30 帧 | powerups-effects-flow |
| 14 | 击杀分数显示 | 12 帧（fast bot 6 帧）；fast bot 爆炸快一倍；玩家爆炸约 32 帧 | 48 帧；36 帧 | powerups-effects-flow |
| 15 | 计分细节 | grenade 炸掉的 bot 不计入结算；满级再吃 star 不加 5000 | 两处相反 | powerups-effects-flow / tank-and-bullet |
| 16 | armor 颜色 | 两种颜色每帧交替；带道具坦克全场同步闪烁 | 6 帧循环；各自按出场时间 | tank-and-bullet |
| 17 | 出生点地形 | 出生时把出生点 16×16 清成空地 | 不清除 | spawn-ai |
| 18 | 其他小项 | 队友误伤僵直约 4.4s；转向那一帧照常走 1px；子弹出生点沿飞行方向差 1～3px；shovel 闪烁少半轮；暂停音只在进入暂停时响 | 1s 等 | tank-and-bullet / powerups-effects-flow |

## 未查到

- 关与关之间幕布阶段显示灰色 STAGE 画面还是黑屏：代码推导与 megabars 的模拟器观察矛盾。
- 除 GAME OVER 音乐外各音效的长度。
- 出生星星贴图编号与我们贴图的对应关系。

## 资料来源

- [D] 带注释的 NES 反汇编：https://github.com/cyneprepou4uk/NES-Games-Disassembly/tree/main/Battle%20City
- [M] 按 ROM 转写的 TS 版：https://github.com/megabars/battle-city-port （与 [D] 冲突时以 [D] 为准，冲突点已在各文档注明）
- [V] https://github.com/vgrichina/battlecity/blob/main/REVERSE.md
- StrategyWiki、GameFAQs、TCRF 访问失败，没有采用社区数值。
