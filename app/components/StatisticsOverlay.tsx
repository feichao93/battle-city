import * as React from 'react'
import Text from 'components/Text'
import { Tank } from 'components/tanks'
import { BLOCK_SIZE as B } from 'utils/constants'

// todo 目前只是静态的数据, 需要connect到store, 使用saga来播放动画效果
export default class StatisticsOverlay extends React.PureComponent {
  render() {
    return (
      <g role="statistics-overlay">
        <rect
          fill="#000000"
          x={0}
          y={0}
          width={16 * B}
          height={16 * B}
        />
        <g transform={`translate(${-0.5 * B}, ${-1.5 * B})`}>
          <Text
            content="HI-SCORE"
            x={4.5 * B}
            y={3.5 * B}
            fill="#e44437"
          />
          <Text
            content="20000"
            x={10 * B}
            y={3.5 * B}
            fill="#feac4e"
          />
          <Text
            content="STAGE  test"
            x={6.5 * B}
            y={4.5 * B}
            fill="#ffffff"
          />
          <Text
            content={'\u2160-PLAYER'}
            x={2 * B}
            y={5.5 * B}
            fill="#e44437"
          />
          <Text
            content="3200"
            x={4 * B}
            y={6.5 * B}
            fill="#feac4e"
          />
          <Text
            content={'1800 PTS 18\u2190'}
            x={2 * B}
            y={8 * B}
            fill="white"
          />
          <Tank
            x={8 * B}
            y={7.7 * B}
            color="silver"
            side="ai"
            level="basic"
            direction="up"
            moving={false}
          />
          <Text
            content={'400 PTS  2\u2190'}
            x={2.5 * B}
            y={9.5 * B}
            fill="white"
          />
          <Tank
            x={8 * B}
            y={9.2 * B}
            color="silver"
            side="ai"
            level="fast"
            direction="up"
            moving={false}
          />
          <Text
            content={'  0 PTS  2\u2190'}
            x={2.5 * B}
            y={11 * B}
            fill="white"
          />
          <Tank
            x={8 * B}
            y={10.7 * B}
            color="silver"
            side="ai"
            level="power"
            direction="up"
            moving={false}
          />
          <Text
            content={'  0 PTS  0\u2190'}
            x={2.5 * B}
            y={12.5 * B}
            fill="white"
          />
          <Tank
            x={8 * B}
            y={12.2 * B}
            color="silver"
            side="ai"
            level="armor"
            direction="up"
            moving={false}
          />
          <rect
            x={6.5 * B}
            y={13.3 * B}
            width={4 * B}
            height={2}
            fill="white"
          />
          <Text
            content="TOTAL 20"
            x={3.5 * B}
            y={13.5 * B}
            fill="white"
          />
        </g>
      </g>
    )
  }
}
