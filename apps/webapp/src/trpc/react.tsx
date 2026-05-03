import type { AppRouter } from '@dfs/api/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { httpBatchStreamLink, loggerLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { useState } from 'react'
import SuperJSON from 'superjson'

import { env } from '@/env'
import { createQueryClient } from './query-client'

export const api = createTRPCReact<AppRouter>()

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

let adminKey = ''

export function setAdminKey(key: string) {
  adminKey = key
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            import.meta.env.DEV || (op.direction === 'down' && op.result instanceof Error)
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: `${env.VITE_API_URL}/api/trpc`,
          fetch: (url, options) =>
            fetch(url, {
              ...(options as RequestInit),
              credentials: 'include'
            }),
          headers: () => {
            const headers: Record<string, string> = {
              'x-trpc-source': 'vite-react'
            }
            if (adminKey) {
              headers['x-admin-key'] = adminKey
            }
            return headers
          }
        })
      ]
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  )
}
