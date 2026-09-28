import type { Direction } from '../types'
import type {
  Action,
  DecisionPrompt,
  DecisionQuestion,
  DecisionState,
  FireKey,
  Intent,
} from './decision'

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']
const DIR: Record<Direction, string> = { up: '上', down: '下', left: '左', right: '右' }

/** 游戏规则，策略一、二都发；策略一只有它和原始 JSON，炮口前是什么、谁瞄着谁都要模型自己推 */
export const RULES = `游戏规则（坦克大战）：
- 战场 26×26 格，每格 8 像素。坐标 col 向右增大、row 向下增大，给出的都是左上角；坦克占 2×2 格。
- terrain 每行一个字符串，第 row 行第 col 个字符是那一格：. 空地，# 砖墙，+ 被打掉一部分的砖墙，@ 钢墙，~ 河，: 冰面，% 树林，E 老鹰。
- 坦克只能朝上下左右移动，砖墙、钢墙、河、老鹰和其他坦克挡路；冰面、树林可以通过。
- 开火时子弹从炮口沿坦克当前朝向直线飞行，直到撞上坦克、砖墙、钢墙、老鹰或战场边界。子弹会飞过河和树林。
- 子弹打中砖墙会打掉一块（要打好几枪才能打穿）；打不掉钢墙。打中敌方坦克会消灭它（armor 级要打 4 枪，hp 是剩余次数）。
- 敌方子弹打中你，你就阵亡（helmet 为 true 时无敌）；任何子弹打中老鹰，游戏失败。
- 速度：你每秒移动约 5.6 格；敌方坦克每秒 3.75–7.5 格；子弹每秒飞 15–30 格。你大约每 0.13 秒做一次决策。
- 坦克宽 16 像素，子弹从炮口中线射出：两辆坦克错开半格（8 像素）时，可能一方打得到另一方、另一方却打不到。
- 两颗子弹迎面相撞会一起消失：朝飞来的子弹开火可以挡掉它。
- 你的决策从发出到生效约 0.2 秒：0.2 秒内就会打到你的子弹已经躲不开，要提前离开敌方坦克的射线。
- 选了朝砖墙开动时，会自动边开火边打穿砖墙。
- 开火按方向分别问：坦克转到哪个方向，就按那个方向的回答开火。
- 目标：消灭所有敌方坦克，保护老鹰。`

const ACTION_CRITERIA: Record<Action, string> = {
  move_up: '朝上开动（不朝上时先转过去）',
  move_down: '朝下开动（不朝下时先转过去）',
  move_left: '朝左开动（不朝左时先转过去）',
  move_right: '朝右开动（不朝右时先转过去）',
  face_up: '原地转向朝上，不移动',
  face_down: '原地转向朝下，不移动',
  face_left: '原地转向朝左，不移动',
  face_right: '原地转向朝右，不移动',
  stay: '原地不动',
}

export const INTENT_CRITERIA: Record<Intent, string> = {
  attack: '接近或瞄准敌方坦克',
  defend_eagle: '回防老鹰',
  dodge: '躲避子弹或炮口',
  get_powerup: '去拿道具',
  dig: '打掉挡路的砖',
}

/** 数组每个元素占一行，比 JSON.stringify(_, null, 2) 短得多，terrain 也能按行对齐 */
export function json(value: object): string {
  const lines = Object.entries(value).map(([key, v]) => {
    if (!Array.isArray(v)) return `  "${key}": ${JSON.stringify(v)}`
    if (v.length === 0) return `  "${key}": []`
    return `  "${key}": [\n${v.map((item) => `    ${JSON.stringify(item)}`).join(',\n')}\n  ]`
  })
  return `{\n${lines.join(',\n')}\n}`
}

/** 原始局面 + 历史，策略一、二都发 */
export function rawJson(s: DecisionState): string {
  return json({ ...s.raw, recentActions: s.recentActions, remainingBots: s.remainingBots })
}

/** 每个方向一个 fire 问题，question(d) 给出问题文本 */
export function fireQuestions(
  question: (d: Direction) => string,
): Record<FireKey, DecisionQuestion> {
  return Object.fromEntries(
    DIRECTIONS.map((d) => [`fire_${d}`, { type: 'noul', instructions: question(d) }]),
  ) as Record<FireKey, DecisionQuestion>
}

/** 策略一：规则 + 原始 JSON 作为 state；选项固定 9 个、只写动作本身 */
export function buildRawPrompt(s: DecisionState): DecisionPrompt {
  return {
    text: `${RULES}\n\n当前局面（你是 me）：\n${rawJson(s)}`,
    questions: {
      action: {
        type: 'choice',
        // 策略提示和策略二一致，只比较 state 的形式
        instructions:
          '你在玩坦克大战，要消灭敌方坦克、保护老鹰。下一步做什么？' +
          '有敌方坦克逼近或瞄准老鹰时，先去打它，老鹰被打掉就输了；否则在它打不到你的位置对准它开火最好；对不准时靠近它，但隔开几格，不要贴到它跟前。' +
          '不要来回抖动：没有新情况时沿着最近几步的方向继续，不要在相反方向之间来回切换。',
        criteria: ACTION_CRITERIA,
      },
      ...fireQuestions(
        (d) => `朝${DIR[d]}开火，这一枪会打中敌方坦克吗？（子弹一直飞到撞上东西为止）`,
      ),
      intent: {
        type: 'choice',
        instructions: '你此刻的主要意图是什么？',
        criteria: INTENT_CRITERIA,
      },
    },
  }
}
