const stageConfigs: { [name: string]: StageConfig } = {}

if (DEV) {
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

export default stageConfigs
