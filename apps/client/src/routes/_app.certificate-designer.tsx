import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, RotateCcw, Move, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/_app/certificate-designer')({
  component: CertificateDesignerPage,
})

// A4 dimensions in PDF points
const A4_W = 595.28
const A4_H = 841.89

// Display scale — PDF units to CSS pixels
const SCALE = 0.85

const DISPLAY_W = A4_W * SCALE
const DISPLAY_H = A4_H * SCALE

interface FieldCoord {
  x: number
  y: number
  size: number
}

type CoordsMap = Record<string, FieldCoord>

const FIELD_LABELS: Record<string, string> = {
  memoNumber: 'Memo No.',
  marriageDate: 'Marriage Date',
  registrationDate: 'Reg. Date',
  regBookNo: 'Reg. Book No.',
  pageNo: 'Page No.',
  regYear: 'Reg. Year',
  groomName: 'Groom Name',
  groomFatherName: "Groom Father's Name",
  groomAddress: 'Groom Address',
  brideName: 'Bride Name',
  brideFatherName: "Bride Father's Name",
  brideAddress: 'Bride Address',
  wakilName: 'Wakil Name',
  wakilFatherName: "Wakil Father's Name",
  wakilAddress: 'Wakil Address',
  witness1Name: 'Witness 1 Name',
  witness1FatherName: "Witness 1 Father's Name",
  witness1Address: 'Witness 1 Address',
  witness2Name: 'Witness 2 Name',
  witness2FatherName: "Witness 2 Father's Name",
  witness2Address: 'Witness 2 Address',
  dowerAmount: 'Dower Amount',
  paymentMethod: 'Payment Method',
  promptAmount: 'Prompt Amount',
  deferredAmount: 'Deferred Amount',
}

const FIELD_COLORS: Record<string, string> = {
  memoNumber: '#6366f1',
  marriageDate: '#6366f1',
  registrationDate: '#6366f1',
  regBookNo: '#6366f1',
  pageNo: '#6366f1',
  regYear: '#6366f1',
  groomName: '#10b981',
  groomFatherName: '#10b981',
  groomAddress: '#10b981',
  brideName: '#f59e0b',
  brideFatherName: '#f59e0b',
  brideAddress: '#f59e0b',
  wakilName: '#8b5cf6',
  wakilFatherName: '#8b5cf6',
  wakilAddress: '#8b5cf6',
  witness1Name: '#ef4444',
  witness1FatherName: '#ef4444',
  witness1Address: '#ef4444',
  witness2Name: '#ec4899',
  witness2FatherName: '#ec4899',
  witness2Address: '#ec4899',
  dowerAmount: '#0ea5e9',
  paymentMethod: '#0ea5e9',
  promptAmount: '#0ea5e9',
  deferredAmount: '#0ea5e9',
}

/**
 * Convert PDF coords (origin at bottom-left) to CSS px (origin at top-left)
 */
function pdfToDisplay(x: number, y: number): { left: number; top: number } {
  return {
    left: x * SCALE,
    top: (A4_H - y) * SCALE,
  }
}

/**
 * Convert CSS px position (origin top-left) to PDF coords (origin bottom-left)
 */
function displayToPdf(left: number, top: number): { x: number; y: number } {
  return {
    x: Math.round(left / SCALE),
    y: Math.round(A4_H - top / SCALE),
  }
}

function CertificateDesignerPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canvasRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'ADMIN'

  const [coords, setCoords] = useState<CoordsMap | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const dragOffset = useRef({ dx: 0, dy: 0 })

  const bgUrl = `${import.meta.env.VITE_API_BASE_URL}/certificate/bg`

  // Fetch current coords
  const { data: serverCoords, isLoading } = useQuery({
    queryKey: ['certificate', 'coords'],
    queryFn: () => api.get<CoordsMap>('/certificate/coords'),
  })

  useEffect(() => {
    if (serverCoords && !coords) {
      setCoords(serverCoords)
    }
  }, [serverCoords, coords])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (newCoords: CoordsMap) => api.put('/certificate/coords', newCoords),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificate', 'coords'] })
      toast.success('Coordinates saved! PDF will now use updated positions.')
    },
    onError: () => toast.error('Failed to save coordinates'),
  })

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: () => api.delete('/certificate/coords'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificate', 'coords'] })
      setCoords(null)
      toast.success('Reset to default coordinates')
    },
    onError: () => toast.error('Failed to reset coordinates'),
  })

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, fieldKey: string) => {
      if (!isAdmin) return
      e.preventDefault()
      e.stopPropagation()
      setSelectedField(fieldKey)
      setDragging(fieldKey)

      const rect = canvasRef.current!.getBoundingClientRect()
      const field = coords?.[fieldKey]
      if (!field) return
      const { left, top } = pdfToDisplay(field.x, field.y)

      dragOffset.current = {
        dx: e.clientX - rect.left - left,
        dy: e.clientY - rect.top - top,
      }
    },
    [isAdmin, coords]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !coords || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const rawLeft = e.clientX - rect.left - dragOffset.current.dx
      const rawTop = e.clientY - rect.top - dragOffset.current.dy

      // Clamp to canvas bounds
      const left = Math.max(0, Math.min(DISPLAY_W - 80, rawLeft))
      const top = Math.max(0, Math.min(DISPLAY_H - 20, rawTop))

      const { x, y } = displayToPdf(left, top)
      setCoords((prev) => ({
        ...prev!,
        [dragging]: { ...(prev![dragging] ?? {}), x, y } as FieldCoord,
      }))
    },
    [dragging, coords]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <p>Certificate Designer is available to administrators only.</p>
      </div>
    )
  }

  if (isLoading || !coords) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 animate-pulse">
        Loading designer…
      </div>
    )
  }

  const selectedCoord = selectedField ? coords[selectedField] : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificate Designer</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Drag field labels to adjust their positions on the PDF certificate.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            id="reset-coords-btn"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-500"
            onClick={() => saveMutation.mutate(coords)}
            disabled={saveMutation.isPending}
            id="save-coords-btn"
          >
            <Save className="w-4 h-4" />
            Save Positions
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-indigo-950/40 border border-indigo-800/50 rounded-lg p-3">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-300">
          The canvas below matches the A4 certificate at {Math.round(SCALE * 100)}% scale. Drag any
          coloured label to reposition it. Click <strong>Save Positions</strong> to apply changes to
          all future PDF downloads.
        </p>
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div
          className="relative flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700 shadow-2xl select-none"
          style={{ width: DISPLAY_W, height: DISPLAY_H }}
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Certificate background */}
          <img
            src={bgUrl}
            alt="Certificate background"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            draggable={false}
          />

          {/* Field markers */}
          {Object.entries(coords).map(([key, coord]) => {
            const { left, top } = pdfToDisplay(coord.x, coord.y)
            const color = FIELD_COLORS[key] ?? '#94a3b8'
            const isSelected = selectedField === key
            const isDraggingThis = dragging === key

            return (
              <div
                key={key}
                onMouseDown={(e) => handleMouseDown(e, key)}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  borderColor: color,
                  backgroundColor: isSelected ? `${color}33` : `${color}1a`,
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  transform: 'translateY(-50%)',
                  zIndex: isDraggingThis ? 100 : isSelected ? 50 : 10,
                }}
                className="px-1.5 py-0.5 rounded border text-[9px] font-semibold whitespace-nowrap transition-all duration-100 hover:scale-105"
              >
                <span style={{ color }}>
                  <Move
                    className="inline w-2 h-2 mr-0.5"
                    style={{ verticalAlign: 'middle' }}
                  />
                  {FIELD_LABELS[key] ?? key}
                </span>
              </div>
            )
          })}
        </div>

        {/* Sidebar: field info */}
        <div className="flex-1 space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Selected Field</p>
            {selectedField ? (
              <>
                <p className="text-sm font-semibold text-white">
                  {FIELD_LABELS[selectedField] ?? selectedField}
                </p>
                {selectedCoord && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['x', 'y', 'size'] as const).map((prop) => (
                      <div key={prop} className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase">{prop}</label>
                        <input
                          type="number"
                          value={selectedCoord[prop]}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setCoords((prev) => ({
                              ...prev!,
                              [selectedField]: { ...(prev![selectedField] ?? {}), [prop]: val } as FieldCoord,
                            }))
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                          id={`field-${prop}-input`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-500">Click a label on the canvas to select it.</p>
            )}
          </div>

          {/* Field list */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-1 max-h-96 overflow-y-auto">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">All Fields</p>
            {Object.keys(coords).map((key) => {
              const color = FIELD_COLORS[key] ?? '#94a3b8'
              const isSelected = selectedField === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedField(key)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors hover:bg-zinc-800"
                  style={{
                    backgroundColor: isSelected ? `${color}22` : undefined,
                    color: isSelected ? color : '#a1a1aa',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {FIELD_LABELS[key] ?? key}
                  <span className="ml-auto font-mono text-zinc-600">
                    {coords[key]!.x},{coords[key]!.y}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
