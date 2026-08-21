export type JsonObject = Record<string, unknown>

export const asJsonObject = (value: unknown): JsonObject | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value as JsonObject
}

export const objectString = (value: JsonObject, key: string): string | undefined => {
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}
