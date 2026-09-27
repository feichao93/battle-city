import { useLayoutEffect } from 'react'
import type { RawStageConfig } from '../engine/types'
import Lobby from '../lan/Lobby'
import GameCanvas from './GameCanvas'
import { GALLERY_TABS, replace, stagePath, useRoute, type Route } from './router'
import ChooseStage from './screens/ChooseStage'
import Editor from './screens/Editor'
import Gallery from './screens/Gallery'
import GameOver from './screens/GameOver'
import Options from './screens/Options'
import StageList from './screens/StageList'
import Title from './screens/Title'
import { allStages, useUIStore, type GameResult } from './store'

export default function App() {
  return <CurrentScreen />
}

/** 参数缺失或无效时要跳转到的规范路径 */
function redirectOf(
  route: Route,
  stages: RawStageConfig[],
  lastGame: GameResult | null,
): string | null {
  switch (route.screen) {
    case 'choose':
    case 'battle':
      if (!stages.some((s) => s.name === route.stageName)) {
        return stagePath(
          route.screen === 'choose' ? 'choose' : 'stage',
          stages[0].name,
          route.multi,
        )
      }
      return null
    case 'stage-list':
      if (route.tab == null || route.page == null) {
        return `/list/${route.tab ?? 'default'}/1`
      }
      return null
    case 'editor':
      return route.view == null ? '/editor/config' : null
    case 'gallery':
      return route.tab == null ? `/gallery/${GALLERY_TABS[0]}` : null
    case 'gameover':
      // 刷新结束页时本局结果已丢失，回到标题页
      return lastGame == null ? '/' : null
    default:
      return null
  }
}

function CurrentScreen() {
  const route = useRoute()
  const customStages = useUIStore((s) => s.customStages)
  const lastGame = useUIStore((s) => s.lastGame)
  const redirect = redirectOf(route, allStages(customStages), lastGame)

  useLayoutEffect(() => {
    if (redirect != null) replace(redirect)
  }, [redirect])

  if (redirect != null) {
    return null
  }
  switch (route.screen) {
    case 'title':
      return <Title />
    case 'choose':
      return <ChooseStage stageName={route.stageName!} multi={route.multi} />
    case 'stage-list':
      return <StageList tab={route.tab!} page={route.page!} />
    case 'battle':
      return <GameCanvas stageName={route.stageName!} multi={route.multi} />
    case 'gameover':
      return <GameOver result={lastGame!} multi={route.multi} />
    case 'editor':
      return <Editor view={route.view!} />
    case 'gallery':
      return <Gallery tab={route.tab!} />
    case 'options':
      return <Options />
    case 'lobby':
      return <Lobby view={route.view} />
  }
}
