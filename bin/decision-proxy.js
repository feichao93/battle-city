export const DECISION_PATH = '/api/decision'
export const DECISION_MODEL = 'decision-model-preview'

/** state 带 26 行地图，几 KB 就够；再大多半是误用 */
const MAX_BODY = 256 * 1024

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('body too large'))
        req.destroy()
      } else {
        chunks.push(chunk)
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/**
 * 把浏览器的 { state, questions } 转发给百炼决策模型（华北2 北京）。
 * Key 只在 Node 这边，浏览器拿不到；没配 Key 时返回 503，页面据此提示
 */
export function createDecisionProxy({ apiKey, workspaceId }) {
  const endpoint =
    workspaceId == null || workspaceId === ''
      ? null
      : `https://${workspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/systemone`

  const forward = async (req, res) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'POST only' })
      return
    }
    if (apiKey == null || apiKey === '' || endpoint == null) {
      sendJson(res, 503, { error: '未配置 DASHSCOPE_API_KEY / DASHSCOPE_WORKSPACE_ID' })
      return
    }
    let payload
    try {
      const { state, questions } = JSON.parse(await readBody(req))
      payload = JSON.stringify({ model: DECISION_MODEL, state, questions })
    } catch (e) {
      sendJson(res, 400, { error: String(e?.message ?? e) })
      return
    }
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: payload,
    })
    const body = await upstream.text()
    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    })
    res.end(body)
  }

  return {
    /** 处理 DECISION_PATH，返回是否已处理 */
    handleRequest(req, res) {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost')
      if (pathname !== DECISION_PATH) return false
      forward(req, res).catch((e) => {
        if (!res.headersSent) sendJson(res, 502, { error: String(e?.message ?? e) })
        else res.end()
      })
      return true
    },
  }
}
