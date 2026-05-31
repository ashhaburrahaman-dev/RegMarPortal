import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Eye, Pencil, Trash2, FileText, FilePlus, Search,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Download, Loader2,
} from 'lucide-react'
import { api, fetchBlob, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import type { PaginatedResponse, MarriageRecord } from '@/types'

const searchSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.string().optional(),
  year: z.coerce.number().optional(),
  sortBy: z.enum(['marriageDate', 'memoNumber']).default('marriageDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const Route = createFileRoute('/_app/marriages/')({
  validateSearch: searchSchema,
  component: MarriageListPage,
})

function MarriageListPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const queryKey = ['marriages', 'list', search]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', String(search.page))
      params.set('limit', String(search.limit))
      params.set('sortBy', search.sortBy)
      params.set('order', search.order)
      if (search.search) params.set('search', search.search)
      if (search.year) params.set('year', String(search.year))
      return api.get<PaginatedResponse<MarriageRecord>>(`/marriages?${params}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/marriages/${id}`),
    onSuccess: () => {
      toast.success('Marriage record deleted')
      queryClient.invalidateQueries({ queryKey: ['marriages'] })
    },
    onError: () => toast.error('Failed to delete record'),
  })

  const handleDownloadPdf = async (entry: MarriageRecord) => {
    setDownloadingId(entry.id)
    try {
      const { blob, filename } = await fetchBlob(`/pdf/${entry.id}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Certificate downloaded')
    } catch {
      toast.error('Failed to download certificate')
    } finally {
      setDownloadingId(null)
    }
  }

  const totalPages = Math.ceil((data?.total ?? 0) / search.limit)

  const toggleSort = (col: 'marriageDate' | 'memoNumber') => {
    navigate({
      search: (prev) => ({
        ...prev,
        sortBy: col,
        order: prev.sortBy === col && prev.order === 'desc' ? 'asc' : 'desc',
        page: 1,
      }),
    })
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (search.sortBy !== col) return <ChevronDown className="w-3 h-3 opacity-30" />
    return search.order === 'desc'
      ? <ChevronDown className="w-3 h-3 text-indigo-400" />
      : <ChevronUp className="w-3 h-3 text-indigo-400" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marriage Registry</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {data?.total ?? 0} records total
          </p>
        </div>
        <Button asChild>
          <Link to="/marriages/new">
            <FilePlus className="w-4 h-4" />
            New Entry
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search memo, groom or bride..."
          className="max-w-xs"
          defaultValue={search.search ?? ''}
          onChange={(e) => {
            navigate({
              search: (prev) => ({ ...prev, search: e.target.value || undefined, page: 1 }),
            })
          }}
          id="marriages-search"
        />
        <Input
          type="number"
          placeholder="Filter by year"
          className="w-36"
          defaultValue={search.year ?? ''}
          onChange={(e) => {
            navigate({
              search: (prev) => ({
                ...prev,
                year: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              }),
            })
          }}
          id="marriages-year-filter"
        />
        <Button variant="outline" asChild size="sm">
          <Link to="/marriages/search">
            <Search className="w-4 h-4" />
            Advanced Search
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60">
              <tr>
                <th
                  className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors select-none"
                  onClick={() => toggleSort('memoNumber')}
                >
                  <span className="flex items-center gap-1">
                    Memo No. <SortIcon col="memoNumber" />
                  </span>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Groom
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Bride
                </th>
                <th
                  className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors select-none"
                  onClick={() => toggleSort('marriageDate')}
                >
                  <span className="flex items-center gap-1">
                    Date <SortIcon col="marriageDate" />
                  </span>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-zinc-800/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-zinc-800/60 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
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
                        <Badge variant="default">{entry.regYear}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link to="/marriages/$id" params={{ id: entry.id }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          {/* Edit */}
                          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link to="/marriages/edit/$id" params={{ id: entry.id }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          {/* Download PDF */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadPdf(entry)}
                            disabled={downloadingId === entry.id}
                          >
                            {downloadingId === entry.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                          </Button>

                          {/* Delete — ADMIN only */}
                          {user?.role === 'ADMIN' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Marriage Record</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete the record for memo{' '}
                                    <strong className="text-indigo-400">{entry.memoNumber}</strong>?
                                    This action cannot be undone and will also delete all associated
                                    person records.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(entry.id)}
                                  >
                                    Delete Record
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            Page {search.page} of {totalPages} ({data?.total} records)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={search.page <= 1}
              onClick={() => navigate({ search: (p) => ({ ...p, page: p.page - 1 }) })}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={search.page >= totalPages}
              onClick={() => navigate({ search: (p) => ({ ...p, page: p.page + 1 }) })}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
