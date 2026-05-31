import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { MarriageCreateSchema } from '@regmar/shared'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { MarriageDetailsForm } from '@/components/forms/MarriageDetailsForm'
import { PersonForm } from '@/components/forms/PersonForm'
import type { MarriageCreate } from '@regmar/shared'
import type { MarriageWithPersons } from '@/types'

export const Route = createFileRoute('/_app/marriages/edit/$id')({
  component: EditMarriagePage,
})

const ROLE_ORDER = ['GROOM', 'BRIDE', 'WAKIL', 'WITNESS1', 'WITNESS2'] as const
const PERSON_LABELS = ['Groom', 'Bride', 'Wakil (Representative)', 'Witness 1', 'Witness 2']

function EditMarriagePage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: marriage, isLoading } = useQuery({
    queryKey: ['marriages', id],
    queryFn: () => api.get<MarriageWithPersons>(`/marriages/${id}`),
  })

  const methods = useForm<MarriageCreate>({
    resolver: zodResolver(MarriageCreateSchema),
    mode: 'onChange',
  })

  // Pre-fill form when data loads
  useEffect(() => {
    if (!marriage) return
    const sortedPersons = ROLE_ORDER.map(
      (role) =>
        marriage.persons.find((p) => p.role === role) ?? {
          role,
          fullName: '',
          fatherName: undefined,
          pincode: undefined,
          postOffice: undefined,
          stateName: undefined,
          districtName: undefined,
          policeStation: undefined,
          villageCity: undefined,
        }
    )
    methods.reset({
      regBookNo: marriage.regBookNo,
      pageNo: marriage.pageNo,
      regYear: marriage.regYear,
      memoNumber: marriage.memoNumber,
      marriageDate: marriage.marriageDate,
      registrationDate: marriage.registrationDate,
      dowerAmount: marriage.dowerAmount,
      paymentMethod: marriage.paymentMethod,
      deferredAmount: marriage.deferredAmount,
      promptAmount: marriage.promptAmount,
      persons: sortedPersons as MarriageCreate['persons'],
    })
  }, [marriage, methods])

  const updateMutation = useMutation({
    mutationFn: (data: MarriageCreate) =>
      api.put<MarriageWithPersons>(`/marriages/${id}`, data),
    onSuccess: () => {
      toast.success('Marriage record updated successfully')
      queryClient.invalidateQueries({ queryKey: ['marriages'] })
      navigate({ to: '/marriages/$id', params: { id } })
    },
    onError: () => toast.error('Failed to update marriage record'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/marriages/$id" params={{ id }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Marriage Record</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Memo: {marriage?.memoNumber}
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit((data) => updateMutation.mutate(data))}
          className="space-y-6"
        >
          <MarriageDetailsForm editId={id} />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Party Details</h2>
            {ROLE_ORDER.map((role, i) => (
              <PersonForm
                key={role}
                role={role}
                index={i}
                label={PERSON_LABELS[i] ?? ''}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" asChild>
              <Link to="/marriages/$id" params={{ id }}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              id="update-marriage-btn"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
