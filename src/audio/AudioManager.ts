import type { AudioPort, SoundName } from '../engine/types'

// 复用旧项目的 .ogg 音效（仓库根 /sound）。Vite 以 ?url 形式给出可访问 URL。
const soundUrls = import.meta.glob('../../sound/*.ogg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** 从 glob key（".../bullet_shot.ogg"）取音效名 */
function nameFromPath(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.ogg$/, '')
}

/**
 * Web Audio 封装。解码为 AudioBuffer，play 时新建 BufferSource，
 * 支持同一音效重叠播放。受浏览器自动播放策略限制，首次播放前需用户手势解锁。
 * 全局单例：启动时预加载一次，各局对战共用。
 */
class AudioManager implements AudioPort {
  private ctx: AudioContext | null = null
  private readonly urls = new Map<string, string>()
  private readonly buffers = new Map<string, AudioBuffer>()
  private loading: Promise<void> | null = null
  private muted = false

  constructor() {
    for (const [path, url] of Object.entries(soundUrls)) {
      this.urls.set(nameFromPath(path), url)
    }
  }

  /** 预解码所有音效，重复调用返回同一个 Promise（失败静默） */
  preload(): Promise<void> {
    this.loading ??= this.load()
    return this.loading
  }

  private async load(): Promise<void> {
    const ctx = this.ensureContext()
    if (ctx == null) {
      return
    }
    await Promise.all(
      [...this.urls.entries()].map(async ([name, url]) => {
        try {
          const res = await fetch(url)
          const buf = await res.arrayBuffer()
          this.buffers.set(name, await ctx.decodeAudioData(buf))
        } catch {
          // 忽略单个音效加载失败
        }
      }),
    )
  }

  /** 浏览器自动播放策略还没放行（尚无有效的用户手势） */
  get locked(): boolean {
    return this.ctx != null && this.ctx.state !== 'running'
  }

  /** 只有在用户手势的回调里调用才会生效 */
  async unlock(): Promise<void> {
    const ctx = this.ensureContext()
    if (ctx != null && ctx.state === 'suspended') {
      await ctx.resume()
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  play(name: SoundName): void {
    if (this.muted) {
      return
    }
    const ctx = this.ensureContext()
    if (ctx == null) {
      return
    }
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    const buffer = this.buffers.get(name)
    if (buffer == null) {
      return // 尚未解码完成，跳过
    }
    try {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start()
    } catch {
      // 忽略播放异常
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx == null) {
      try {
        this.ctx = new AudioContext()
      } catch {
        return null
      }
    }
    return this.ctx
  }
}

const audioManager = new AudioManager()
export default audioManager
