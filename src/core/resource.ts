import type { Request, Response, Router } from 'express'
import { registerResourceOpenApi, type OpenApiRegistry } from './openapi.js'
import type { OpenApiSchema } from './schema.js'
import { asJsonObject } from '../utils/body.js'
import { filterItems } from '../utils/filter.js'
import { paginate } from '../utils/paginate.js'
import { queryInteger, queryString } from '../utils/query.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { searchItems } from '../utils/search.js'
import { sortItems, type SortOrder } from '../utils/sort.js'

export type ResourceItem = { id: number }
export type ResourceField<T> = keyof T & string
export type MockResourceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const ALL_RESOURCE_METHODS: readonly MockResourceMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]

export interface MockResourceOptions<T extends ResourceItem> {
  name?: string
  path: string
  data: T[]
  methods?: readonly MockResourceMethod[]
  schema?: OpenApiSchema
  search?: readonly ResourceField<T>[]
  filters?: readonly ResourceField<T>[]
  sort?: readonly ResourceField<T>[]
  searchFields?: readonly ResourceField<T>[]
  filterFields?: readonly ResourceField<T>[]
  sortableFields?: readonly ResourceField<T>[]
  singularName?: string
}

export interface MockResourceInfo {
  path: string
  routes: string[]
}

const isAllowedField = <T>(
  fields: readonly (keyof T & string)[] | undefined,
  value: string | undefined,
): value is keyof T & string => value !== undefined && (fields?.includes(value as keyof T & string) ?? false)

const requestBody = (request: Request): Record<string, unknown> | null =>
  asJsonObject(request.body)

const notFoundMessage = (name: string): string => `${name} not found`

const idFromRequest = (request: Request): number | undefined => {
  const id = Number(request.params.id)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

/** Registers only the configured HTTP methods; omitting methods keeps the full CRUD default. */
export const createMockResource = <T extends ResourceItem>(
  router: Router,
  openapi: OpenApiRegistry,
  options: MockResourceOptions<T>,
): MockResourceInfo => {
  const name = options.name ?? options.singularName ?? 'Resource'
  const methods = options.methods ?? ALL_RESOURCE_METHODS
  const allows = (method: MockResourceMethod): boolean => methods.includes(method)
  const routes: string[] = []

  registerResourceOpenApi(openapi, options)

  if (allows('GET')) {
    router.get(options.path, (request, response) => {
      const keyword = queryString(request.query.keyword)
      const filters: Partial<Record<ResourceField<T>, string>> = {}

      for (const field of options.filterFields ?? []) {
        const value = queryString(request.query[field])
        if (value !== undefined) {
          filters[field] = value
        }
      }

      const filtered = filterItems(searchItems(options.data, keyword, options.searchFields ?? []), filters)
      const requestedSort = queryString(request.query.sortBy)
      const sortBy = isAllowedField(options.sortableFields, requestedSort) ? requestedSort : undefined
      const orderValue = queryString(request.query.order)
      const order: SortOrder = orderValue === 'desc' ? 'desc' : 'asc'
      const sorted = sortItems(filtered, sortBy, order)
      const result = paginate(
        sorted,
        queryInteger(request.query.page),
        queryInteger(request.query.pageSize),
      )

      sendSuccess(response, result)
    })

    router.get(`${options.path}/:id`, (request, response) => {
      const id = idFromRequest(request)
      const item = id === undefined ? undefined : options.data.find((entry) => entry.id === id)

      if (!item) {
        sendError(response, 404, notFoundMessage(name))
        return
      }

      sendSuccess(response, item)
    })

    routes.push(`GET    ${options.path}`, `GET    ${options.path}/:id`)
  }

  if (allows('POST')) {
    router.post(options.path, (request, response) => {
      const body = requestBody(request)
      if (!body) {
        sendError(response, 400, 'Request body must be a JSON object')
        return
      }

      const nextId = options.data.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
      const item = { ...body, id: nextId } as unknown as T
      options.data.push(item)
      sendSuccess(response, item, 201)
    })

    routes.push(`POST   ${options.path}`)
  }

  const update = (request: Request, response: Response, replace: boolean): void => {
    const id = idFromRequest(request)
    const index = id === undefined ? -1 : options.data.findIndex((entry) => entry.id === id)
    if (index < 0) {
      sendError(response, 404, notFoundMessage(name))
      return
    }

    const body = requestBody(request)
    if (!body) {
      sendError(response, 400, 'Request body must be a JSON object')
      return
    }

    const current = options.data[index]
    const item = { ...(replace ? {} : current), ...body, id } as unknown as T
    options.data[index] = item
    sendSuccess(response, item)
  }

  if (allows('PUT')) {
    router.put(`${options.path}/:id`, (request, response) => {
      update(request, response, true)
    })

    routes.push(`PUT    ${options.path}/:id`)
  }

  if (allows('PATCH')) {
    router.patch(`${options.path}/:id`, (request, response) => {
      update(request, response, false)
    })

    routes.push(`PATCH  ${options.path}/:id`)
  }

  if (allows('DELETE')) {
    router.delete(`${options.path}/:id`, (request, response) => {
      const id = idFromRequest(request)
      const index = id === undefined ? -1 : options.data.findIndex((entry) => entry.id === id)
      if (index < 0) {
        sendError(response, 404, notFoundMessage(name))
        return
      }

      options.data.splice(index, 1)
      sendSuccess(response, { id })
    })

    routes.push(`DELETE ${options.path}/:id`)
  }

  return {
    path: options.path,
    routes,
  }
}
