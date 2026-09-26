/** 分数右对齐到 6 位，与原版标题页的排版一致 */
export function formatScore(score: number): string {
  return String(score === 0 ? '00' : score).padStart(6, ' ')
}
