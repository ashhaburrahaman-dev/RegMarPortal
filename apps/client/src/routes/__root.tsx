import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { api } from '@/lib/api'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // Skip auth check on login page
    if (location.pathname === '/login') return

    try {
      await api.get('/auth/me')
    } catch {
      throw redirect({ to: '/login', search: { redirect: location.pathname } })
    }
  },
  component: () => <Outlet />,
})
