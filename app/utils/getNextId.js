const map = new Map()

export default function getNextId(tag = '') {
  if (map.has(tag)) {
    const nextId = map.get(tag)
    map.set(tag, nextId + 1)
    return nextId
  } else {
    map.set(tag, 2)
    return 1
  }
}
