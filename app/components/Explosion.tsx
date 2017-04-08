/* eslint-disable react/no-multi-comp */
import * as React from 'react'
import { Bitmap } from 'components/elements'
import registerTick from 'hocs/registerTick'
import { ExplosionType } from 'types'

const schema = {
  ' ': 'none',
  W: '#fffffe',
  P: '#590d79',
  R: '#b53121',
}

const bulletExplosiondataArray = [
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

type P = {
  x: number,
  y: number,
  tickIndex?: number,
}

class BulletExplosionClass extends React.PureComponent<P, {}> {
  render() {
    const { x, y, tickIndex } = this.props
    return (
      <Bitmap
        x={x}
        y={y}
        d={bulletExplosiondataArray[tickIndex]}
        scheme={schema}
      />
    )
  }
}

export const BulletExplosion: React.ComponentClass<P> = registerTick(66, 66, 9999)(BulletExplosionClass)

const tankExplosionDataArray = [
  [
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
  [
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
]

class TankExplosionClass extends React.PureComponent<P, {}> {
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
        d={tankExplosionDataArray[tickIndex]}
        scheme={schema}
      />
    )
  }
}

const TankExplosion: React.ComponentClass<P> = registerTick(200, 9999)(TankExplosionClass)

export default class Explosion extends React.PureComponent<{ explosionType: ExplosionType } & P, {}> {
  render() {
    const { explosionType, ...otherProps } = this.props
    if (explosionType === 'bullet') {
      return <BulletExplosion {...otherProps} />
    } else if (explosionType === 'tank') {
      return <TankExplosion {...otherProps} />
    } else {
      return null
    }
  }
}
