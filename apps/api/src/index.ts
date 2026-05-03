import { Elysia } from 'elysia'

import { brandingConfig } from './context.ts'
import { env } from './env.ts'
import { registerManifestRoute } from './routes/manifest.route.ts'
import { buildCorsHeaders, handleTrpcRequest, isCorsOriginAllowed } from './trpc-handler.ts'

const app = new Elysia()
  .get('/', () => ({ ok: true, service: '@dfs/api-server' }))
  .options('/api/trpc/*', ({ request }) => {
    const origin = request.headers.get('origin') ?? ''
    if (!isCorsOriginAllowed(origin)) {
      return new Response(null, { status: 204 })
    }
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin)
    })
  })
  .all('/api/trpc/*', ({ request }) => handleTrpcRequest(request))

registerManifestRoute(app, {
  brandingConfig,
  webappUrl: env.SITE_WEBAPP_URL
})

app.listen(env.PORT)

console.log(`🚀 @dfs/api-server listening on http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
