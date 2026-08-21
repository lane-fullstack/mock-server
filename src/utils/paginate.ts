export interface PaginationResult<T> {
  page: number
  pageSize: number
  total: number
  totalPages: number
  items: T[]
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const positiveInteger = (value: number | undefined, fallback: number): number =>
  value !== undefined && Number.isInteger(value) && value > 0 ? value : fallback

export const paginate = <T>(
  items: readonly T[],
  pageValue?: number,
  pageSizeValue?: number,
): PaginationResult<T> => {
  const requestedPage = positiveInteger(pageValue, DEFAULT_PAGE)
  const pageSize = Math.min(positiveInteger(pageSizeValue, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const page = totalPages === 0 ? DEFAULT_PAGE : Math.min(requestedPage, totalPages)
  const start = (page - 1) * pageSize

  return {
    page,
    pageSize,
    total,
    totalPages,
    items: items.slice(start, start + pageSize),
  }
}
