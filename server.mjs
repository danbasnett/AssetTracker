import { createServer as createHttpsServer } from 'https'
import { createServer as createHttpServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import next from 'next'
import { Agent } from 'https'

const allowSelfSigned = new Agent({ rejectUnauthorized: false })

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, hostname: '0.0.0.0', port })
const handle = app.getRequestHandler()

const keyPath = process.env.SSL_KEY_PATH || './certs/key.pem'
const certPath = process.env.SSL_CERT_PATH || './certs/cert.pem'
const useHttps = existsSync(keyPath) && existsSync(certPath)

const MS_PER_DAY = 24 * 60 * 60 * 1000

function runDailyCron(baseUrl) {
  const url = `${baseUrl}/api/cron`
  const opts = baseUrl.startsWith('https') ? { agent: allowSelfSigned } : {}
  fetch(url, opts)
    .then(r => r.json())
    .then(data => console.log(`[cron] Daily job complete:`, data))
    .catch(err => console.error(`[cron] Daily job failed:`, err))
}

app.prepare().then(() => {
  let baseUrl

  if (useHttps) {
    const httpsOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    }
    createHttpsServer(httpsOptions, (req, res) => handle(req, res))
      .listen(port, '0.0.0.0', () => {
        baseUrl = `https://localhost:${port}`
        console.log(`> Server listening on https://0.0.0.0:${port}`)
        runDailyCron(baseUrl)
        setInterval(() => runDailyCron(baseUrl), MS_PER_DAY)
      })
  } else {
    createHttpServer((req, res) => handle(req, res))
      .listen(port, '0.0.0.0', () => {
        baseUrl = `http://localhost:${port}`
        console.log(`> Server listening on http://0.0.0.0:${port}`)
        runDailyCron(baseUrl)
        setInterval(() => runDailyCron(baseUrl), MS_PER_DAY)
      })
  }
})
