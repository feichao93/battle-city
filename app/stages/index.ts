const stageConfigs: { [name: string]: StageConfig } = {}

const requireStage = (require as any).context('stages', false, /\.json/)

for (const filename of requireStage.keys()) {
  const stage: StageConfig = requireStage(filename)
  stageConfigs[stage.name] = stage
}

export default stageConfigs
