坦克的位置用坦克的左上角的坐标表示，坦克的大小为 16 \* 16

子弹的位置用子弹的左上角的坐标表示，子弹的大小为 3 \* 3 （子弹在渲染时有一个额外的像素来表示子弹的方向，但是我们在处理子弹的碰撞时忽略该像素）

URL 设计：

* 游戏过程中，url 要能反映当前的游戏进度
* 访问对应的 url 可以直接进行操作（选择关卡或开始游戏）
* `GameRecord#status` 用于记录游戏进行状态。可选三个状态之一：`idle | on | gameover`

URL 列表：

* 主页面
  * url `/`
  * 如果游戏已经结束，则渲染`<GameoverScene />`，否则渲染组件 `<GameTitleScene />`
  * 直接打开该 URL 的行为：_重置游戏状态_，并渲染 GameTitleScene
* 选择关卡界面
  * `/choose-stage/:stageName`
  * `/choose-stage --> /choose-stage/1`
  * 组件 `<ChooseStageScene />`
  * 直接打开该 URL 的行为：_重置游戏状态_，并渲染 ChooseStageScene
* 游戏进行中
  * `/game/:stageName`
  * `/game --> /game/1`
  * 如果正在进行关卡统计，则渲染 `<StatisticsScene />`，否则渲染组件 `<GameScene />`
  * 直接打开该 url 的行为：_重置游戏状态_，直接开始对应的关卡

\* 上面的 _重置游戏状态_ 意味着 **重置所有相关状态并重启所有的 saga**。
