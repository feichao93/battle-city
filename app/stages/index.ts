export const stageConfigs: { [name: string]: StageConfig } = {}

if (DEV.TEST_STAGE) {
  // inject stage test in dev mode
  stageConfigs['test'] = {
    name: '1',
    difficulty: 1,
    map: [
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  X  X  X  X  X  X  X  X  ',
      'X  X  X  X  X  Xf Tf Tf X  X  X  X  X  ',
      'X  X  X  X  X  X  E  Tf X  X  X  X  X  ',
    ],
    enemies: ['20*basic'],
  }
}

const requireStage = (require as any).context('stages', false, /\.json/)

for (const filename of requireStage.keys()) {
  const stage: StageConfig = requireStage(filename)
  stageConfigs[stage.name] = stage
}

// TODO 使用 OrderedMap
export const stageNames = Object.keys(stageConfigs)

if (DEV.TEST_STAGE) {
  stageNames.splice(stageNames.indexOf('test'), 1)
  stageNames.unshift('test')
}
