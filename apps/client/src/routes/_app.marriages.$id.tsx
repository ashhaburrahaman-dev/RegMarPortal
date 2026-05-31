import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Download, Pencil, Loader2, User } from 'lucide-react'
import { api, fetchBlob } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { MarriageWithPersons, PersonRecord } from '@/types'

export const Route = createFileRoute('/_app/marriages/$id')({
  component: MarriageDetailPage,
})

const ROLE_LABELS: Record<string, string> = {
  GROOM: 'Groom',
  BRIDE: 'Bride',
  WAKIL: 'Wakil',
  WITNESS1: 'Witness 1',
  WITNESS2: 'Witness 2',
}

function PersonCard({ person }: { person: PersonRecord }) {
  const addressParts = [
    person.villageCity,
    person.policeStation,
    person.districtName,
    person.stateName,
    person.pincode,
  ].filter(Boolean)

  return (
    <div className="border border-zinc-800 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            {ROLE_LABELS[person.role]}
          </p>
          <p className="font-semibold text-zinc-100">{person.fullName}</p>
        </div>
      </div>
      {person.fatherName && (
        <p className="text-sm text-zinc-400">S/O: {person.fatherName}</p>
      )}
      {addressParts.length > 0 && (
        <p className="text-xs text-zinc-500">{addressParts.join(', ')}</p>
      )}
      {person.postOffice && (
        <p className="text-xs text-zinc-500">P.O.: {person.postOffice}</p>
      )}
    </div>
  )
}

function MarriageDetailPage() {
  const { id } = Route.useParams()
  const { user } = useAuth()
  const [downloading, setDownloading] = useState(false)

  const { data: marriage, isLoading } = useQuery({
    queryKey: ['marriages', id],
    queryFn: () => api.get<MarriageWithPersons>(`/marriages/${id}`),
  })

  const handleDownload = async () => {
    if (!marriage) return
    setDownloading(true)
    try {
      const { blob, filename } = await fetchBlob(`/pdf/${id}`)
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
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!marriage) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p>Marriage record not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/marriages">Back to list</Link>
        </Button>
      </div>
    )
  }

  const groom = marriage.persons.find((p) => p.role === 'GROOM')
  const bride = marriage.persons.find((p) => p.role === 'BRIDE')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/marriages">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Marriage Certificate</h1>
              <code className="text-sm text-indigo-400 font-mono bg-indigo-950/30 px-2 py-0.5 rounded">
                {marriage.memoNumber}
              </code>
            </div>
            <p className="text-zinc-500 text-sm mt-1">
              {groom?.fullName} & {bride?.fullName}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-500"
            id="download-cert-btn"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Certificate
          </Button>
          <Button variant="outline" asChild>
            <Link to="/marriages/edit/$id" params={{ id }}>
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Registration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Memo Number', value: marriage.memoNumber, mono: true },
              { label: 'Registration Book', value: marriage.regBookNo },
              { label: 'Page Number', value: marriage.pageNo },
              { label: 'Year', value: String(marriage.regYear) },
              { label: 'Marriage Date', value: formatDate(marriage.marriageDate) },
              { label: 'Registration Date', value: formatDate(marriage.registrationDate) },
            ].map(({ label, value, mono }) => (
              <div key={label} className="space-y-1">
                <dt className="text-xs text-zinc-500 uppercase tracking-wider">{label}</dt>
                <dd className={mono ? 'font-mono text-indigo-400' : 'text-zinc-200'}>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Dower Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dower & Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <dt className="text-xs text-zinc-500 uppercase tracking-wider">Total Dower</dt>
              <dd className="text-zinc-200 font-semibold">{formatCurrency(marriage.dowerAmount)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-zinc-500 uppercase tracking-wider">Method</dt>
              <dd>
                <Badge variant={marriage.paymentMethod === 'CASH' ? 'success' : 'warning'}>
                  {marriage.paymentMethod}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-zinc-500 uppercase tracking-wider">Prompt Amount</dt>
              <dd className="text-zinc-200">{formatCurrency(marriage.promptAmount)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-zinc-500 uppercase tracking-wider">Deferred Amount</dt>
              <dd className="text-zinc-200">{formatCurrency(marriage.deferredAmount)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Persons */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Party Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marriage.persons.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      </div>
    </div>
  )
}
