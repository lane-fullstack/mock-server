import type { RequestHandler } from 'express'
import type { MockResourceMethod, MockResourceOptions, ResourceField } from './resource.js'
import { schema, type OpenApiSchema } from './schema.js'

export type OpenApiMethod = Lowercase<MockResourceMethod>

export interface OpenApiParameter {
  name: string
  in: 'path' | 'query'
  required: boolean
  schema: OpenApiSchema
  description?: string
}

export interface OpenApiResponse {
  description: string
  content?: {
    'application/json': {
      schema: OpenApiSchema
    }
  }
}

export interface OpenApiOperation {
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenApiParameter[]
  requestBody?: {
    required: boolean
    content: {
      'application/json': {
        schema: OpenApiSchema
      }
    }
  }
  responses: Record<string, OpenApiResponse>
}

export interface OpenApiDocument {
  openapi: '3.1.0'
  info: {
    title: string
    version: string
  }
  servers: Array<{ url: string }>
  paths: Record<string, Partial<Record<OpenApiMethod, OpenApiOperation>>>
  components: {
    schemas: Record<string, OpenApiSchema>
  }
}

export interface OpenApiRegistry {
  addSchema(name: string, definition: OpenApiSchema): void
  addPath(path: string, method: OpenApiMethod, operation: OpenApiOperation): void
  document(): OpenApiDocument
}

export interface MockRouteDocumentation {
  summary?: string
  description?: string
  tags?: string[]
  body?: OpenApiSchema
  response?: OpenApiSchema
  errorStatuses?: readonly number[]
  responses?: Record<string, OpenApiResponse>
  handler: RequestHandler
}

const toOpenApiPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')

const apiResponse = (data: OpenApiSchema): OpenApiSchema => schema.object({
  code: schema.integer(),
  message: schema.string(),
  data,
}, { required: ['code', 'message', 'data'] })

const jsonResponse = (description: string, responseSchema: OpenApiSchema): OpenApiResponse => ({
  description,
  content: {
    'application/json': {
      schema: responseSchema,
    },
  },
})

const errorResponse = (description: string): OpenApiResponse => jsonResponse(
  description,
  schema.ref('ErrorResponse'),
)

const propertySchema = <T>(definition: OpenApiSchema | undefined, field: ResourceField<T>): OpenApiSchema =>
  definition?.properties?.[field] ?? schema.string()

const resourceParameters = <T extends { id: number }>(options: MockResourceOptions<T>): OpenApiParameter[] => {
  const searchFields = options.search ?? options.searchFields ?? []
  const filterFields = options.filters ?? options.filterFields ?? []
  const sortableFields = options.sort ?? options.sortableFields ?? []
  const parameters: OpenApiParameter[] = [
    {
      name: 'page',
      in: 'query',
      required: false,
      schema: { ...schema.integer(), default: 1, minimum: 1 },
    },
    {
      name: 'pageSize',
      in: 'query',
      required: false,
      schema: { ...schema.integer(), default: 20, minimum: 1, maximum: 100 },
    },
    {
      name: 'keyword',
      in: 'query',
      required: false,
      schema: schema.string(),
    },
  ]

  for (const field of filterFields) {
    parameters.push({
      name: field,
      in: 'query',
      required: false,
      schema: propertySchema(options.schema, field),
    })
  }

  parameters.push(
    {
      name: 'sortBy',
      in: 'query',
      required: false,
      schema: { type: 'string', enum: [...sortableFields] },
    },
    {
      name: 'order',
      in: 'query',
      required: false,
      schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
    },
    {
      name: '_delay',
      in: 'query',
      required: false,
      schema: { ...schema.integer(), minimum: 0 },
      description: 'Override the mock delay for this request in milliseconds.',
    },
    {
      name: '_status',
      in: 'query',
      required: false,
      schema: { type: 'integer', enum: [401, 403, 404, 429, 500, 503] },
      description: 'Return a simulated HTTP error for this request.',
    },
  )

  return parameters
}

const idParameter = (): OpenApiParameter => ({
  name: 'id',
  in: 'path',
  required: true,
  schema: schema.integer(),
})

const allMethods: readonly MockResourceMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const openApiMethod = (method: MockResourceMethod): OpenApiMethod =>
  method.toLowerCase() as OpenApiMethod

const allowsMethod = <T extends { id: number }>(options: MockResourceOptions<T>, method: MockResourceMethod): boolean =>
  (options.methods ?? allMethods).includes(method)

export const createOpenApiRegistry = (serverUrl: string): OpenApiRegistry => {
  const openapi: OpenApiDocument = {
    openapi: '3.1.0',
    info: {
      title: 'Local Mock API',
      version: '1.0.0',
    },
    servers: [{ url: serverUrl }],
    paths: {},
    components: {
      schemas: {
        ErrorResponse: schema.object({
          code: schema.integer(),
          message: schema.string(),
          data: { type: 'null' },
        }, { required: ['code', 'message', 'data'] }),
      },
    },
  }

  return {
    addSchema(name, definition) {
      openapi.components.schemas[name] = definition
    },
    addPath(path, method, operation) {
      const normalizedPath = toOpenApiPath(path)
      openapi.paths[normalizedPath] ??= {}
      openapi.paths[normalizedPath][method] = operation
    },
    document() {
      return openapi
    },
  }
}

export const registerResourceOpenApi = <T extends { id: number }>(
  registry: OpenApiRegistry,
  options: MockResourceOptions<T>,
): void => {
  const name = options.name ?? options.singularName ?? 'Resource'
  const definition = options.schema ?? schema.object({ id: schema.integer() })
  const listSchema = schema.object({
    page: schema.integer(),
    pageSize: schema.integer(),
    total: schema.integer(),
    totalPages: schema.integer(),
    items: schema.array(schema.ref(name)),
  })

  registry.addSchema(name, definition)
  registry.addSchema(`${name}ListResponse`, apiResponse(listSchema))

  if (allowsMethod(options, 'GET')) {
    registry.addPath(options.path, 'get', {
      summary: `List ${name}`,
      tags: [name],
      parameters: resourceParameters(options),
      responses: {
        '200': jsonResponse('Successful response', schema.ref(`${name}ListResponse`)),
        '500': errorResponse('Mock server error'),
      },
    })

    registry.addPath(`${options.path}/:id`, 'get', {
      summary: `Get ${name} detail`,
      tags: [name],
      parameters: [idParameter(), {
        name: '_delay',
        in: 'query',
        required: false,
        schema: schema.integer(),
      }, {
        name: '_status',
        in: 'query',
        required: false,
        schema: { type: 'integer', enum: [401, 403, 404, 429, 500, 503] },
      }],
      responses: {
        '200': jsonResponse('Successful response', apiResponse(schema.ref(name))),
        '404': errorResponse(`${name} not found`),
      },
    })
  }

  if (allowsMethod(options, 'POST')) {
    registry.addPath(options.path, 'post', {
      summary: `Create ${name}`,
      tags: [name],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: definition } },
      },
      responses: {
        '201': jsonResponse('Created', apiResponse(schema.ref(name))),
        '400': errorResponse('Invalid request body'),
      },
    })
  }

  for (const method of ['PUT', 'PATCH'] as const) {
    if (!allowsMethod(options, method)) {
      continue
    }

    registry.addPath(`${options.path}/:id`, openApiMethod(method), {
      summary: `${method === 'PUT' ? 'Replace' : 'Update'} ${name}`,
      tags: [name],
      parameters: [idParameter()],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: definition } },
      },
      responses: {
        '200': jsonResponse('Successful response', apiResponse(schema.ref(name))),
        '400': errorResponse('Invalid request body'),
        '404': errorResponse(`${name} not found`),
      },
    })
  }

  if (allowsMethod(options, 'DELETE')) {
    registry.addPath(`${options.path}/:id`, 'delete', {
      summary: `Delete ${name}`,
      tags: [name],
      parameters: [idParameter()],
      responses: {
        '200': jsonResponse('Successful response', apiResponse(schema.object({ id: schema.integer() }))),
        '404': errorResponse(`${name} not found`),
      },
    })
  }
}

export const registerCustomRouteOpenApi = (
  registry: OpenApiRegistry,
  method: MockResourceMethod,
  path: string,
  options: MockRouteDocumentation,
): void => {
  const responses: Record<string, OpenApiResponse> = options.responses
    ? { ...options.responses }
    : {
        '200': jsonResponse('Successful response', apiResponse(options.response ?? schema.object({}))),
      }

  for (const status of options.errorStatuses ?? []) {
    responses[String(status)] = errorResponse(`HTTP ${status} response`)
  }

  registry.addPath(path, openApiMethod(method), {
    summary: options.summary,
    description: options.description,
    tags: options.tags,
    requestBody: options.body ? {
      required: true,
      content: { 'application/json': { schema: options.body } },
    } : undefined,
    responses,
  })
}
