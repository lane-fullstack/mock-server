import type { Response } from 'express'
import type { ApiResponse } from '../types.js'

export const success = <T>(data: T): ApiResponse<T> => ({
  code: 0,
  message: 'success',
  data,
})

export const error = (code: number, message: string): ApiResponse<null> => ({
  code,
  message,
  data: null,
})

export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json(success(data))
}

export const sendError = (res: Response, code: number, message: string): void => {
  res.status(code).json(error(code, message))
}
