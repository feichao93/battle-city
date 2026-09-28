import type { Direction } from '../types'
import {
  hotRay,
  type Action,
  type Blocker,
  type DecisionPrompt,
  type DecisionState,
} from './decision'
import type { LaneHitKind } from './lane'
import { fireQuestions, INTENT_CRITERIA, rawJson, RULES } from './prompt-raw'

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']
const DIR: Record<Direction, string> = { up: '上', down: '下', left: '左', right: '右' }
const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
const STEP: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
const HIT: Record<LaneHitKind, string> = {
  bot: '敌方坦克',
  player: '队友',
  eagle: '己方老鹰',
  steel: '钢墙',
  edge: '边界',
}
const BLOCKER: Record<Blocker, string> = {
  free: '可以前进',
  brick: '被砖挡住',
  steel: '被钢墙挡住',
  river: '被河挡住',
  tank: '被坦克挡住',
  eagle: '被老鹰挡住',
  edge: '到边界了',
}

const ACTION_TEXT: Record<Action, string> = {
  move_up: '朝上开动',
  move_down: '朝下开动',
  move_left: '朝左开动',
  move_right: '朝右开动',
  face_up: '转向朝上',
  face_down: '转向朝下',
  face_left: '转向朝左',
  face_right: '转向朝右',
  stay: '原地不动',
}

/**
 * state 里的距离以 8px 为一格；描述里统一换算成坦克宽度（16px），精确到半格。
 * 模型对「0 格外」「16 层砖」这类说法判断很差
 */
function tanks(cells: number): number {
  return Math.round(Math.abs(cells)) / 2
}

/** 相对位置，按两辆坦克左上角（即中心）的差 */
function where(dx: number, dy: number): string {
  const parts: string[] = []
  if (tanks(dy) > 0) parts.push(`${dy < 0 ? '上' : '下'}方${tanks(dy)}格`)
  if (tanks(dx) > 0) parts.push(`${dx < 0 ? '左' : '右'}方${tanks(dx)}格`)
  return parts.length > 0 ? parts.join('、') : '同一位置'
}

/** 炮口到目标的空隙 */
function gap(cells: number): string {
  return tanks(cells) === 0 ? '紧挨着' : `${tanks(cells)}格外`
}

/** 毫秒写成秒，模型对「0.35 秒」比对「350 毫秒」直观 */
function sec(ms: number): string {
  return `${(ms / 1000).toFixed(2)}秒`
}

/** 一枪打掉一层 4px 的砖，lanes 的 bricks 就是要打的枪数 */
function laneText(lane: DecisionState['lanes'][Direction]): string {
  const bricks = lane.bricks > 0 ? `先打穿砖墙（约${lane.bricks}枪），再` : ''
  return `${bricks}打到${gap(lane.distance)}的${HIT[lane.hit]}`
}

/** 连续相同的动作合并成 ×N，来回抖动一眼就能看出来 */
function history(actions: Action[]): string {
  const runs: { action: Action; count: number }[] = []
  for (const action of actions) {
    const last = runs[runs.length - 1]
    if (last?.action === action) last.count += 1
    else runs.push({ action, count: 1 })
  }
  return runs.map((r) => ACTION_TEXT[r.action] + (r.count > 1 ? `×${r.count}` : '')).join(' → ')
}

/**
 * 双方能不能打到对方，按精确几何算好写出来：描述里的位置精确到半格，模型据此判断不了
 * 「错开 8px 还打不打得到」，而错位时常常它打得到我、我打不到它
 */
function duel(b: DecisionState['bots'][number]): string {
  const parts: string[] = []
  const t = b.threat
  if (t != null) {
    const wall = t.bricks > 0 ? '中间隔着砖墙' : '中间没有遮挡'
    parts.push(
      t.facing ? `正瞄准你（${wall}）` : `它转向朝${DIR[t.direction]}就能打到你（${wall}）`,
    )
    // 提前量：它多久能开火、开火后多久打到我；隔着砖时一枪打不过来，不算
    if (t.bricks === 0) parts.push(`${ready(b.readyIn)}，开火后${sec(t.eta)}打到你`)
  }
  if (b.shot != null) {
    parts.push(
      `你朝${DIR[b.shot.direction]}开火能打到它${b.shot.bricks > 0 ? '（要先打穿砖墙）' : ''}`,
    )
  } else if (t != null) {
    parts.push('你现在打不到它')
  }
  return parts.map((p) => `，${p}`).join('')
}

function ready(readyIn: number | null): string {
  if (readyIn == null) return '它的子弹还在飞，打中东西前不能再开火'
  return readyIn === 0 ? '它随时可以开火' : `它${sec(readyIn)}后能开火`
}

/** 每颗来弹一行：多久打到、往哪边躲来不来得及、能不能迎面抵消 */
function dangers(s: DecisionState): string[] {
  if (s.incoming.length === 0) return ['没有子弹朝你飞来。']
  return s.incoming.slice(0, 3).map((b) => {
    const ways = b.dodge.map(
      (d) => `往${DIR[d.direction]}开${sec(d.ms)}能让开（${d.inTime ? '来得及' : '来不及'}）`,
    )
    if (b.counter) ways.push(`朝${DIR[b.from]}开火能迎面抵消它`)
    const how = ways.length > 0 ? ways.join('；') : '躲不开也挡不住'
    return `危险：一颗敌方子弹从${DIR[b.from]}方飞来，${sec(b.eta)}后打中你；${how}。`
  })
}

/** 局面的中文描述，作为接口的 state */
export function describe(s: DecisionState): string {
  const lines = [`（1格 = 一个坦克宽；谁能打到谁已按精确位置算好）你的坦克朝${DIR[s.me.facing]}。`]
  for (const d of DIRECTIONS) {
    lines.push(`往${DIR[d]}：${BLOCKER[s.moves[d]]}；朝${DIR[d]}开火会${laneText(s.lanes[d])}。`)
  }
  lines.push(...dangers(s))
  if (s.bots.length === 0) lines.push('场上没有敌方坦克。')
  s.bots.forEach((b, i) => {
    const aiming = `${duel(b)}${b.aimingAtEagle ? '，正瞄准老鹰！' : ''}`
    const eagle =
      b.distToEagle == null
        ? ''
        : nearEagle(b) && !b.aimingAtEagle
          ? `，正在逼近老鹰（离老鹰${tanks(b.distToEagle)}格）`
          : `，离老鹰${tanks(b.distToEagle)}格`
    lines.push(`敌方坦克${i + 1}：在你${where(b.dx, b.dy)}，朝${DIR[b.facing]}${aiming}${eagle}。`)
  })
  if (s.eagle != null) {
    lines.push(`老鹰在你${where(s.eagle.dx, s.eagle.dy)}${s.eagle.broken ? '，已被摧毁' : ''}。`)
  }
  if (s.teammate != null) lines.push(`队友在你${where(s.teammate.dx, s.teammate.dy)}。`)
  for (const p of s.powerUps) lines.push(`道具 ${p.type} 在你${where(p.dx, p.dy)}。`)
  if (s.recentActions.length > 0)
    lines.push(`你最近几步（从早到晚）：${history(s.recentActions)}。`)
  return lines.join('\n')
}

/** 离目标这么近（8px 格，= 4 个坦克宽）就不再鼓励靠近：贴脸时 bot 一开火就躲不开 */
const CLOSE = 8
/** 离老鹰这么近（8px 格，= 6 个坦克宽）的 bot 标成「逼近老鹰」：等它对准老鹰再回防就来不及了 */
const EAGLE_NEAR = 12

function nearEagle(b: DecisionState['bots'][number]): boolean {
  return b.distToEagle != null && b.distToEagle <= EAGLE_NEAR
}

/** 要去打的 bot：瞄准老鹰的优先，其次离老鹰最近的逼近者，再次离我最近的（bots 按离我的距离排序） */
function target(s: DecisionState) {
  const aiming = s.bots.find((b) => b.aimingAtEagle)
  if (aiming != null) return { bot: aiming, who: '瞄准老鹰的敌方坦克' }
  const near = s.bots
    .filter(nearEagle)
    .sort((a, b) => (a.distToEagle ?? 0) - (b.distToEagle ?? 0))[0]
  if (near != null) return { bot: near, who: '逼近老鹰的敌方坦克' }
  return s.bots[0] == null ? null : { bot: s.bots[0], who: '最近的敌方坦克' }
}

/**
 * 往 d 走一格离目标 bot 更近还是更远，目标见 target。
 * 离得近时只说「更贴近 / 拉开距离」，v8 的阵亡多半是照着「靠近」一路开到 bot 跟前
 */
function approach(s: DecisionState, d: Direction): string {
  const { bot, who } = target(s) ?? {}
  if (bot == null) return ''
  const [sx, sy] = STEP[d]
  const before = Math.abs(bot.dx) + Math.abs(bot.dy)
  const after = Math.abs(bot.dx - sx) + Math.abs(bot.dy - sy)
  if (before <= CLOSE) {
    return after < before ? `，更贴近${who}（太近时它一开火你就躲不开）` : `，和${who}拉开距离`
  }
  return after < before ? `，靠近${who}` : `，远离${who}`
}

/** 和 bot 之间没有遮挡的射线：它开火就能打到这个位置 */
function exposed(names: { bot: number; facing: boolean }[]): string {
  return names.map((e) => `敌方坦克${e.bot + 1}${e.facing ? '（正对着它的炮口）' : ''}`).join('、')
}

/** 选项对来弹的后果：d 为 null 表示停在原地（打砖、转向） */
function dodgeText(s: DecisionState, d: Direction | null): string {
  const parts = s.incoming.slice(0, 3).map((b) => {
    const from = `从${DIR[b.from]}方来的子弹`
    const way = d == null ? undefined : b.dodge.find((x) => x.direction === d)
    if (way != null) return way.inTime ? `能躲开${from}` : `想躲${from}但来不及`
    return d == null ? `停在原地会被${sec(b.eta)}后到的${from}打中` : `仍在${from}的弹道上`
  })
  return parts.map((p) => `，${p}`).join('')
}

/** 选项的自保后果：来弹，以及走一步后会不会进入 bot 的射线；原地不动的选项看现在的位置 */
function safety(s: DecisionState, d: Direction | null): string {
  const now = s.bots
    .map((b, i) => ({ bot: i, facing: b.threat?.facing === true, clear: b.threat?.bricks === 0 }))
    .filter((e) => e.clear)
  let rays = ''
  if (d == null) {
    rays = now.length > 0 ? `，停在原地仍在${exposed(now)}的射线上` : ''
  } else {
    const stay = s.exposure[d].filter((e) => now.some((n) => n.bot === e.bot))
    const enter = s.exposure[d].filter((e) => !now.some((n) => n.bot === e.bot))
    if (stay.length > 0) rays += `，仍在${exposed(stay)}的射线上`
    if (enter.length > 0) rays += `，会进入${exposed(enter)}的射线`
    if (rays === '' && now.length > 0) rays = '，离开射线'
  }
  return dodgeText(s, d) + rays
}

/**
 * 做完这个选项后最急的危险，安全为 null。d 为 null 表示停在原地（打砖、转向）；
 * counter 是这次转过去迎面抵消来弹的方向
 */
function danger(s: DecisionState, d: Direction | null, counter: Direction | null): string | null {
  for (const b of s.incoming) {
    if (b.from === counter) continue
    if (d != null && b.dodge.some((x) => x.direction === d && x.inTime)) continue
    return `${sec(b.eta)}后被从${DIR[b.from]}方来的子弹打中`
  }
  const rays =
    d == null
      ? s.bots.flatMap((b, i) =>
          b.threat?.bricks === 0 ? [{ bot: i, facing: b.threat.facing, eta: b.threat.eta }] : [],
        )
      : s.exposure[d]
  for (const e of rays) {
    const { readyIn } = s.bots[e.bot]
    if (readyIn == null || !hotRay(readyIn, e.facing, e.eta)) continue
    const when = readyIn === 0 ? '随时' : `${sec(readyIn)}后`
    const where = e.facing ? '正对着' : '在'
    return `${where}敌方坦克${e.bot + 1}的炮口前，它${when}能开火，子弹${sec(e.eta)}就到`
  }
  if (d != null && s.exits[d].length === 0) return '走过去是死角，再走一步到哪都在射线上'
  return null
}

/** 死角会进危险标签，这里只写还有几条出路 */
function exitsText(s: DecisionState, d: Direction): string {
  const n = s.exits[d].length
  return n > 0 ? `，走过去后还有${n}个方向能安全离开` : ''
}

/** 选项开头的安全标签：写进选项本身，模型才会把它当成后果；只在描述里写射线时它照样往里开 */
function tag(s: DecisionState, d: Direction | null, counter: Direction | null = null): string {
  const reason = danger(s, d, counter)
  return reason == null ? '【安全】' : `【危险：${reason}】`
}

/** 选了朝砖墙开动：选项写明了会边开火边打穿，返回要打砖的方向 */
export function digDirection(action: Action, s: DecisionState): Direction | null {
  if (!action.startsWith('move_')) return null
  const d = action.slice(5) as Direction
  return s.moves[d] === 'brick' ? d : null
}

/**
 * action 的选项按局面生成：走得通（或只隔着砖）的方向才给 move_*，那个方向能打到 bot 才给 face_*，
 * 每项写明后果。给全 9 项、只写动作本身时，模型几乎总选 stay 或 move_up
 */
function actionCriteria(s: DecisionState): Partial<Record<Action, string>> {
  const criteria: Partial<Record<Action, string>> = {}
  // 掉头写进选项本身：只在指令里说「不要来回抖动」时，模型照样在一个口袋位置里左右来回
  const last = s.recentActions[s.recentActions.length - 1]
  // 旁边有空路能靠近目标时不给打砖：打砖要停在原地好几枪，模型却常把它当成普通的前进
  const freeApproach = DIRECTIONS.some(
    (d) => s.moves[d] === 'free' && approach(s, d).startsWith('，靠近'),
  )
  for (const d of DIRECTIONS) {
    const lane = s.lanes[d]
    const aim = `炮口对准${DIR[d]}方${gap(lane.distance)}的${HIT[lane.hit]}`
    const turn = last === `move_${OPPOSITE[d]}` ? '掉头' : ''
    if (s.moves[d] === 'free') {
      criteria[`move_${d}`] =
        `${tag(s, d)}${turn}朝${DIR[d]}开动${approach(s, d)}${safety(s, d)}${exitsText(s, d)}，${aim}`
    } else if (s.moves[d] === 'brick') {
      // 打砖时人停在原地，所以靠近 / 远离说的是打穿之后
      const after = approach(s, d)
      if (!after.startsWith('，靠近') || freeApproach) continue
      criteria[`move_${d}`] =
        `${tag(s, null)}${turn}朝${DIR[d]}开动（前面是砖墙，要停在原地打约${s.digShots[d]}枪才能开过去` +
        `${after && `，打穿后${after.slice(1)}`}）${safety(s, null)}，${aim}`
    }
    const counter = s.incoming.some((b) => b.counter && b.from === d)
    if (lane.hit === 'bot' || counter) {
      const target = counter ? '，开火迎面抵消飞来的子弹' : `，瞄准${gap(lane.distance)}的敌方坦克`
      criteria[`face_${d}`] =
        `${tag(s, null, counter ? d : null)}原地转向朝${DIR[d]}${target}${safety(s, null)}`
    }
  }
  if (Object.keys(criteria).length === 0) criteria.stay = `${tag(s, null)}原地不动`
  return withoutDanger(s, criteria)
}

/**
 * 有【安全】选项就不给【危险】的：只打标签时 26% 的决策照样选危险，24 次阵亡里 23 次死前选过（v9）。
 * 原地不动安全时补一个 stay，免得危险选项去掉后只剩往前冲
 */
function withoutDanger(
  s: DecisionState,
  criteria: Partial<Record<Action, string>>,
): Partial<Record<Action, string>> {
  const entries = Object.entries(criteria) as [Action, string][]
  if (!entries.some(([, text]) => text.startsWith('【危险'))) return criteria
  if (criteria.stay == null && danger(s, null, null) == null) {
    entries.push(['stay', '【安全】原地不动'])
  }
  const safe = entries.filter(([, text]) => text.startsWith('【安全】'))
  return safe.length > 0 ? Object.fromEntries(safe) : criteria
}

/**
 * 问题里直接写出那个方向上子弹会打到什么、只问打不打得中：问「开火有没有用」时远处的 bot
 * 它常判断没用。打砖不在这里问，见 DecisionBrain
 */
function fireQuestion(s: DecisionState, d: Direction): string {
  // 迎面对撞写成事实，问题里再并上「挡掉子弹」，否则模型只按打不打得中 bot 回答
  if (s.incoming.some((b) => b.counter && b.from === d)) {
    return (
      `朝${DIR[d]}开火会迎面撞上飞来的敌方子弹，把它抵消。` +
      '这一枪能挡掉那颗子弹或打中敌方坦克吗？'
    )
  }
  return (
    `朝${DIR[d]}开火会${laneText(s.lanes[d])}。` +
    '这一枪会打中敌方坦克吗？（子弹一直飞到撞上东西为止）'
  )
}

export function buildPrompt(s: DecisionState): DecisionPrompt {
  return {
    text: `${RULES}\n\n局面：\n${describe(s)}\n\n原始数据（你是 me）：\n${rawJson(s)}`,
    questions: {
      action: {
        type: 'choice',
        instructions:
          '你在玩坦克大战，要消灭敌方坦克、保护老鹰。下一步做什么？' +
          // 自保写在最前：只写「消灭 bot」时模型常站在 bot 射线上对射，被先打中
          '先保证自己不被打中：带【危险】的选项会让你被打中，只要有【安全】的选项就不要选它；' +
          '有子弹飞来时先躲开或迎面抵消；决策要约0.2秒才生效，要提前离开敌方坦克的射线。' +
          '有敌方坦克逼近或瞄准老鹰时，先去打它，老鹰被打掉就输了；否则在它打不到你的位置对准它开火最好；对不准时靠近它，但隔开几格，不要贴到它跟前。' +
          // 两个方向概率接近时模型会在相反方向间来回切换，坦克原地抖动
          '不要来回抖动：没有新情况时沿着最近几步的方向继续，不要在相反方向之间来回切换。',
        criteria: actionCriteria(s),
      },
      ...fireQuestions((d) => fireQuestion(s, d)),
      intent: {
        type: 'choice',
        instructions: '你此刻的主要意图是什么？',
        criteria: INTENT_CRITERIA,
      },
    },
  }
}
