import { useEffect } from 'react'
import { useFormContext, useWatch, Controller } from 'react-hook-form'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMemoValidation } from '@/hooks/useMemoValidation'
import type { MarriageCreate } from '@regmar/shared'

interface MarriageDetailsFormProps {
  editId?: string // Present when editing — excludes this ID from memo validation
}

export function MarriageDetailsForm({ editId }: MarriageDetailsFormProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<MarriageCreate>()

  const regBookNo = useWatch({ control, name: 'regBookNo' })
  const pageNo = useWatch({ control, name: 'pageNo' })
  const regYear = useWatch({ control, name: 'regYear' })
  const dowerAmount = useWatch({ control, name: 'dowerAmount' })
  const paymentMethod = useWatch({ control, name: 'paymentMethod' })
  const promptAmount = useWatch({ control, name: 'promptAmount' })
  const memoNumber = useWatch({ control, name: 'memoNumber' })

  // Auto-generate memo number from regBookNo + pageNo + regYear
  useEffect(() => {
    if (regBookNo && pageNo && regYear) {
      const generated = `${regBookNo}/${pageNo}/${regYear}`
      setValue('memoNumber', generated, { shouldValidate: false })
    }
  }, [regBookNo, pageNo, regYear, setValue])

  // Auto-calculate deferredAmount
  useEffect(() => {
    const dower = Number(dowerAmount) || 0
    const prompt = Number(promptAmount) || 0

    if (paymentMethod === 'CASH') {
      setValue('deferredAmount', 0, { shouldValidate: false })
      setValue('promptAmount', dower, { shouldValidate: false })
    } else if (paymentMethod === 'DEFERRED') {
      const deferred = Math.max(0, dower - prompt)
      setValue('deferredAmount', deferred, { shouldValidate: false })
    }
  }, [dowerAmount, paymentMethod, promptAmount, setValue])

  // Memo validation
  const {
    data: memoValidation,
    isLoading: memoValidating,
    isFetching: memoFetching,
  } = useMemoValidation(memoNumber, editId)

  const memoExists = memoValidation?.exists

  return (
    <div className="space-y-6">
      {/* ── Registration Details ─────────────────────────────────── */}
      <div className="border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-purple-500" />
          <h3 className="text-sm font-semibold text-zinc-200">Registration Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reg Book No */}
          <div className="space-y-1.5">
            <Label htmlFor="regBookNo">
              Book No. <span className="text-red-400">*</span>
            </Label>
            <Input
              id="regBookNo"
              {...register('regBookNo')}
              placeholder="e.g. 45A"
            />
            {errors.regBookNo && (
              <p className="text-xs text-red-400">{errors.regBookNo.message}</p>
            )}
          </div>

          {/* Page No */}
          <div className="space-y-1.5">
            <Label htmlFor="pageNo">
              Page No. <span className="text-red-400">*</span>
            </Label>
            <Input
              id="pageNo"
              {...register('pageNo')}
              placeholder="e.g. 44"
            />
            {errors.pageNo && (
              <p className="text-xs text-red-400">{errors.pageNo.message}</p>
            )}
          </div>

          {/* Reg Year */}
          <div className="space-y-1.5">
            <Label htmlFor="regYear">
              Year <span className="text-red-400">*</span>
            </Label>
            <Input
              id="regYear"
              type="number"
              {...register('regYear', { valueAsNumber: true })}
              placeholder={String(new Date().getFullYear())}
              min={1900}
              max={2100}
            />
            {errors.regYear && (
              <p className="text-xs text-red-400">{errors.regYear.message}</p>
            )}
          </div>
        </div>

        {/* Memo Number — auto-generated, read-only */}
        <div className="space-y-1.5">
          <Label htmlFor="memoNumber">
            Memo Number (auto-generated)
          </Label>
          <div className="relative">
            <Input
              id="memoNumber"
              {...register('memoNumber')}
              readOnly
              className="bg-zinc-800/40 text-indigo-300 font-mono cursor-default pr-10"
              placeholder="Fill Book No., Page No. and Year above"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {(memoValidating || memoFetching) && memoNumber && (
                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
              )}
              {!memoValidating && !memoFetching && memoNumber && memoExists === false && (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
              {!memoValidating && !memoFetching && memoExists === true && (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          {memoExists === true && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              This memo number already exists in the registry
            </p>
          )}
          {errors.memoNumber && (
            <p className="text-xs text-red-400">{errors.memoNumber.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marriage Date */}
          <div className="space-y-1.5">
            <Label htmlFor="marriageDate">
              Marriage Date <span className="text-red-400">*</span>
            </Label>
            <Input
              id="marriageDate"
              type="date"
              {...register('marriageDate')}
            />
            {errors.marriageDate && (
              <p className="text-xs text-red-400">{errors.marriageDate.message}</p>
            )}
          </div>

          {/* Registration Date */}
          <div className="space-y-1.5">
            <Label htmlFor="registrationDate">
              Registration Date <span className="text-red-400">*</span>
            </Label>
            <Input
              id="registrationDate"
              type="date"
              {...register('registrationDate')}
            />
            {errors.registrationDate && (
              <p className="text-xs text-red-400">{errors.registrationDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Dower / Payment Details ──────────────────────────────── */}
      <div className="border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-zinc-200">Dower & Payment</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Dower Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="dowerAmount">
              Total Dower Amount (₹) <span className="text-red-400">*</span>
            </Label>
            <Input
              id="dowerAmount"
              type="number"
              step="0.01"
              min="0"
              {...register('dowerAmount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.dowerAmount && (
              <p className="text-xs text-red-400">{errors.dowerAmount.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label>
              Payment Method <span className="text-red-400">*</span>
            </Label>
            <div className="flex gap-4 pt-2">
              {(['CASH', 'DEFERRED'] as const).map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    value={method}
                    {...register('paymentMethod')}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100">
                    {method === 'CASH' ? '💵 Cash' : '📅 Deferred'}
                  </span>
                </label>
              ))}
            </div>
            {errors.paymentMethod && (
              <p className="text-xs text-red-400">{errors.paymentMethod.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prompt Amount: writable if DEFERRED, read-only if CASH */}
          <div className="space-y-1.5">
            <Label htmlFor="promptAmount">
              Prompt Amount (₹) {paymentMethod === 'DEFERRED' && <span className="text-red-400">*</span>}
              {paymentMethod === 'CASH' && <span className="ml-1.5 text-xs text-zinc-500">(equals total dower)</span>}
            </Label>
            <Input
              id="promptAmount"
              type="number"
              step="0.01"
              min="0"
              {...register('promptAmount', { valueAsNumber: true })}
              readOnly={paymentMethod === 'CASH'}
              className={paymentMethod === 'CASH' ? 'bg-zinc-800/40 text-emerald-300 cursor-default' : ''}
              placeholder="0.00"
            />
            {errors.promptAmount && (
              <p className="text-xs text-red-400">{errors.promptAmount.message}</p>
            )}
          </div>

          {/* Deferred Amount: auto-calculated, read-only */}
          {paymentMethod === 'DEFERRED' && (
            <div className="space-y-1.5">
              <Label htmlFor="deferredAmount">
                Deferred Amount (₹)
                <span className="ml-1.5 text-xs text-zinc-500">(auto-calculated)</span>
              </Label>
              <Input
                id="deferredAmount"
                type="number"
                {...register('deferredAmount', { valueAsNumber: true })}
                readOnly
                className="bg-zinc-800/40 text-indigo-300 cursor-default"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
