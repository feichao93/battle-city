// 该文件定义的常量将被 webpack.DefinePlugin 使用
// 注意 custom-tyings.d.ts 文件的类型定义要与该文件一致
// 参数 dev 表示是否为开发环境

module.exports = dev => ({
  // 是否打印 AI 的日志
  'DEV.LOG_AI': false,
  // 是否启用 console.assert
  'DEV.ASSERT': dev,
  // 是否显示 <SpotGraph />
  'DEV.SPOT_GRAPH': false,
  // 是否显示 <TankPath />
  'DEV.TANK_PATH': false,
  // 是否显示 <RestrictedAreaLayer /> 与「坦克的转弯保留位置指示器」
  'DEV.RESTRICTED_AREA': dev,
  // 是否加快游戏过程
  'DEV.FAST': false,
  // 是否使用测试关卡
  'DEV.TEST_STAGE': false,
  // 是否显示 About 信息
  'DEV.HIDE_ABOUT': dev,
  // 是否启用 <Inspector />
  'DEV.INSPECTOR': false,
  // 是否打印游戏日志
  'DEV.LOG': dev,
  // 是否打印游戏性能相关日志
  'DEV.LOG_PERF': false,
  // 是否跳过关卡选择
  'DEV.SKIP_CHOOSE_STAGE': false,
})
