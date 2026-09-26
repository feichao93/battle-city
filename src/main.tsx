import { createRoot } from 'react-dom/client'
import audio from './audio/AudioManager'
import App from './ui/App'

const container = document.getElementById('root')
if (container == null) {
  throw new Error('#root not found')
}

createRoot(container).render(<App />)

void audio.preload()

// Esc、修饰键等不算有效手势，所以不能只监听一次，解锁成功后再移除
const unlockAudio = () => {
  void audio.unlock().then(() => {
    if (!audio.locked) {
      document.removeEventListener('keydown', unlockAudio, true)
      document.removeEventListener('pointerdown', unlockAudio, true)
    }
  })
}
document.addEventListener('keydown', unlockAudio, true)
document.addEventListener('pointerdown', unlockAudio, true)
