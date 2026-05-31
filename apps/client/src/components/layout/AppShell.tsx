import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useAuth } from '@/hooks/useAuth'

export function AppShell() {
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar role={user?.role} />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navbar */}
        <Navbar user={user} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
