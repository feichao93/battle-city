#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createReadStream, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const HELP = `用法：battle-city [--port <端口>]

在本机启动坦克大战的 web server，按 Enter 在浏览器中打开。
  --port, -p   起始端口，默认 8080；被占用时依次往后找
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
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      console.log(HELP)
      process.exit(0)
    } else if (arg === '--port' || arg === '-p') {
      port = Number(argv[(i += 1)])
    } else if (arg.startsWith('--port=')) {
      port = Number(arg.slice('--port='.length))
    } else {
      console.error(`未知参数：${arg}\n\n${HELP}`)
      process.exit(1)
    }
  }
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error('端口必须是 1–65535 之间的整数')
    process.exit(1)
  }
  return { port }
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

/** 从 port 开始找一个能监听的端口 */
function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('listening', onListening)
      if (err.code === 'EADDRINUSE' && port < 65535) resolve(listen(server, port + 1))
      else reject(err)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve(server.address().port)
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '127.0.0.1')
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

const { port } = parseArgs(process.argv.slice(2))
const server = createServer((req, res) => {
  handle(req, res).catch(() => res.writeHead(500).end())
})
const actualPort = await listen(server, port)
const url = `http://localhost:${actualPort}/`

console.log(`\n  Battle City v${version}\n\n  ${url}\n`)
if (process.stdin.isTTY) {
  console.log('  按 Enter 在浏览器中打开，Ctrl+C 退出\n')
  createInterface({ input: process.stdin }).on('line', () => openBrowser(url))
} else {
  console.log('  Ctrl+C 退出\n')
}
