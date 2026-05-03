import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'

import '@/lib/i18n'
import { TRPCReactProvider } from '@/trpc/react'
import './styles/globals.css'

import { routeTree } from './routeTree.gen'

// Inject PWA manifest link dynamically
const manifestLink = document.createElement('link')
manifestLink.rel = 'manifest'
manifestLink.href = `${import.meta.env.VITE_API_URL}/manifest.webmanifest`
manifestLink.crossOrigin = 'use-credentials'
document.head.appendChild(manifestLink)

const router = createRouter({
  routeTree,
  defaultPreload: 'intent'
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element missing')

createRoot(rootEl).render(
  <StrictMode>
    <TRPCReactProvider>
      <RouterProvider router={router} />
      <Toaster />
    </TRPCReactProvider>
  </StrictMode>
)
