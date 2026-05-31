import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLogout } from '@/hooks/useAuth'
import { formatUnixTimestamp } from '@/lib/utils'
import type { ApiUser } from '@/types'

interface NavbarProps {
  user: ApiUser | null
}

export function Navbar({ user }: NavbarProps) {
  const logout = useLogout()

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: page breadcrumb (empty — filled by child routes if needed) */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">Muhammadan Marriage Registration Office</span>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="text-right">
                <p className="text-zinc-200 font-medium leading-tight">{user.fullName}</p>
                <p className="text-zinc-500 text-xs leading-tight">
                  Last login: {formatUnixTimestamp(user.lastLogin)}
                </p>
              </div>
              <Badge variant={user.role === 'ADMIN' ? 'admin' : 'operator'}>
                {user.role}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              title="Logout"
              id="logout-btn"
              className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
