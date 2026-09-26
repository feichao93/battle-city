import { path } from './draw'

// 头盔护盾 16×16：一个角的 path 旋转 4 次拼成，两帧交替。抄 app/components/TankHelmet.tsx
const CORNERS = [
  'M0,8 v-2 h1 v-1 h1 v-1 h2 v-2 h1 v-1 h1 v-1 h2 v1 h-2 v1 h-1 v2 h-1 v1 h-2 v1 h-1 v2 h-1',
  'M0,2 h1 v-1 h1 v-1 h2 v1 h1 v1 h2 v1 h1 v1 h-1 v-1 h-2 v-1 h-1 v-1 h-2 v1 h-1 v2 h1 v1 h1 v2 h1 v1 h-1 v-1 h-1 v-2 h-1 v-1 h-1 v-2',
]

export function drawHelmet(ctx: CanvasRenderingContext2D, index: 0 | 1): void {
  const transforms: [number, number, number][] = [
    [0, 0, 0],
    [16, 0, 90],
    [16, 16, 180],
    [0, 16, 270],
  ]
  for (const [dx, dy, deg] of transforms) {
    ctx.save()
    ctx.translate(dx, dy)
    ctx.rotate((deg * Math.PI) / 180)
    path(ctx, CORNERS[index], '#ffffff')
    ctx.restore()
  }
}
