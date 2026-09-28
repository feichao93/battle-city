import { useState } from 'react'
import { ACTIONS, INTENTS, type DecisionAnswers } from '../engine/ai/decision'
import { digDirection } from '../engine/ai/prompt'
import type { Direction } from '../engine/types'
import { useDecisionLog, type DecisionRecord } from './decisionLog'
import { useUIStore } from './store'

export const DECISION_PANEL_WIDTH = 420
/** 只显示最近这么多条 */
const VISIBLE_RECORDS = 10

const COLORS = {
  bg: '#15171a',
  panel: '#1e2126',
  border: '#2e333a',
  text: '#d6d9dd',
  muted: '#8a9099',
  accent: '#58a6ff',
  good: '#3fb950',
  warn: '#d29922',
  bad: '#f85149',
}

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']
const DIR_TEXT: Record<Direction, string> = { up: '上', down: '下', left: '左', right: '右' }

const PLAYER_COLOR = ['#e3b341', '#3fb950']

const pct = (v: number) => `${Math.round(v * 100)}%`

/** 右侧面板：决策模型每次请求的输入、输出、概率分布和延迟 */
export default function DecisionPanel() {
  const enabled = useUIStore((s) => s.autopilot)
  const liveRecords = useDecisionLog((s) => s.records)
  const stats = useDecisionLog((s) => s.stats)
  const [frozen, setFrozen] = useState<DecisionRecord[] | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  // 请求中的不显示：它们一出一进会让列表每次决策跳两下
  const records = (frozen ?? liveRecords)
    .filter((r) => r.status !== 'pending')
    .slice(0, VISIBLE_RECORDS)
  // 最新一条已返回的决策展开概率条，更早的收成一行；点开的那条额外显示发给模型的内容
  const latest = records.find((r) => r.status === 'ok')?.id

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: DECISION_PANEL_WIDTH,
        overflowY: 'auto',
        background: COLORS.bg,
        color: COLORS.text,
        borderLeft: `1px solid ${COLORS.border}`,
        font: '11px/1.45 Menlo, Consolas, monospace',
        zIndex: 200,
        lineHeight: 1.45,
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: COLORS.bg,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '8px 10px',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 12 }}>decision-model-preview</strong>
          <span style={{ flex: 1 }} />
          <button onClick={() => setFrozen(frozen == null ? liveRecords : null)} style={button}>
            {frozen == null ? '冻结列表' : '恢复实时'}
          </button>
          <button onClick={() => useDecisionLog.getState().clear()} style={button}>
            清空
          </button>
        </div>
        {!enabled && (
          <div style={{ color: COLORS.warn, marginTop: 4 }}>托管未开启（Options 页）</div>
        )}
        {Object.entries(stats).map(([player, s]) => {
          const done = s.requests - pendingCount(liveRecords, Number(player))
          return (
            <div key={player} style={{ marginTop: 4 }}>
              <span style={{ color: PLAYER_COLOR[Number(player)] }}>P{Number(player) + 1}</span>{' '}
              请求 {s.requests} · 出错{' '}
              <span style={{ color: s.errors > 0 ? COLORS.bad : COLORS.muted }}>{s.errors}</span> ·
              平均往返 {done > 0 ? Math.round(s.totalRtt / done) : '-'}ms
            </div>
          )
        })}
      </header>
      {records.length === 0 && (
        <div style={{ padding: 10, color: COLORS.muted }}>
          还没有决策。玩家空闲一会儿后进入托管。
        </div>
      )}
      {records.map((r) => (
        <RecordItem
          key={r.id}
          record={r}
          bars={r.id === latest || expanded === r.id}
          open={expanded === r.id}
          onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
        />
      ))}
    </aside>
  )
}

function pendingCount(records: DecisionRecord[], player: number): number {
  return records.filter((r) => r.player === player && r.status === 'pending').length
}

function RecordItem({
  record,
  bars,
  open,
  onToggle,
}: {
  record: DecisionRecord
  bars: boolean
  open: boolean
  onToggle: () => void
}) {
  const { answers } = record
  const dig = answers == null ? null : digDirection(answers.action.choice, record.state)
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '6px 10px' }}>
      <div onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', gap: 8 }}>
        <span style={{ color: PLAYER_COLOR[record.player] }}>P{record.player + 1}</span>
        <span style={{ color: COLORS.muted }}>#{record.id}</span>
        <span>t={(record.time / 1000).toFixed(1)}s</span>
        <span style={{ flex: 1 }} />
        {record.rtt != null && (
          <span style={{ color: COLORS.muted }}>
            往返 {record.rtt}ms
            {record.latency != null && ` · 服务端 ${Math.round(record.latency)}ms`}
          </span>
        )}
        <span style={{ color: COLORS.muted }}>{open ? '▾' : '▸'}</span>
      </div>
      {record.status === 'error' && (
        <div style={{ color: COLORS.bad, marginTop: 4 }}>✗ {record.error}</div>
      )}
      {answers != null && !bars && <Summary answers={answers} dig={dig} />}
      {answers != null && bars && (
        <div style={{ marginTop: 4 }}>
          <Choice
            label="action"
            options={ACTIONS}
            chosen={answers.action.choice}
            confidence={answers.action.confidence}
            probabilities={answers.action.probabilities}
          />
          <Fire answers={answers} state={record.state} dig={dig} />
          <Choice
            label="intent"
            options={INTENTS}
            chosen={answers.intent.choice}
            confidence={answers.intent.confidence}
            probabilities={answers.intent.probabilities}
          />
        </div>
      )}
      {open && <Details record={record} />}
    </div>
  )
}

function Summary({ answers, dig }: { answers: DecisionAnswers; dig: Direction | null }) {
  const fireAt = DIRECTIONS.filter((d) => answers[`fire_${d}`].noul > 0.5)
  return (
    <div style={{ marginTop: 2, display: 'flex', gap: 10 }}>
      <span>
        <strong style={{ color: COLORS.accent }}>{answers.action.choice}</strong>{' '}
        <span style={{ color: COLORS.muted }}>{pct(answers.action.confidence)}</span>
      </span>
      <span style={{ color: fireAt.length > 0 ? COLORS.bad : COLORS.muted }}>
        {fireAt.length > 0 ? `FIRE ${fireAt.map((d) => DIR_TEXT[d]).join('')}` : 'hold'}
        {dig != null && ` · 朝${DIR_TEXT[dig]}打砖`}
      </span>
      <span style={{ color: COLORS.muted }}>{answers.intent.choice}</span>
    </div>
  )
}

function Choice<T extends string>({
  label,
  options,
  chosen,
  confidence,
  probabilities,
}: {
  label: string
  options: readonly T[]
  chosen: T
  confidence: number
  probabilities: Partial<Record<T, number>>
}) {
  return (
    <div style={{ marginTop: 4 }}>
      <div>
        <span style={{ color: COLORS.muted }}>{label}</span>{' '}
        <strong style={{ color: COLORS.accent }}>{chosen}</strong>{' '}
        <span style={{ color: COLORS.muted }}>confidence {confidence.toFixed(2)}</span>
      </div>
      {options.map((option) => (
        <Bar
          key={option}
          label={option}
          value={probabilities[option] ?? null}
          color={option === chosen ? COLORS.accent : COLORS.muted}
        />
      ))}
    </div>
  )
}

/** 四个方向各自的 P(yes)；坦克转到哪个方向就按哪一条开火 */
function Fire({
  answers,
  state,
  dig,
}: {
  answers: DecisionAnswers
  state: DecisionRecord['state']
  dig: Direction | null
}) {
  return (
    <div style={{ marginTop: 4 }}>
      <span style={{ color: COLORS.muted }}>fire（当前朝{DIR_TEXT[state.me.facing]}）</span>
      {dig != null && (
        <span style={{ color: COLORS.warn }}> · 朝{DIR_TEXT[dig]}开动撞砖，转过去后开火打砖</span>
      )}
      {DIRECTIONS.map((d) => {
        const p = answers[`fire_${d}`].noul
        return (
          <Bar
            key={d}
            label={`${d === state.me.facing ? '▸' : ' '}${d} · ${state.lanes[d].hit}`}
            value={p}
            color={p > 0.5 ? COLORS.bad : COLORS.muted}
          />
        )
      })}
    </div>
  )
}

/** value 为 null：本次没给这个选项；照样占一行，免得面板高度跟着选项数跳 */
function Bar({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 14 }}>
      <span
        style={{
          width: 100,
          color: COLORS.muted,
          flexShrink: 0,
          whiteSpace: 'pre',
          opacity: value == null ? 0.4 : 1,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, background: COLORS.panel, height: 8, position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: pct(value ?? 0),
            background: color,
          }}
        />
      </span>
      <span
        style={{ width: 34, textAlign: 'right', color: value == null ? COLORS.muted : undefined }}
      >
        {value == null ? '—' : pct(value)}
      </span>
    </div>
  )
}

function Details({ record }: { record: DecisionRecord }) {
  const { text, questions } = record.prompt
  const { map, ...rest } = record.state
  const criteria = questions.action.type === 'choice' ? questions.action.criteria : {}
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ color: COLORS.muted }}>发给模型的 state</div>
      <pre style={{ ...pre, whiteSpace: 'pre-wrap', letterSpacing: 0, lineHeight: 1.45 }}>
        {text}
      </pre>
      <div style={{ color: COLORS.muted }}>action 选项</div>
      <pre style={{ ...pre, whiteSpace: 'pre-wrap', letterSpacing: 0, lineHeight: 1.45 }}>
        {Object.entries(criteria)
          .map(([k, v]) => `${k}：${v}`)
          .join('\n')}
      </pre>
      <div style={{ color: COLORS.muted }}>fire 问题</div>
      <pre style={{ ...pre, whiteSpace: 'pre-wrap', letterSpacing: 0, lineHeight: 1.45 }}>
        {DIRECTIONS.map((d) => questions[`fire_${d}`].instructions).join('\n')}
      </pre>
      <div style={{ color: COLORS.muted }}>地图（M 是自己，只给人看）</div>
      <pre style={pre}>{map.join('\n')}</pre>
      <div style={{ color: COLORS.muted }}>结构化特征</div>
      <pre style={pre}>{JSON.stringify(rest, null, 1)}</pre>
      {record.requestId != null && (
        <div style={{ color: COLORS.muted }}>request_id {record.requestId}</div>
      )}
    </div>
  )
}

const button: React.CSSProperties = {
  background: COLORS.panel,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 4,
  font: 'inherit',
  padding: '2px 8px',
  cursor: 'pointer',
}

const pre: React.CSSProperties = {
  margin: '2px 0 6px',
  padding: 6,
  background: COLORS.panel,
  border: `1px solid ${COLORS.border}`,
  font: '11px/1.15 Menlo, Consolas, monospace',
  letterSpacing: 1,
  overflowX: 'auto',
  whiteSpace: 'pre',
}
