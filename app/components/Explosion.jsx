import React from 'react'
import { Bitmap } from 'components/elements'
import registerTick from 'hocs/registerTick'

const schema = {
  ' ': 'none',
  W: '#FFFFFF',
  P: '#590D79',
  R: '#B53121',
}

const dataArray = [
  [
    '                ',
    '                ',
    '       W     W  ',
    '   W   W  W W   ',
    '   PWW PW WWP   ',
    '    PPWWPPWP    ',
    '     PWRWRWPWW  ',
    '   WWWPWR RPP   ',
    '     PW RRWP    ',
    '     WWRWPRWP   ',
    '    WP WPWWPWP  ',
    '   WP PW PW  W  ',
    '      W   P     ',
    '                ',
    '                ',
  ],
  [
    '                ',
    '      P   W     ',
    ' W  P WP WP   W ',
    ' PWW  PW WP WWP ',
    '  PPWPPWWWPWPP  ',
    '   PWRWWWPRWW P ',
    ' P  PWR RWWPP   ',
    '   WWWWRRR PWWW ',
    'WW WPW RR WWPP  ',
    '  PPWWPRRRWPP P ',
    '    WRWP PWRW   ',
    '  P PWRWWWRPWW  ',
    '   PWPWPPWW PPW ',
    '   WPPWP PW   P ',
    '  WP  W P PP    ',
    '                ',
  ],
  [
    '    P P    P  P ',
    ' W   W  W P  WP ',
    ' PPWW  WW   WP  ',
    '  PPWPPWPP WWP  ',
    '   PRWWWWPWWPP P',
    ' W PWWRW WWRP   ',
    'WWWW WR  RWWWWWW',
    ' PPPWWPR RWPPP  ',
    '   PPP WR PPWW  ',
    ' WPPWWPW WRWPPW ',
    '  WWWRWPWPWW    ',
    ' PWPPWPWWPPWW P ',
    ' WP  P PWP PPW  ',
    'WP  P   W    PW ',
    '        W P   P ',
  ],
]

@registerTick(66, 66, 9999)
export default class Explosion extends React.PureComponent {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    tickIndex: React.PropTypes.number.isRequired,
  }

  render() {
    const { x, y, tickIndex } = this.props
    return (
      <Bitmap
        x={x}
        y={y}
        d={dataArray[tickIndex]}
        scheme={schema}
      />
    )
  }
}
