import { Link } from '@tanstack/react-router'
import { Eye, FileText, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { MarriageRecord } from '@/types'

interface RecentEntriesProps {
  entries: MarriageRecord[]
  isLoading?: boolean
}

export function RecentEntries({ entries, isLoading }: RecentEntriesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-zinc-800/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No entries yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Memo No.</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Groom</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bride</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr
              key={entry.id}
              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <td className="py-3 px-4">
                <code className="text-indigo-400 font-mono text-xs bg-indigo-950/30 px-1.5 py-0.5 rounded">
                  {entry.memoNumber}
                </code>
              </td>
              <td className="py-3 px-4 text-zinc-200">{entry.groomName ?? '—'}</td>
              <td className="py-3 px-4 text-zinc-200">{entry.brideName ?? '—'}</td>
              <td className="py-3 px-4 text-zinc-400">{formatDate(entry.marriageDate)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                    <Link to="/marriages/$id" params={{ id: entry.id }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                    <Link to="/marriages/edit/$id" params={{ id: entry.id }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
