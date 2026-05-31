import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'default' | 'admin' | 'operator' | 'success' | 'warning' | 'destructive'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    admin: 'bg-red-950/60 text-red-400 border-red-900/50',
    operator: 'bg-indigo-950/60 text-indigo-400 border-indigo-900/50',
    success: 'bg-green-950/60 text-green-400 border-green-900/50',
    warning: 'bg-yellow-950/60 text-yellow-400 border-yellow-900/50',
    destructive: 'bg-red-950/60 text-red-400 border-red-900/50',
  }
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'

export { Badge }
