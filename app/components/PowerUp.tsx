import * as React from 'react'
import { Bitmap } from 'components/elements'
import registerTick from 'hocs/registerTick'

const colorSchema = {
  ' ': 'none',
  w: '#FFFFFF',
  g: '#ADADAD',
  b: '#00424A',
}

const powerUpDataArray = {
  tank: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbbbbbbbbbbwb',
    'w bbbbbwgg bbbwb',
    'w bwwwwgggb bbwb',
    'w b    gggb bbwb',
    'w bbbwggbbgb bwb',
    'w bggwwwwgggb wb',
    'w b w w w wbg wb',
    'w bbb       bbwb',
    '' // todo 这里还没完成
  ],
  star: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbbbw bbbbbwb',
    'w bbbbwwg bbbbwb',
    'w bbbbwwg bbbbwb',
    'w wwwwwggwwww wb',
    'w bgggwgwggg  wb',
    'w bbgwwwwgg  wbw',
    'w bbwwggwwg bbwb',
    'w bgwgg ggwg bwb',
    'w bwgg   ggw bwb',
    'w bg   bb  g bwb',
    'w b  bbbbbb  bwb',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb '
  ],
  grenade: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbwwwgg bbbwb',
    'w bbbwgb  g bbwb',
    'w bbwgggb  g bwb',
    'w bwgbwgbg g bwb',
    'w bg g  g  g bwb',
    'w bwgbwgbg g bwb',
    'w bg g  g  g bwb',
    'w bwgbwgbg g bwb',
    'w bbgb  g bbbbwb',
    'w bbbwgg bbbbbwb',
    'w bbb   bbbbbbwb',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    '                '
  ],
  timer: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbbwgwg bbbwb',
    'w bbbbg   wg bwb',
    'w bbbgggg    bwb',
    'w bbgwwwwg bbbwb',
    'w bgwwbwwwg bbwb',
    'w bgwwbwwwg bbwb',
    'w bgwwwbwwg bbwb',
    'w b gwwwwg bbbwb',
    'w bb gggg bbbbwb',
    'w bbb    bbbbbwb',
    'w bbbbbbbbbbbbwb',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    '                '
  ],
  helmet: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbbbbbbbbbbwb',
    'w bbbbbbbbbbbbwb',
    'w bbbwwwgg bbbwb',
    'w bbwwggggg bbwb',
    'w bbwgggggg bbwb',
    'w bbggggggg bbwb',
    'w bgggggggg bbwb',
    'w b     gggg bwb',
    'w bbbbbb     bwb',
    'w bbbbbbbbbbbbwb',
    'w bbbbbbbbbbbbwb',
    'w bbbbbbbbbbbbwb',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    '                '
  ],
  shovel: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbbbbbbwbbbwb',
    'w bbbbbbbbwgbbwb',
    'w bbbbbbbbgggbwb',
    'w bbbbbbbw   bwb',
    'w bbbwbbw bbbbwb',
    'w bbwwgw bbbbbwb',
    'w bwwgbw bbbbbwb',
    'w bwgbggg bbbbwb',
    'w bggggg bbbbbwb',
    'w bgggg bbbbbbwb',
    'w b    bbbbbbbwb',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    '                '
  ],
  // todo pistol是高级物品, 目前先暂时不实现相关功能
  // pistol: [
  //   ' wwwwwwwwwwwwwg ',
  //   'w             wb',
  //   'w bbbbbbbbwbbbwb',
  //   'w bwbbbbbbbbbbwb',
  //   'w gwwwwwwwg bbwb',
  //   'w wggggggggg bwb',
  //   'w  ggbbbbbbg bwb',
  //   'w b  ggwggggg wb',
  //   'w bbb g  gwbg wb',
  //   'w bbbb gggwbg wb',
  //   'w bbbbb  gbbg wb',
  //   'w bbbbbbbgggg wb',
  //   'w bbbbbbb    bwb',
  //   'gwwwwwwwwwwwwwgb',
  //   ' bbbbbbbbbbbbbb ',
  //   '                '
  // ]
}

type P = {
  x: number,
  y: number,
  name: PowerUpName,
  tickIndex?: number,
}

export class PowerUpBase extends React.PureComponent<P> {
  render() {
    const { x, y, name, tickIndex } = this.props
    return (
      tickIndex === 0 ?
        <Bitmap x={x} y={y} d={powerUpDataArray[name]} scheme={colorSchema} /> : null
    )
  }
}

const PowerUp: React.ComponentClass<P> = registerTick(400, 800)(PowerUpBase)

export default PowerUp
