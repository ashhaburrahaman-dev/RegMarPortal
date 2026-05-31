import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ScrollText,
  FilePlus,
  Calendar,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentEntries } from '@/components/dashboard/RecentEntries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PaginatedResponse, MarriageRecord } from '@/types'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]!
  const currentYear = new Date().getFullYear()

  const { data: allData } = useQuery({
    queryKey: ['marriages', 'total'],
    queryFn: () => api.get<PaginatedResponse<MarriageRecord>>('/marriages?limit=1'),
  })

  const { data: todayData } = useQuery({
    queryKey: ['marriages', 'today', today],
    queryFn: () =>
      api.get<PaginatedResponse<MarriageRecord>>(
        `/marriages?search=${today}&limit=1`
      ),
  })

  const { data: yearData } = useQuery({
    queryKey: ['marriages', 'year', currentYear],
    queryFn: () =>
      api.get<PaginatedResponse<MarriageRecord>>(
        `/marriages?year=${currentYear}&limit=1`
      ),
  })

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['marriages', 'recent'],
    queryFn: () =>
      api.get<PaginatedResponse<MarriageRecord>>(
        '/marriages?limit=10&sortBy=marriageDate&order=desc'
      ),
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Overview of the Marriage Registration Registry
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Total Certificates"
          value={allData?.total ?? 0}
          icon={ScrollText}
          colorClass="text-indigo-400"
          description="All-time registrations"
        />
        <StatsCard
          label="Today's Registrations"
          value={todayData?.total ?? 0}
          icon={Clock}
          colorClass="text-emerald-400"
          description={`As of ${new Date().toLocaleDateString('en-IN')}`}
        />
        <StatsCard
          label="This Year"
          value={yearData?.total ?? 0}
          icon={TrendingUp}
          colorClass="text-purple-400"
          description={`January–December ${currentYear}`}
        />
        <StatsCard
          label="Quick Actions"
          value="New Entry"
          icon={FilePlus}
          colorClass="text-amber-400"
          description="Register a marriage"
        />
      </div>

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Recent Registrations
            </CardTitle>
            <span className="text-xs text-zinc-500">Last 10 entries</span>
          </div>
        </CardHeader>
        <CardContent>
          <RecentEntries
            entries={recentData?.data ?? []}
            isLoading={recentLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
