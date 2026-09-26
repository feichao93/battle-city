import type { ExplosionShape } from '../../engine/types'
import { bitmap, type ColorScheme } from './draw'

// 爆炸字符网格，坐标抄 app/components/Explosion.tsx
const scheme: ColorScheme = { ' ': 'none', W: '#fffffe', P: '#590d79', R: '#b53121' }

// 小爆炸 16×16（子弹命中）
const SMALL: Record<'s0' | 's1' | 's2', string[]> = {
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
}

// 大爆炸 32×32（坦克/道具），仅前两帧 b0/b1
const BIG: Record<'b0' | 'b1', string[]> = {
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

/** 爆炸 shape 对应的纹理边长 */
export function explosionSize(shape: ExplosionShape): number {
  return shape === 'b0' || shape === 'b1' ? 32 : 16
}

export function drawExplosion(ctx: CanvasRenderingContext2D, shape: ExplosionShape): void {
  if (shape === 'b0' || shape === 'b1') {
    bitmap(ctx, BIG[shape], scheme)
  } else {
    bitmap(ctx, SMALL[shape], scheme)
  }
}
