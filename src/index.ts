import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { openApiUiPage } from './docs.js'
import { mockControls } from './middleware.js'
import { apiRouter, openapi, routes } from './routes/index.js'
import { error } from './utils/response.js'

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())
app.use(mockControls)
app.get('/openapi.json', (_request, response) => {
  response.json(openapi.document())
})
app.get('/docs', (_request, response) => {
  response.type('html').send(openApiUiPage('/openapi.json'))
})
app.use(apiRouter)

app.use((_request, response) => {
  response.status(404).json(error(404, 'Route not found'))
})

app.listen(config.port, () => {
  console.log(`Mock Server
────────────────────────

API:
http://localhost:${config.port}

API Docs:
http://localhost:${config.port}/docs

OpenAPI:
http://localhost:${config.port}/openapi.json

────────────────────────

Resources:`)
  console.log(routes.join('\n'))
})
