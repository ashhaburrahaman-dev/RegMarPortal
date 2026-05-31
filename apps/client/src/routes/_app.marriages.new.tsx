import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { MarriageCreateSchema } from '@regmar/shared'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { MarriageDetailsForm } from '@/components/forms/MarriageDetailsForm'
import { PersonForm } from '@/components/forms/PersonForm'
import type { MarriageCreate } from '@regmar/shared'

export const Route = createFileRoute('/_app/marriages/new')({
  component: NewMarriagePage,
})

const DEFAULT_VALUES: Partial<MarriageCreate> = {
  regYear: new Date().getFullYear(),
  paymentMethod: 'CASH',
  dowerAmount: 0,
  deferredAmount: 0,
  promptAmount: 0,
  persons: [
    { role: 'GROOM', fullName: '' },
    { role: 'BRIDE', fullName: '' },
    { role: 'WAKIL', fullName: '' },
    { role: 'WITNESS1', fullName: '' },
    { role: 'WITNESS2', fullName: '' },
  ],
}

const PERSON_LABELS = ['Groom', 'Bride', 'Wakil (Representative)', 'Witness 1', 'Witness 2']

function NewMarriagePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const methods = useForm<MarriageCreate>({
    resolver: zodResolver(MarriageCreateSchema),
    defaultValues: DEFAULT_VALUES as MarriageCreate,
    mode: 'onChange',
  })

  const createMutation = useMutation({
    mutationFn: (data: MarriageCreate) =>
      api.post<{ id: string; memoNumber: string }>('/marriages', data),
    onSuccess: (result) => {
      toast.success(`Marriage record created — ${result.memoNumber}`)
      queryClient.invalidateQueries({ queryKey: ['marriages'] })
      navigate({ to: '/marriages/$id', params: { id: result.id } })
    },
    onError: (err) => {
      if (err instanceof Error && err.message.includes('already exists')) {
        toast.error('A record with this memo number already exists')
      } else {
        toast.error('Failed to create marriage record')
      }
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/marriages">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Marriage Entry</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Register a new marriage certificate</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
          {/* Marriage details */}
          <MarriageDetailsForm />

          {/* Persons */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Party Details</h2>
            {([0, 1, 2, 3, 4] as const).map((i) => (
              <PersonForm
                key={i}
                role={(['GROOM', 'BRIDE', 'WAKIL', 'WITNESS1', 'WITNESS2'] as const)[i]}
                index={i}
                label={PERSON_LABELS[i] ?? ''}
              />
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" asChild>
              <Link to="/marriages">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              id="create-marriage-btn"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Marriage Record'
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
