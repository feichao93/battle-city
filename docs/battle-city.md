DONE 已经完成

WIP (working in progress) 正在进行中

NEXT 接下来将会进行

TODO 后续将会做的

BACKLOG 后续考虑做的, 优先级较低



* ~~新增stories页面, 来预览各个组件 [DONE]~~
* ~~所有标准关卡配置 [DONE]~~
* ~~新增stage-saga, 其生命周期对应一个关卡; 在关卡开始时, stage-saga启动; 当玩家clear stage时stage-saga结束, 并向game-saga返回关卡相关信息; stage-saga负责关卡地图生成, 关卡信息统计等与关卡相关的逻辑 [DONE]~~


* ~~在关卡配置文件*stage-xxx.json*中添加`enemies`字段, 用来描述这一个关卡中不同等级的敌人的数量. AIMasterSaga生成AI tank时使用该配置来确定坦克的等级. [DONE]~~

* ~~关卡结束/游戏结束时的统计页面内容(StatisticsOverlay), 以及该页面内的动画 [DONE]~~

* ~~支持4*4 brick小块的地图配置 [DONE]~~

* ~~新增坦克血量的相关逻辑[DONE]~~

  - ~~坦克血量机制[DONE]~~


* ~~根据血量的多少来确定颜色. [DONE]~~
* ~~关卡编辑器[DONE]~~
  - ~~地图编辑[DONE]~~
  - ~~关卡名称/关卡难度/AI坦克配置[DONE]~~
  - ~~配置文件导入/导出[DONE]~~


* ~~PowerUp的掉落/拾取/效果触发[DONE]~~

* ~~玩家得分显示[DONE]~~

  - ~~击杀分数显示[DONE]~~
  - ~~物品拾取分数显示[DONE]~~


* ~~游戏暂停功能[DONE]~~

  ​



* 根据原版游戏调整游戏数值和流程[WIP]
  - 子弹爆炸效果
  - 坦克爆炸效果
  - 坦克生成效果


* 使用Canvas进行绘图[OTHER]


* 支持player-2, 探索Gamepad API [TODO]
* 更合理的坦克碰撞检测 [TODO]
* 相关的文档和日记 [TODO]
* 音效 [TODO]
* 完善AI [BACKLOG]
* 添加后台与WebSockets, 实现联机功能 [BACKLOG]
* 使用自定义的关卡配置开始游戏. [BACKLOG]



# 其他

AI的子弹会穿过AI的坦克

如果human-tank有helmet, 那么ai的子弹打在上面会直接消失

