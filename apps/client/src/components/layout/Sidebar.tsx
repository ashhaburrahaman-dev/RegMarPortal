import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  ScrollText,
  FilePlus,
  Search,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role?: 'ADMIN' | 'OPERATOR' | undefined
}

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Marriages',
    to: '/marriages',
    icon: ScrollText,
  },
  {
    label: 'New Entry',
    to: '/marriages/new',
    icon: FilePlus,
  },
  {
    label: 'Search',
    to: '/marriages/search',
    icon: Search,
  },
]

export function Sidebar({ role }: SidebarProps) {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  return (
    <aside className="w-64 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col animate-slide-left">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Marriage</p>
            <p className="text-xs text-zinc-500 leading-tight">Registry Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to + '/')) || (item.to === '/marriages' && pathname === '/marriages')
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-indigo-400' : 'text-zinc-500'
                )}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Role indicator */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              role === 'ADMIN' ? 'bg-red-400' : 'bg-indigo-400'
            )}
          />
          <span className="text-xs text-zinc-500">
            {role === 'ADMIN' ? 'Administrator' : 'Operator'} Mode
          </span>
        </div>
      </div>
    </aside>
  )
}
