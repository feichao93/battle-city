import React from 'react'
import { ExplosionRecord } from '../types'
import { Bitmap } from './elements'

const schema = {
  ' ': 'none',
  W: '#fffffe',
  P: '#590d79',
  R: '#b53121',
}

const data = {
  s0: [
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

  s1: [
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

  s2: [
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
  b0: [
    '                                ',
    '                     W       W  ',
    '  W       W          W       W  ',
    '   W  W  W   PPP WWP  W     W   ',
    '    P  W   WWWPPPWWPP W W  P    ',
    '     W P  WPWWW W  WPPW W WW    ',
    '      W   WWPW WPPP WWWW W      ',
    '    WW   WWWWWWWWWPWWWWWW W     ',
    '       PPPW  WWWPWWPWW PW    PW ',
    '      WPPPWWWWWPWW WW WWPW   W  ',
    'P    WW WPWWWRWWRWWWPWWWPWWW    ',
    ' WP PW WWWRRWWWWRPWWWPWPW WPW   ',
    '  W WW WWWWRRWRWRWWRRPWW WPPW   ',
    ' W   WW WPWRWRRRRRRWRWWWW WW    ',
    '  W WPWWPPWWRWRWWRWRPWWWWW WW   ',
    '    PP PWPWWRRWP WRWWWW W WPP   ',
    '      WWPWRRRW WPW RW PWWW PP   ',
    '     WWWWWWWRRWRPRRRWPPPWWWP  W ',
    '     WW WWWWRWRRPRWWRWW WWPP   W',
    '    PW WWPWRWWWRWRPWWWWWPPPP    ',
    '    PPWPPPWWWWPRRWWWWPWWW P W   ',
    '  W  PPPPWWWWPPWRWWWWWPWW WW    ',
    '   W    PW WPPWWWW WW PW WP     ',
    '        WW WWW WWWW  PPWWPP     ',
    '      WP WW W PPWWWWPPWW P      ',
    '     P W WWWWWPP  PPP W W WW    ',
    '    W      PPPP         W  P    ',
    '   W     W        W  W     WP   ',
    '  P        W       PWP      WP  ',
    '  W                W W       W  ',
    '                                ',
    '                                ',
  ],
  b1: [
    'W                               ',
    'PW   W             PPWW       W ',
    ' PW   P     WPPP PWWWWPP    WP  ',
    '  PP    WW WWWP PWWW  WPP  WP   ',
    '   PP  WPWWWRWWW WW WP WPP  P   ',
    '   P  WWPPRPWWWWWWWWWWP WP      ',
    '      WPWWWWPWWWWWWPPWW WP WW   ',
    '    PPWWWWWWWWWPPWWWWPWWWPPWWP  ',
    '    PWWWW WPPWWWWPWWWWWWPPWWPPP ',
    '     WW  WWWWWRWWWWRWWWWPWW WPP ',
    '   WWW WWWRWWWRRWWRRWRWPWWWW WP ',
    '  PWWWWWWWRRRWRWRRRWRWWWWPWW WPW',
    '  WPWW WWWR RRWPRRWRWWWWWPW WPPP',
    '   PW PWWWWRWWR RWRWWWRWPW WPPW ',
    '   PP PWWWWRRRRWPRRRWRWWWWWWP   ',
    ' W WWW PWRRRRRWWW WRWWWWWWPPWW  ',
    ' WWWWWWWWWWRRP WWRRRRWWWWPWWWPP ',
    'WWWRPWWWWRWRWWRPWWR WRRRWWWWWWP ',
    'WWWWPWWWRWWRRRR RRWRWWWWWWW WWPW',
    'PWWPWRWWWWRRWRRWRRRRWWWWWPWW WWP',
    'PPPPWWPPWRRPPWRRRWWRRWWPPWWWW W ',
    ' PP WWWWWWWWWWRWWWWWWRWWWPWW WPW',
    '     WWWWWWWPWWWWWWPWWWWWWWWW WP',
    '    WW WW WWWWWWW PP WWWWWWWPWPW',
    '    WWW  PPWWWPWWW  WWWP WW  PWW',
    '    WWWWWWPPWWW WWWWPWWPP  WPPW ',
    '    PWWWWP WWWW WWWPPPWWPPPPPW  ',
    '  W  PWPP  PPPWW PPP WRWWPPW    ',
    '   W  PP      WWW   WWWPP    W  ',
    '  P P     WP   WWWWWWWPPW  P P  ',
    ' W  P       W   WWPPWPPP    P W ',
    'W          W     PPP P         P',
  ],
}

export default class Explosion extends React.PureComponent<{ explosion: ExplosionRecord }> {
  render() {
    const {
      explosion: { cx, cy, shape },
    } = this.props
    const smallShape = shape === 's0' || shape === 's1' || shape === 's2'
    return (
      <Bitmap
        useImage
        x={cx - (smallShape ? 8 : 16)}
        y={cy - (smallShape ? 8 : 16)}
        d={data[shape]}
        scheme={schema}
      />
    )
  }
}
