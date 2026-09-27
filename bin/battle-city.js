#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createReadStream, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { createLanRelay, lanUrls } from './lan-relay.js'

const HELP = `用法：battle-city [--port <端口>]
      battle-city host [--port <端口>]

默认在本机启动坦克大战的 web server，按 Enter 在浏览器中打开。
  --port, -p   起始端口，默认 8080；被占用时依次往后找

host 以联机主机启动：监听局域网，打印可分享的大厅地址。同一局域网的玩家打开该地址，
在大厅里创建或加入房间即可双人对战（创建者的浏览器运行游戏）。

  --help, -h   显示帮助`

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
      console.log(HELP)
      process.exit(0)
    } else if (name === '--port' || name === '-p') {
      port = Number(value())
    } else {
      console.error(`未知参数：${arg}\n\n${HELP}`)
      process.exit(1)
    }
  }
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error('端口必须是 1–65535 之间的整数')
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
  child.on('error', () => console.log(`打不开浏览器，请手动访问 ${url}`))
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
  const lines = shared.length > 0 ? shared : ['（没有找到局域网地址，请检查网络连接）']
  console.log(`\n  Battle City v${version} 联机主机\n\n  本机    ${url}\n`)
  console.log(`  局域网  ${lines.join('\n          ')}\n`)
  console.log('  把局域网地址发给同一网络里的另一位玩家\n')
} else {
  console.log(`\n  Battle City v${version}\n\n  ${url}\n`)
}
if (process.stdin.isTTY) {
  console.log('  按 Enter 在浏览器中打开，Ctrl+C 退出\n')
  createInterface({ input: process.stdin }).on('line', () => openBrowser(url))
} else {
  console.log('  Ctrl+C 退出\n')
}
