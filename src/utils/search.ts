export const searchItems = <T>(
  items: readonly T[],
  keyword: string | undefined,
  fields: readonly (keyof T & string)[],
): T[] => {
  const normalizedKeyword = keyword?.trim().toLocaleLowerCase()
  if (!normalizedKeyword) {
    return [...items]
  }

  return items.filter((item) =>
    fields.some((field) => String(item[field]).toLocaleLowerCase().includes(normalizedKeyword)),
  )
}
