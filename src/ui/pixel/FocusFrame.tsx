/** 键盘焦点框：虚线描边一组控件（卡片、标签组等），单个按钮用 TextButton 的 focused */
export default function FocusFrame({
  x,
  y,
  width,
  height,
}: {
  x: number
  y: number
  width: number
  height: number
}) {
  return (
    <rect
      x={x + 0.5}
      y={y + 0.5}
      width={width - 1}
      height={height - 1}
      fill="none"
      stroke="#9ed046"
      strokeDasharray="2"
      style={{ pointerEvents: 'none' }}
    />
  )
}
