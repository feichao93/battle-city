/** 按时间播放、播完即移除的实体（爆炸、分数弹出） */
export interface Animation {
  advance(delta: number): void
  done: boolean
}

/** 推进所有动画并移除已结束的（in-place） */
export function updateAnimations(items: Animation[], delta: number): void {
  for (const item of items) {
    item.advance(delta)
  }
  let w = 0
  for (let r = 0; r < items.length; r += 1) {
    if (!items[r].done) {
      items[w++] = items[r]
    }
  }
  items.length = w
}
