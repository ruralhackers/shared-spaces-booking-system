import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/spaces')({
  component: () => <Outlet />
})
