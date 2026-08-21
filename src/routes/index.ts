import { Router } from 'express'
import { config } from '../config.js'
import { createMockRouter } from '../core/mock.js'
import { schema } from '../core/schema.js'
import { news } from '../data/news.js'
import { users } from '../data/users.js'
import type { User } from '../types.js'
import { asJsonObject, objectString } from '../utils/body.js'
import { sendError, sendSuccess } from '../utils/response.js'

export const apiRouter = Router()
const mock = createMockRouter(`http://localhost:${config.port}`)
export const openapi = mock.openapi

export const registeredResources = [
  mock.resource<User>({
    name: 'User',
    path: '/api/users',
    data: users,
    schema: schema.object({
      id: schema.integer(),
      name: schema.string(),
      email: schema.email(),
      phone: schema.string(),
      avatar: schema.string(),
      city: schema.string(),
      status: schema.integer(),
      createdAt: schema.dateTime(),
    }, { required: ['id', 'name', 'email'] }),
    search: ['name', 'email', 'phone', 'city'],
    filters: ['status'],
    sort: ['id', 'name', 'createdAt'],
  }),
  mock.resource({
    name: 'News',
    path: '/api/news',
    data: news,
    methods: ['GET'],
    schema: schema.object({
      id: schema.integer(),
      title: schema.string(),
      summary: schema.string(),
      content: schema.string(),
      author: schema.string(),
      categoryId: schema.integer(),
      views: schema.integer(),
      createdAt: schema.dateTime(),
    }),
    search: ['title', 'summary', 'author'],
    filters: ['categoryId'],
    sort: ['id', 'views', 'createdAt'],
  }),
]

mock.post('/api/login', {
  summary: 'User login',
  tags: ['Auth'],
  body: schema.object({
    username: schema.string(),
    password: schema.string(),
  }),
  response: schema.object({
    token: schema.string(),
    user: schema.object({
      id: schema.integer(),
      name: schema.string(),
    }),
  }),
  errorStatuses: [401],
  handler: (request, response) => {
    const body = asJsonObject(request.body)
    const username = body ? objectString(body, 'username') : undefined
    const password = body ? objectString(body, 'password') : undefined

    if (username !== 'admin' || password !== '123456') {
      sendError(response, 401, 'Invalid username or password')
      return
    }

    sendSuccess(response, {
      token: 'mock-token-123456',
      user: {
        id: 1,
        name: 'Admin',
      },
    })
  },
})

apiRouter.use(mock.router)

export const routes = [
  ...registeredResources.flatMap((resource) => resource.routes),
  'POST   /api/login',
]
