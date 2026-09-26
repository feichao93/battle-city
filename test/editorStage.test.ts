import { describe, expect, it } from 'vitest'
import { parseStage } from '../src/engine/map/parseStage'
import { stages } from '../src/stages'
import {
  editorToRaw,
  emptyEditorStage,
  rawToEditor,
  type MapItem,
} from '../src/ui/editor/editorStage'

describe('editorStage', () => {
  it('内置关卡经编辑器往返后地形与敌人不变', () => {
    for (const stage of stages) {
      const roundTrip = editorToRaw(rawToEditor(stage))
      const { name: _a, ...expected } = parseStage(stage)
      const { name: _b, ...actual } = parseStage(roundTrip)
      expect(actual, `stage ${stage.name}`).toEqual(expected)
    }
  })

  it('砖 / 钢按象限序列化，空象限的砖钢写成 X', () => {
    const stage = emptyEditorStage()
    const items: MapItem[] = [...stage.items]
    items[0] = { type: 'B', hex: 0b0101 }
    items[1] = { type: 'T', hex: 0xf }
    items[2] = { type: 'B', hex: 0 }
    items[12 * 13 + 6] = { type: 'E', hex: 0xf }
    const raw = editorToRaw({ ...stage, name: 'My-1', items })

    expect(raw.name).toBe('my-1')
    expect(raw.map[0].split(/ +/).slice(0, 3)).toEqual(['B5', 'Tf', 'X'])
    expect(raw.map[12].split(/ +/)[6]).toBe('E')
    expect(raw.bots).toEqual(['10*basic', '4*fast', '4*power', '2*armor'])
    expect(rawToEditor(raw).items[0]).toEqual({ type: 'B', hex: 0b0101 })
  })

  it('不足 4 组的敌人配置补齐为 count 0', () => {
    const raw = editorToRaw(emptyEditorStage())
    const editor = rawToEditor({ ...raw, bots: ['20*fast'] })
    expect(editor.bots).toEqual([
      { tankLevel: 'fast', count: 20 },
      { tankLevel: 'basic', count: 0 },
      { tankLevel: 'basic', count: 0 },
      { tankLevel: 'basic', count: 0 },
    ])
  })
})
