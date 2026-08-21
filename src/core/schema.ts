export type OpenApiPrimitive = string | number | boolean | null

export interface OpenApiSchema {
  $ref?: string
  type?: 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean' | 'null'
  format?: string
  properties?: Record<string, OpenApiSchema>
  required?: readonly string[]
  items?: OpenApiSchema
  enum?: readonly OpenApiPrimitive[]
  description?: string
  default?: OpenApiPrimitive
  minimum?: number
  maximum?: number
}

export interface SchemaObjectOptions {
  required?: readonly string[]
  description?: string
}

export const schema = {
  string: (): OpenApiSchema => ({ type: 'string' }),
  email: (): OpenApiSchema => ({ type: 'string', format: 'email' }),
  integer: (): OpenApiSchema => ({ type: 'integer', format: 'int64' }),
  number: (): OpenApiSchema => ({ type: 'number', format: 'double' }),
  dateTime: (): OpenApiSchema => ({ type: 'string', format: 'date-time' }),
  boolean: (): OpenApiSchema => ({ type: 'boolean' }),
  array: (items: OpenApiSchema): OpenApiSchema => ({ type: 'array', items }),
  ref: (name: string): OpenApiSchema => ({ $ref: `#/components/schemas/${name}` }),
  object: (
    properties: Record<string, OpenApiSchema>,
    options: SchemaObjectOptions = {},
  ): OpenApiSchema => ({
    type: 'object',
    properties,
    required: options.required ?? Object.keys(properties),
    description: options.description,
  }),
}
