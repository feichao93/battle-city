import { List } from 'immutable'

export default function parseStageEnemies(enemies: StageConfig['enemies']) {
  const array: TankLevel[] = []
  for (const descriptor of enemies) {
    const splited = descriptor.split('*').map(s => s.trim())
    console.assert(splited.length === 2)

    const number = Number(splited[0])
    const tankLevel = splited[1] as TankLevel
    console.assert(!isNaN(number))
    console.assert(['basic', 'fast', 'power', 'armor'].includes(tankLevel))

    for (let i = 0; i < number; i += 1) {
      array.push(tankLevel)
    }
  }
  return List(array)
}
