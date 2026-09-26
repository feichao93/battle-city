// HUD 用的小图标。

/** 玩家命数前的小坦克缩略图（8×8） */
export function PlayerTankThumbnail({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x},${y})`}
      fill="#9c4a00"
      d="M1,1 h1 v2 h1 v-1 h1 v-1 h-1 v-1 h3 v1 h-1 v1 h1 v1 h1 v-2 h1 v7 h-1 v-2 h-1 v-2 h-1 v-1 h-1 v1 h-1 v1 h1 v1 h1 v-1 h1 v2 h-1 v1 h-1 v-1 h-1 v-1 h-1 v2 h-1 v-7"
    />
  )
}

/** 剩余敌人数量指示用的小坦克（8×8） */
function BotTankThumbnail({ x, y }: { x: number; y: number }) {
  return (
    <g fill="#000000" transform={`translate(${x},${y})`}>
      <rect x={1} y={1} width={1} height={6} />
      <rect x={7} y={1} width={1} height={6} />
      <rect x={2} y={3} width={5} height={2} />
      <rect x={3} y={2} width={3} height={4} />
      <rect x={4} y={1} width={1} height={6} />
      <rect x={3} y={7} width={3} height={1} />
      <rect x={4} y={3} width={1} height={2} fill="#6B0800" />
    </g>
  )
}

/** 剩余敌人数量指示器：每个敌人一辆小坦克，两列自上而下排布 */
export function BotCountIndicator({
  count,
  x = 0,
  y = 0,
}: {
  count: number
  x?: number
  y?: number
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {Array.from({ length: count }).map((_, t) => (
        <BotTankThumbnail key={t} x={8 * (t % 2)} y={8 * Math.floor(t / 2)} />
      ))}
    </g>
  )
}
