import { StageConfig } from 'types'

const testStage: StageConfig = require('stages/stage-test.json')

const stageConfigs: { [name: string]: StageConfig } = {
  test: testStage,
}

// console.log(stageConfigs)

export default stageConfigs
