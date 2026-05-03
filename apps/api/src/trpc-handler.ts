import { appRouter } from '@dfs/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { createTRPCContext } from './context.ts'
import { env } from './env.ts'

const corsOrigins = new Set(env.CORS_ORIGINS.split(',').map((o) => o.trim()))

export const isCorsOriginAllowed = (origin: string): boolean => corsOrigins.has(origin)

export const buildCorsHeaders = (origin: string): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-trpc-source, x-admin-key, trpc-accept',
  'Access-Control-Expose-Headers': 'x-admin-key',
  'Access-Control-Max-Age': '600',
  Vary: 'Origin'
})

const onError =
  env.NODE_ENV === 'development'
    ? ({ path, error }: { path?: string; error: { message: string } }) => {
        console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`)
      }
    : undefined

export const handleTrpcRequest = async (request: Request): Promise<Response> => {
  const origin = request.headers.get('origin') ?? ''
  const allowedOrigin = isCorsOriginAllowed(origin) ? origin : ''

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: request.headers }),
    onError
  })

  // fetchRequestHandler returns its own Response — rebuild it with CORS headers.
  const headers = new Headers(response.headers)
  if (allowedOrigin) {
    for (const [key, value] of Object.entries(buildCorsHeaders(allowedOrigin))) {
      headers.set(key, value)
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
