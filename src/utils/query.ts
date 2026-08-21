export const queryString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }

  return undefined
}

export const queryInteger = (value: unknown): number | undefined => {
  const text = queryString(value)
  if (text === undefined || text.trim() === '') {
    return undefined
  }

  const parsed = Number(text)
  return Number.isInteger(parsed) ? parsed : undefined
}
