import { Record } from 'immutable'
import { SIDE } from 'utils/constants'

const BulletRecord = Record({
  direction: null,
  side: SIDE.PLAYER,
  speed: 0,
  x: 0,
  y: 0,
  // todo 目前每个坦克只能发射一个子弹, 所以现在可以使用子弹的owner来唯一标识子弹
  owner: null,
})

export default BulletRecord
