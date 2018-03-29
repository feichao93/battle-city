## 坦克与子弹的位置表示

坦克的位置用坦克的左上角的坐标表示，坦克的大小为 16 \* 16

子弹的位置用子弹的左上角的坐标表示，子弹的大小为 3 \* 3 （子弹在渲染时有一个额外的像素来表示子弹的方向，但是我们在处理子弹的碰撞时忽略该像素）

## URL 设计

URL 设计：

* 游戏过程中，url 要能反映当前的游戏进度
* 访问对应的 url 可以直接进行操作（直接选择关卡或直接开始游戏）
* url 只能反映游戏的一部分状态，`GameRecord#status` 记录了游戏主状态，该字段可以为以下值之一：`idle | on | statistics | gameover`

URL 列表：

* 主页面
  * url `/`
  * 渲染组件 `<GameTitleScene />`
  * 直接打开该地址的行为：_重置游戏状态_，并渲染 GameTitleScene
* 游戏结束
  * url `/gameover`
  * 按下 `R` 跳转到上次关卡的选择页面的，以便重新开始游戏
  * 直接打开该地址的行为：自动跳转到主页面
* 选择关卡界面
  * `/choose/:stageName`
  * 地址自动跳转 `/choose --> /choose/1`
  * 渲染组件 `<ChooseStageScene />`
  * 直接打开该地址的行为：_重置游戏状态_，并渲染 ChooseStageScene
* 游戏进行中
  * `/game/:stageName`
  * `/game --> /game/1`
  * 如果正在进行关卡统计，则渲染 `<StatisticsScene />`，否则渲染组件 `<GameScene />`
  * 直接打开该 url 的行为：_重置游戏状态_，直接开始对应的关卡
  * 正在游戏中跳转到该地址的行为：如果地址中的关卡和正在游戏中的关卡一致，则什么也不做；否则直接开始地址对应的关卡
* Gallery 页面，地址 `/gallery`
* Editor 页面，地址 `/editor`

\* 上面的 _重置游戏状态_ 意味着 **重置所有相关状态并重启所有的 saga**。

## PowerUp 生成与消失的规则

\* 注意：_斜体字部分_ 可能与原版游戏有出入

* 当玩家**第一次击中**属性 `withPowerUp` 为 `true` 的坦克时，一个 PowerUp 就会随机掉落，_不同类型的 PowerUp 掉落概率相同_
* *PowerUp 掉落位置需要满足的条件：将 PowerUp 等分为四份，其中的一至三份与地图其他元素发生碰撞*
* 当一架 `withPowerUp` 为 `true` 的坦克**开始生成**时（Flicker 出现时），地图上所有的 PowerUp 都会消失；PowerUp 在地图上不会因为长时间不拾取而消失
* 每一关第 4、11、18 架坦克的 `withPowerUp` 属性为 `true`
