import { BLOCK_SIZE as B } from '../../engine/constants'
import PixelText from '../pixel/PixelText'
import Screen from '../pixel/Screen'
import StagePreview from '../pixel/StagePreview'
import { useMenuKeys } from '../menuKeys'
import TextButton from '../pixel/TextButton'
import useHelp from '../pixel/useHelp'
import { push, replace, stagePath } from '../router'
import { allStages, useUIStore } from '../store'

/** 选关轮播：忠实还原旧项目 ChooseStageScene（prev/cur/next 预览 + 左右/开火）。 */
export default function ChooseStage({ stageName, multi }: { stageName: string; multi: boolean }) {
  const customStages = useUIStore((s) => s.customStages)
  const stages = allStages(customStages)
  const index = stages.findIndex((s) => s.name === stageName)

  // 选关只替换当前历史记录，浏览器后退直接回到标题页
  const choose = (i: number) => replace(stagePath('choose', stages[i].name, multi))
  const prev = () => index > 0 && choose(index - 1)
  const next = () => index < stages.length - 1 && choose(index + 1)
  const play = () => push(stagePath('stage', stageName, multi))
  const back = () => replace('/')
  const help = useHelp([
    [
      {
        rows: [
          ['left/right', 'choose stage'],
          ['fire', 'start'],
          ['esc', 'back'],
        ],
      },
    ],
  ])

  useMenuKeys((key) => {
    if (key === 'left') prev()
    else if (key === 'right') next()
    else if (key === 'confirm') play()
    else if (key === 'back') back()
  })

  const stage = stages[index]
  return (
    <Screen background="#333">
      <PixelText content="choose stage:" x={0.5 * B} y={0.5 * B} />
      <StagePreview
        stage={index === 0 ? null : stages[index - 1]}
        x={0.75 * B}
        y={4.375 * B}
        scale={1 / 4}
      />
      <StagePreview stage={stage} x={4.75 * B} y={2.75 * B} scale={1 / 2} />
      <StagePreview
        stage={index + 1 < stages.length ? stages[index + 1] : null}
        x={12 * B}
        y={4.375 * B}
        scale={1 / 4}
      />
      <PixelText content={`stage ${stage.name}`} x={6.5 * B} y={9.75 * B} />
      <g transform={`translate(${2.5 * B}, ${12 * B})`}>
        <TextButton content="prev" disabled={index === 0} x={0} y={0} onClick={prev} />
        <TextButton
          content="next"
          disabled={index === stages.length - 1}
          x={3 * B}
          y={0}
          onClick={next}
        />
        <TextButton content="play" stroke="#96d332" x={6 * B} y={0} onClick={play} />
        <TextButton content="back" x={9 * B} y={0} onClick={back} />
      </g>
      {help.button}
      {help.overlay}
    </Screen>
  )
}
