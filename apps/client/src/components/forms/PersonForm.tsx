import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { MapPin, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePincode } from '@/hooks/usePincode'
import type { PersonRole } from '@/types'
import type { MarriageCreate } from '@regmar/shared'

interface PersonFormProps {
  role: PersonRole
  index: number
  label: string
}

const ROLE_LABELS: Record<PersonRole, string> = {
  GROOM: 'Groom',
  BRIDE: 'Bride',
  WAKIL: 'Wakil (Representative)',
  WITNESS1: 'Witness 1',
  WITNESS2: 'Witness 2',
}

export function PersonForm({ role, index, label }: PersonFormProps) {
  const { register, setValue, formState: { errors }, control } = useFormContext<MarriageCreate>()
  const pincode = useWatch({ control, name: `persons.${index}.pincode` })

  const {
    data: pincodeData,
    isLoading: pincodeLoading,
    isError: pincodeError,
  } = usePincode(pincode ?? undefined)

  // Auto-fill state and district when pincode resolves
  useEffect(() => {
    if (pincodeData) {
      setValue(`persons.${index}.stateName`, pincodeData.state, { shouldValidate: true })
      setValue(`persons.${index}.districtName`, pincodeData.district, { shouldValidate: true })
    }
  }, [pincodeData, index, setValue])

  const personErrors = errors.persons?.[index]

  return (
    <div className="border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-zinc-700 transition-colors">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-indigo-500" />
        <h3 className="text-sm font-semibold text-zinc-200">{label || ROLE_LABELS[role]}</h3>
      </div>

      {/* Hidden role field */}
      <input type="hidden" {...register(`persons.${index}.role`)} value={role} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-name`}>
            Full Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id={`person-${index}-name`}
            {...register(`persons.${index}.fullName`)}
            placeholder="Enter full name"
          />
          {personErrors?.fullName && (
            <p className="text-xs text-red-400">{personErrors.fullName.message}</p>
          )}
        </div>

        {/* Father Name */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-father`}>Father's Name</Label>
          <Input
            id={`person-${index}-father`}
            {...register(`persons.${index}.fatherName`)}
            placeholder="Enter father's name"
          />
        </div>

        {/* Pincode */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-pincode`}>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Pincode
            </div>
          </Label>
          <div className="relative">
            <Input
              id={`person-${index}-pincode`}
              {...register(`persons.${index}.pincode`)}
              placeholder="6-digit pincode"
              maxLength={6}
              inputMode="numeric"
              className="pr-8"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {pincodeLoading && <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />}
              {!pincodeLoading && pincodeData && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
              {!pincodeLoading && pincodeError && pincode?.length === 6 && (
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
          </div>
          {pincodeError && pincode?.length === 6 && (
            <p className="text-xs text-red-400">Pincode not found</p>
          )}
        </div>

        {/* Post Office — dropdown populated from pincode API */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-po`}>Post Office</Label>
          {pincodeData?.postOffices.length ? (
            <Select
              onValueChange={(val) =>
                setValue(`persons.${index}.postOffice`, val, { shouldValidate: true })
              }
            >
              <SelectTrigger id={`person-${index}-po`}>
                <SelectValue placeholder="Select post office" />
              </SelectTrigger>
              <SelectContent>
                {pincodeData.postOffices.map((po) => (
                  <SelectItem key={po.name} value={po.name}>
                    {po.name}
                    {po.branchType !== 'S.O.' && (
                      <span className="ml-1 text-xs text-zinc-500">({po.branchType})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`person-${index}-po`}
              {...register(`persons.${index}.postOffice`)}
              placeholder={pincodeLoading ? 'Loading...' : 'Enter post office'}
              disabled={pincodeLoading}
            />
          )}
        </div>

        {/* State — auto-filled, read-only when pincode resolved */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-state`}>State</Label>
          <Input
            id={`person-${index}-state`}
            {...register(`persons.${index}.stateName`)}
            placeholder="Auto-filled from pincode"
            readOnly={!!pincodeData}
            className={pincodeData ? 'bg-zinc-800/40 text-zinc-300 cursor-default' : ''}
          />
        </div>

        {/* District — auto-filled, read-only when pincode resolved */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-district`}>District</Label>
          <Input
            id={`person-${index}-district`}
            {...register(`persons.${index}.districtName`)}
            placeholder="Auto-filled from pincode"
            readOnly={!!pincodeData}
            className={pincodeData ? 'bg-zinc-800/40 text-zinc-300 cursor-default' : ''}
          />
        </div>

        {/* Police Station */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-ps`}>Police Station</Label>
          <Input
            id={`person-${index}-ps`}
            {...register(`persons.${index}.policeStation`)}
            placeholder="Enter police station"
          />
        </div>

        {/* Village / City */}
        <div className="space-y-1.5">
          <Label htmlFor={`person-${index}-village`}>Village / City</Label>
          <Input
            id={`person-${index}-village`}
            {...register(`persons.${index}.villageCity`)}
            placeholder="Enter village or city"
          />
        </div>
      </div>
    </div>
  )
}
