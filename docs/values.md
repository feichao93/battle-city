# battle-city相关数值

默认时间单位为 毫秒 ms   其他单位: 1f = frame = 16.67ms   1s = 1000ms

默认距离的单位为 像素 px   其他单位:  1B = 1block = 16px



#### 坦克颜色[DONE]

包含掉落物品的坦克颜色 [red/8f  other/8f]

AI armor tank HP 4 颜色  [green/1f  silver/3f  green/1f silver/1f]

AI armor tank HP 3 颜色  [yellow/1f  silver/3f  yellow/1f  silver/1f]

AI armor tank HP 2 颜色  [green/3f  yellow/1f  green/1f  yellow/1f]

AI armor tank HP 1 颜色 silver

player-1的坦克颜色为yellow

player-2的坦克颜色为green

**说明:**

*[red/8f  other/8f]*表示*red持续8帧, 然后other持续3帧, 然后回到开头, red持续8帧, other持续8帧...*, 如此循环往复

#### 坦克移动速度[DONE]

slow: 0.03px/ms

middle: 0.045px/ms

fast: 0.6px/ms

玩家坦克的移动速度为middle; AI basic移动速度为slow; AI fast移动速度为fast; AI power与AI armor移动速度为middle

#### 子弹飞行速度[DONE]

AI basic, AI fast, Human basic的子弹速度为0.12px/ms; 其他坦克的子弹速度为0.24px/ms

#### 子弹上限[DONE]

Human power和Human armor的子弹上限为2; 其余坦克的子弹上限1

子弹上限表示一架坦克在场上的子弹数量最大值

#### 道具相关时间[DONE]

道具掉落ICON的闪烁时间: [消失/8f  出现/8f]

helmet闪烁时间: 每个形状持续2帧左右

关卡开始时玩家自动获得的helmet持续时间:  135f

玩家坦克重生时自动获得的helmet持续时间:  180f

道具helmet的持续时间: 630f

道具shovel, 总共的持续时间: 1268f.  steel/1076f + (B/16f + T/16f) * 6次

#### 其他数值[DONE]

得分提示的出现时间 48f



#### 爆炸效果相关数值(TODO)

#### 其他TODO

[TODO]  道具掉落的超时时间

#### 子弹发射间隔[TODO]

玩家的子弹发射间隔为0, 但受到子弹上限的影响, 所以子弹发射频率有上限

短距离射击时, 玩家坦克的子弹间隔取决于玩家手速

TODO AI坦克的子弹发射间隔还没进行测量