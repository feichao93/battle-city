import { List } from 'immutable'
import { put, select } from 'redux-saga/effects'
import { State } from '../reducers'
import { default as StageConfig, RawStageConfig, StageConfigConverter } from '../types/StageConfig'
import * as actions from '../utils/actions'

function getStageNameList(stageList: List<StageConfig | RawStageConfig>) {
  if (stageList.isEmpty()) {
    return 'empty'
  } else {
    return stageList.map(s => s.name).join(',')
  }
}

const key = 'custom-stages'

/** 将自定义关卡保存到 localStorage 中 */
export function* syncTo() {
  DEV.LOG && console.log('Sync custom stages to localStorage')
  const { stages }: State = yield select()
  const customStages = stages.filter(s => s.custom)
  if (customStages.isEmpty()) {
    localStorage.removeItem(key)
  } else {
    const stageList = customStages.map(StageConfigConverter.s2r)
    DEV.LOG && console.log('Saved stages:', getStageNameList(stageList))
    const content = JSON.stringify(stageList)
    localStorage.setItem(key, content)
  }
}

/** 从 localStorage 中读取自定义关卡信息 */
export function* syncFrom() {
  try {
    DEV.LOG && console.log('Sync custom stages from localStorage')
    const content = localStorage.getItem(key)
    const stageList = List(JSON.parse(content)).map(StageConfigConverter.r2s)
    DEV.LOG && console.log('Loaded stages:', getStageNameList(stageList))
    yield* stageList.map(stage => put(actions.setCustomStage(stage)))
  } catch (e) {
    console.error(e)
    localStorage.removeItem(key)
  }
}
