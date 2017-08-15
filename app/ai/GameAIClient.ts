import { List } from 'immutable'
import { compose } from 'redux'
import { EagleRecord, MapRecord, TankRecord, TanksMap } from 'types'

type ResolveFn = (value?: any) => void

export default class GameAIClient {
  private pendingNotes = {
    'bullet-complete': [] as ResolveFn[],
    reach: [] as ResolveFn[],
  }

  private pendingQueries = {
    'my-tank-info': [] as ResolveFn[],
    'map-info': [] as ResolveFn[],
    'tanks-info': [] as ResolveFn[],
    'my-fire-info': [] as ResolveFn[],
  }

  post = self.postMessage.bind(self) as (msg: AICommand) => void

  onMessage = (event: MessageEvent) => {
    const d: Note = event.data
    if (d.type === 'query-result') {
      const fns = this.pendingQueries[d.result.type]
      this.pendingQueries[d.result.type] = []
      fns.forEach(fn => fn(d.result))
    } else {
      const fns = this.pendingNotes[d.type]
      this.pendingNotes[d.type] = []
      fns.forEach(fn => fn(d))
    }
  }

  constructor() {
    self.addEventListener('message', this.onMessage)
  }

  queryMyTank() {
    return new Promise<TankRecord>(resolve => {
      this.post({ type: 'query', query: 'my-tank' })
      this.pendingQueries['my-tank-info'].push(compose(resolve,
        (result: QueryResult.MyTankInfo) => (
          TankRecord(result.tank)
        )))
    })
  }

  queryMyFireInfo() {
    return new Promise<QueryResult.MyFireInfo>(resolve => {
      this.post({ type: 'query', query: 'my-fire-info' })
      this.pendingQueries['my-fire-info'].push(resolve)
    })
  }

  queryMapInfo() {
    return new Promise<MapRecord>(resolve => {
      this.post({ type: 'query', query: 'map' })
      this.pendingQueries['map-info'].push(compose(resolve,
        (result: QueryResult.MapInfo) => (
          MapRecord(result.map as any)
            .update('eagle', EagleRecord)
            .update('bricks', List)
            .update('steels', List)
            .update('rivers', List)
            .update('snows', List)
            .update('forests', List)
        )))
    })
  }

  queryTanksInfo() {
    return new Promise<TanksMap>(resolve => {
      this.post({ type: 'query', query: 'tanks' })
      this.pendingQueries['tanks-info'].push(compose(resolve,
        (result: QueryResult.TanksInfo) => (
          List(result.tanks)
            .toMap()
            .map(TankRecord)
            .mapKeys((_, t) => t.tankId)
        )
      ))
    })
  }

  noteBulletComplete() {
    return new Promise(resolve => {
      this.pendingNotes['bullet-complete'].push(resolve)
    })
  }

  noteReach() {
    return new Promise(resolve => {
      this.pendingNotes['reach'].push(resolve)
    })
  }
}
