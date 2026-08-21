import type { RequestHandler } from 'express'
import { config } from './config.js'
import { delay } from './utils/delay.js'
import { queryInteger } from './utils/query.js'
import { error } from './utils/response.js'

const MAX_DELAY = 60_000
const mockStatuses = new Set([401, 403, 404, 429, 500, 503])

const boundedDelay = (value: number | undefined): number => {
  if (value === undefined || value < 0) {
    return config.mockDelay
  }

  return Math.min(value, MAX_DELAY)
}

/** Applies the global delay and error switches before any mock route handles a request. */
export const mockControls: RequestHandler = (request, response, next) => {
  const requestDelay = boundedDelay(queryInteger(request.query._delay))
  const requestedStatus = queryInteger(request.query._status)

  void delay(requestDelay).then(() => {
    if (requestedStatus !== undefined && mockStatuses.has(requestedStatus)) {
      response.status(requestedStatus).json(error(requestedStatus, `Mock ${requestedStatus} error`))
      return
    }

    next()
  })
}
