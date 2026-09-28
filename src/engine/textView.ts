import type { TankIntent } from './ai/controller'
import type { SceneSnapshot, SessionSnapshot, TankSnapshot } from './snapshot'
import type { Direction, TankLevel } from './types'

const CELLS = 26
const ARROW: Record<Direction, string> = { up: '^', down: 'v', left: '<', right: '>' }
const BOT_CHAR: Record<TankLevel, string> = { basic: 'b', fast: 'f', power: 'p', armor: 'a' }

/**
 * 把快照画成文本：表头 + 26×26 的战场（每格 8px），测试断言和调试时直接读。
 * 地形：# 砖（+ 被打掉一部分），@ 钢，~ 河，: 雪，% 森林，E 老鹰（X 已被毁）。
 * 坦克占 2×2 格，左上是编号（玩家 1 2，bot 按等级 b f p a），右上是朝向；
 * o 出生闪烁，? 道具，* 子弹
 */
export function textView(snapshot: SessionSnapshot): string {
  const scene = snapshot.scene
  const lines = [
    `stage ${snapshot.stageName} · ${snapshot.phase} ${seconds(snapshot.phaseTime)}` +
      (scene == null ? '' : ` · ${scene.status} · bots waiting ${scene.remainingBots}`),
  ]
  snapshot.players.forEach((player, i) => {
    const tankId = scene?.slots[i].tankId
    const tank = scene?.tanks.find((t) => t.id === tankId)
    const where = tank != null ? describeTank(tank) : (scene?.slots[i].state ?? '-')
    lines.push(`P${i + 1} lives ${player.lives} score ${player.score} ${player.pilot} · ${where}`)
  })
  if (scene != null) {
    lines.push(...drawField(scene))
  }
  return lines.join('\n')
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

function describeTank(tank: TankSnapshot): string {
  return `(${tank.x},${tank.y}) ${tank.direction} · ${describeIntent(tank.intent)}`
}

function describeIntent(intent: TankIntent | null): string {
  if (intent == null) return 'no intent'
  let move = 'stop'
  if (intent.move?.type === 'turn') move = `turn ${intent.move.direction}`
  if (intent.move?.type === 'forward') move = 'forward'
  return intent.fire ? `${move} + fire` : move
}

/** drawField 用到的战场内容 */
export type FieldView = Pick<
  SceneSnapshot,
  'terrain' | 'eagle' | 'slots' | 'tanks' | 'spawning' | 'bullets' | 'powerUps'
>

/** 26×26 的战场文本，符号见 textView；self 这辆坦克的编号画成 M */
export function drawField(scene: FieldView, self: number | null = null): string[] {
  const grid: string[][] = []
  for (let row = 0; row < CELLS; row += 1) {
    grid.push([])
    for (let col = 0; col < CELLS; col += 1) {
      const quarter = [
        scene.terrain[2 * row][2 * col],
        scene.terrain[2 * row][2 * col + 1],
        scene.terrain[2 * row + 1][2 * col],
        scene.terrain[2 * row + 1][2 * col + 1],
      ]
      const bricks = quarter.filter((c) => c === '#').length
      grid[row].push(bricks === 4 ? '#' : bricks > 0 ? '+' : quarter[0])
    }
  }
  const put = (x: number, y: number, chars: string) => {
    const row = Math.round(y / 8)
    const col = Math.round(x / 8)
    const cells = [chars[0], chars[1], chars[2], chars[3]]
    cells.forEach((ch, i) => {
      const r = row + (i >> 1)
      const c = col + (i & 1)
      if (r < CELLS && c < CELLS) grid[r][c] = ch
    })
  }
  if (scene.eagle != null) {
    put(scene.eagle.x, scene.eagle.y, scene.eagle.broken ? 'XXXX' : 'EEEE')
  }
  for (const p of scene.powerUps) put(p.x, p.y, '????')
  for (const s of scene.spawning) put(s.x, s.y, 'oooo')
  for (const tank of scene.tanks) {
    const slot = scene.slots.findIndex((s) => s.tankId === tank.id)
    const ch =
      tank.id === self ? 'M' : tank.side === 'bot' ? BOT_CHAR[tank.level] : String(slot + 1)
    put(tank.x, tank.y, `${ch}${ARROW[tank.direction]}${ch}${ch}`)
  }
  for (const b of scene.bullets) {
    const row = Math.floor((b.y + 1) / 8)
    const col = Math.floor((b.x + 1) / 8)
    if (row >= 0 && row < CELLS && col >= 0 && col < CELLS) grid[row][col] = '*'
  }
  return grid.map((row) => row.join(''))
}
