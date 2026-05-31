import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  colorClass?: string
}

export function StatsCard({ label, value, icon: Icon, description, colorClass = 'text-indigo-400' }: StatsCardProps) {
  return (
    <Card className="hover:border-zinc-700 hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={cn('text-3xl font-bold tabular-nums', colorClass)}>
              {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </p>
            {description && (
              <p className="text-xs text-zinc-500">{description}</p>
            )}
          </div>
          <div className={cn(
            'p-2.5 rounded-lg bg-zinc-800/60 group-hover:scale-110 transition-transform duration-300',
          )}>
            <Icon className={cn('w-5 h-5', colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
