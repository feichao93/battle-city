import { Record } from 'immutable'

const ExplosionRecordBase = Record({
  explosionId: 0 as ExplosionId,
  shape: 's0' as ExplosionShape,
  // 爆炸中心的位置, 因为爆炸形状改变的时候, 爆炸中心的坐标保持不变, 所以使用cx/cy比较合理
  cx: 0,
  cy: 0,
})

export default class ExplosionRecord extends ExplosionRecordBase {
  static fromJS(object: any) {
    return new ExplosionRecord(object)
  }
}
