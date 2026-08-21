import { Router, type RequestHandler } from 'express'
import {
  createOpenApiRegistry,
  registerCustomRouteOpenApi,
  type MockRouteDocumentation,
  type OpenApiRegistry,
} from './openapi.js'
import { createMockResource, type MockResourceInfo, type MockResourceOptions, type ResourceItem } from './resource.js'

export interface MockRouter {
  router: Router
  openapi: OpenApiRegistry
  resources: MockResourceInfo[]
  resource: <T extends ResourceItem>(options: MockResourceOptions<T>) => MockResourceInfo
  get: (path: string, options: MockRouteDocumentation) => void
  post: (path: string, options: MockRouteDocumentation) => void
  put: (path: string, options: MockRouteDocumentation) => void
  patch: (path: string, options: MockRouteDocumentation) => void
  delete: (path: string, options: MockRouteDocumentation) => void
}

export const createMockRouter = (serverUrl: string): MockRouter => {
  const router = Router()
  const openapi = createOpenApiRegistry(serverUrl)
  const resources: MockResourceInfo[] = []

  const customRoute = (
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: MockRouteDocumentation,
  ): void => {
    const handler: RequestHandler = options.handler
    router[method.toLowerCase() as 'get'](path, handler)
    registerCustomRouteOpenApi(openapi, method, path, options)
  }

  return {
    router,
    openapi,
    resources,
    resource: <T extends ResourceItem>(options: MockResourceOptions<T>): MockResourceInfo => {
      const resource = createMockResource(router, openapi, options)
      resources.push(resource)
      return resource
    },
    get: (path, options) => customRoute('GET', path, options),
    post: (path, options) => customRoute('POST', path, options),
    put: (path, options) => customRoute('PUT', path, options),
    patch: (path, options) => customRoute('PATCH', path, options),
    delete: (path, options) => customRoute('DELETE', path, options),
  }
}
