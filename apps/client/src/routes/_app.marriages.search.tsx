import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Eye, Pencil, Download, Loader2, FileText } from 'lucide-react'
import { z } from 'zod'
import { api, fetchBlob } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import type { MarriageRecord } from '@/types'

export const Route = createFileRoute('/_app/marriages/search')({
  component: SearchPage,
})

function SearchPage() {
  const [filters, setFilters] = useState({ memo: '', groom: '', bride: '', year: '' })
  const [submitted, setSubmitted] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const queryParams = new URLSearchParams()
  if (filters.memo) queryParams.set('memo', filters.memo)
  if (filters.groom) queryParams.set('groom', filters.groom)
  if (filters.bride) queryParams.set('bride', filters.bride)
  if (filters.year) queryParams.set('year', filters.year)

  const { data, isLoading } = useQuery({
    queryKey: ['marriages', 'search', filters],
    queryFn: () => api.get<{ data: MarriageRecord[] }>(`/marriages/search?${queryParams}`),
    enabled: submitted,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleDownload = async (entry: MarriageRecord) => {
    setDownloadingId(entry.id)
    try {
      const { blob, filename } = await fetchBlob(`/pdf/${entry.id}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download certificate')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Search</h1>
        <p className="text-zinc-500 text-sm mt-1">Search by multiple criteria simultaneously</p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="border border-zinc-800 rounded-xl p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-memo">Memo Number</Label>
            <Input
              id="search-memo"
              placeholder="e.g. 45A/44/2026"
              value={filters.memo}
              onChange={(e) => setFilters((p) => ({ ...p, memo: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-year">Year</Label>
            <Input
              id="search-year"
              type="number"
              placeholder="e.g. 2024"
              value={filters.year}
              onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-groom">Groom Name</Label>
            <Input
              id="search-groom"
              placeholder="Enter groom's name"
              value={filters.groom}
              onChange={(e) => setFilters((p) => ({ ...p, groom: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-bride">Bride Name</Label>
            <Input
              id="search-bride"
              placeholder="Enter bride's name"
              value={filters.bride}
              onChange={(e) => setFilters((p) => ({ ...p, bride: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" id="search-submit-btn">
            <Search className="w-4 h-4" />
            Search Registry
          </Button>
        </div>
      </form>

      {/* Results */}
      {submitted && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : (data?.data.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No records found matching your search criteria</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/40">
                <p className="text-sm text-zinc-400">
                  Found <strong className="text-white">{data?.data.length}</strong> records
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900/40">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Memo</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Groom</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bride</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map((entry) => (
                      <tr key={entry.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDownload(entry)}
                              disabled={downloadingId === entry.id}
                            >
                              {downloadingId === entry.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5 text-emerald-400" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
