#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { createReadStream, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { createLanRelay, lanUrls } from './lan-relay.js'

const MESSAGES = {
  zh: {
    help: `用法：battle-city [--port <端口>]
      battle-city host [--port <端口>]

默认在本机启动坦克大战的 web server，按 Enter 在浏览器中打开。
  --port, -p   起始端口，默认 8080；被占用时依次往后找

host 以联机主机启动：监听局域网，打印可分享的大厅地址。同一局域网的玩家打开该地址，
在大厅里创建或加入房间即可双人对战（创建者的浏览器运行游戏）。

  --help, -h   显示帮助`,
    unknownArg: (arg) => `未知参数：${arg}`,
    badPort: '端口必须是 1–65535 之间的整数',
    openFailed: (url) => `打不开浏览器，请手动访问 ${url}`,
    hostTitle: '联机主机',
    local: '本机    ',
    lan: '局域网  ',
    noLan: '（没有找到局域网地址，请检查网络连接）',
    share: '把局域网地址发给同一网络里的另一位玩家',
    pressEnter: '按 Enter 在浏览器中打开，Ctrl+C 退出',
    quit: 'Ctrl+C 退出',
  },
  en: {
    help: `Usage: battle-city [--port <port>]
       battle-city host [--port <port>]

Starts the Battle City web server on this machine; press Enter to open it in the browser.
  --port, -p   Starting port, default 8080; tries the next one if it is in use

host starts a LAN host: listens on the local network and prints a lobby URL to share.
Players on the same network open that URL and create or join a room to play together
(the room creator's browser runs the game).

  --help, -h   Show this help`,
    unknownArg: (arg) => `Unknown argument: ${arg}`,
    badPort: 'Port must be an integer between 1 and 65535',
    openFailed: (url) => `Could not open the browser, please visit ${url} manually`,
    hostTitle: 'LAN host',
    local: 'Local   ',
    lan: 'Network ',
    noLan: '(No LAN address found, please check your network connection)',
    share: 'Share the network URL with another player on the same network',
    pressEnter: 'Press Enter to open in the browser, Ctrl+C to quit',
    quit: 'Press Ctrl+C to quit',
  },
}

/** macOS 系统设置里的首选语言，如 zh-Hans-CN */
function macLanguage() {
  if (process.platform !== 'darwin') return null
  const { stdout } = spawnSync('defaults', ['read', '-g', 'AppleLanguages'], { encoding: 'utf8' })
  return stdout?.match(/[a-z]{2,3}(?:[-_]\w+)*/i)?.[0] ?? null
}

/**
 * 显式设置的 LC_ALL / LC_MESSAGES / LANGUAGE 优先；macOS 上 LANG 常由终端自动注入，
 * 不如系统首选语言可靠，排在它后面；都没有时（如 Windows）退回 Intl locale
 */
function detectLang(env) {
  const locale =
    env.LC_ALL ||
    env.LC_MESSAGES ||
    env.LANGUAGE ||
    macLanguage() ||
    env.LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale
  return /^zh/i.test(locale) ? 'zh' : 'en'
}

const t = MESSAGES[detectLang(process.env)]

const ROOT = fileURLToPath(new URL('../www/', import.meta.url))
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.wasm': 'application/wasm',
}

function parseArgs(argv) {
  let port = 8080
  let host = false
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const [name, inline] = arg.startsWith('--') && arg.includes('=') ? arg.split(/=(.*)/) : [arg]
    const value = () => inline ?? argv[(i += 1)]
    if (i === 0 && name === 'host') {
      host = true
    } else if (name === '--help' || name === '-h') {
      console.log(t.help)
      process.exit(0)
    } else if (name === '--port' || name === '-p') {
      port = Number(value())
    } else {
      console.error(`${t.unknownArg(arg)}\n\n${t.help}`)
      process.exit(1)
    }
  }
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error(t.badPort)
    process.exit(1)
  }
  return { port, host }
}

async function handle(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = normalize(join(ROOT, pathname.endsWith('/') ? `${pathname}index.html` : pathname))
  // 挡住 ../ 跳出 www 目录
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end()
    return
  }
  const info = await stat(file).catch(() => null)
  if (info == null || !info.isFile()) {
    res.writeHead(404).end('Not Found')
    return
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'content-length': info.size,
  })
  createReadStream(file).pipe(res)
}

/** 从 port 开始找一个能监听的端口；联机主机监听全部网卡，否则只监听本机 */
function listen(server, port, hostname) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('listening', onListening)
      if (err.code === 'EADDRINUSE' && port < 65535) resolve(listen(server, port + 1, hostname))
      else reject(err)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve(server.address().port)
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, hostname)
  })
}

function openBrowser(url) {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]]
  const child = spawn(command, args, { stdio: 'ignore', detached: true })
  child.on('error', () => console.log(t.openFailed(url)))
  child.unref()
}

const { port, host } = parseArgs(process.argv.slice(2))
const relay = host ? createLanRelay() : null
const server = createServer((req, res) => {
  if (relay?.handleRequest(req, res)) return
  handle(req, res).catch(() => res.writeHead(500).end())
})
server.on('upgrade', (req, socket, head) => {
  if (!relay?.handleUpgrade(req, socket, head)) socket.destroy()
})
const actualPort = await listen(server, port, host ? '0.0.0.0' : '127.0.0.1')
const url = `http://localhost:${actualPort}/${host ? '#/lobby' : ''}`

if (host) {
  const shared = lanUrls(actualPort)
  const lines = shared.length > 0 ? shared : [t.noLan]
  console.log(`\n  Battle City v${version} ${t.hostTitle}\n\n  ${t.local}${url}\n`)
  console.log(`  ${t.lan}${lines.join('\n          ')}\n`)
  console.log(`  ${t.share}\n`)
} else {
  console.log(`\n  Battle City v${version}\n\n  ${url}\n`)
}
if (process.stdin.isTTY) {
  console.log(`  ${t.pressEnter}\n`)
  createInterface({ input: process.stdin }).on('line', () => openBrowser(url))
} else {
  console.log(`  ${t.quit}\n`)
}
