export type SortOrder = 'asc' | 'desc'

export const sortItems = <T extends object>(
  items: readonly T[],
  sortBy: keyof T & string | undefined,
  order: SortOrder = 'asc',
): T[] => {
  if (!sortBy) {
    return [...items]
  }

  return [...items].sort((left, right) => {
    const leftValue = left[sortBy]
    const rightValue = right[sortBy]

    if (leftValue === rightValue) {
      return 0
    }

    const result = String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
    })
    return order === 'desc' ? -result : result
  })
}
