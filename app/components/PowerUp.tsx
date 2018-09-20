import React from 'react'
import PowerUpRecord from '../types/PowerUpRecord'
import { Bitmap } from './elements'

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
    'w bbwgggggbb bwb',
    'w bgbg      g wb',
    'w bggwwwwgggb wb',
    'w b w w w wbg wb',
    'w bb ggggggg bwb',
    'w bbb       bbwb',
    'gwwwwwwwwwwwwwwg',
    ' bbbbbbbbbbbbbb ',
    '                ',
  ],
  star: [
    ' wwwwwwwwwwwwwg ',
    'w             wb',
    'w bbbbbw bbbbbwb',
    'w bbbbwwg bbbbwb',
    'w bbbbwwg bbbbwb',
    'w wwwwwggwwww wb',
    'w bgggwgwggg  wb',
    'w bbgwwwwgg  wwb',
    'w bbwwggwwg bbwb',
    'w bgwgg ggwg bwb',
    'w bwgg   ggw bwb',
    'w bg   bb  g bwb',
    'w b  bbbbbb  bwb',
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    '                ',
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
    '                ',
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
    '                ',
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
    'gwwwwwwwwwwwwwgb',
    ' bbbbbbbbbbbbbb ',
    '                ',
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
    '                ',
  ],
  // pistol是高级物品, 目前先暂时不实现相关功能
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

export default class PowerUp extends React.PureComponent<{ powerUp: PowerUpRecord }> {
  render() {
    const {
      powerUp: { visible, x, y, powerUpName },
    } = this.props
    return (
      <Bitmap
        useImage
        style={{ visibility: visible ? 'visible' : 'hidden' }}
        x={x}
        y={y}
        d={powerUpDataArray[powerUpName]}
        scheme={colorSchema}
      />
    )
  }
}
