export const filterItems = <T extends object>(
  items: readonly T[],
  filters: Partial<Record<keyof T & string, string>>,
): T[] => {
  const fields = Object.keys(filters) as Array<keyof T & string>

  return items.filter((item) =>
    fields.every((field) => {
      const expected = filters[field]
      return expected === undefined || String(item[field]) === expected
    }),
  )
}
