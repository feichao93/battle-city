// 该文件定义的常量将被 webpack.DefinePlugin 使用
// 注意 custom-tyings.d.ts 文件的类型定义要与该文件一致

module.exports = prod => ({
  // 是否打印 AI 的日志
  'DEV.LOG_AI': !prod,
  // 是否启用 console.assert
  'DEV.ASSERT': !prod,
  // 是否显示 <SpotGraph />
  'DEV.SPOT_GRAPH': !prod,
  // 是否显示 <TankPath />
  'DEV.TANK_PATH': !prod,
  // 是否显示 <RestrictedAreaLayer />
  'DEV.RESTRICTED_AREA': !prod,
  // 是否加快游戏过程
  'DEV.FAST': !prod,
  // 是否使用测试关卡
  'DEV.TEST_STAGE': !prod,
  // 是否显示 build 信息
  'DEV.BUILD_INFO': prod,
  // 是否启用 <Inspector />
  'DEV.INSPECTOR': !prod,
  // 其他配置
  'DEV.OTHER': !prod,
})
