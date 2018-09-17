import { Record } from 'immutable'

const TankRecordType = Record({
  active: true,
  tankId: 0,
  x: 0,
  y: 0,
  side: 'human' as Side,
  direction: 'up' as Direction,
  moving: false,
  level: 'basic' as TankLevel,
  color: 'auto' as TankColor,
  hp: 1,
  withPowerUp: false,

  // 坦克转弯预留位置的坐标
  rx: 0,
  ry: 0,

  // helmetDuration用来记录tank的helmet的剩余的持续时间
  helmetDuration: 0,
  // frozenTimeout小于等于0表示可以进行移动, 大于0表示还需要等待frozen毫秒才能进行移动, 坦克转向不受影响
  frozenTimeout: 0,
  // cooldown小于等于0表示可以进行开火, 大于0表示还需要等待cooldown毫秒才能进行开火
  cooldown: 0,
  // human tank被队友击中时无法移动，此时坦克会闪烁，该变量用来记录坦克是否可见
  visible: true,
})

export default class TankRecord extends TankRecordType {
  static fromJS(object: any) {
    return new TankRecord(object)
  }

  useReservedXY() {
    return this.merge({ x: this.rx, y: this.ry })
  }
}
