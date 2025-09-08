import type { HttpResponseInit } from '@azure/functions'
import type { ApiError } from '@ana/shared'

const responses = {
  ok: <T>(data: T): HttpResponseInit => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: data
  }),

  created: <T>(data: T): HttpResponseInit => ({
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: data
  }),

  noContent: (): HttpResponseInit => ({
    status: 204,
    headers: {}
  }),

  badRequest: (message: string): HttpResponseInit => ({
    status: 400,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: { error: message } as ApiError
  }),

  notFound: (message: string): HttpResponseInit => ({
    status: 404,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: { error: message } as ApiError
  }),

  serverError: (message: string): HttpResponseInit => ({
    status: 500,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: { error: message } as ApiError
  })
}

export default responses
