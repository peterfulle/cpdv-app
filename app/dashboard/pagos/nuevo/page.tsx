'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, CreditCard, Package, Upload, CheckCircle2, User,
  DollarSign, Search, ChevronDown,
} from 'lucide-react'
import { tokens } from '@/styles/theme'
import { formatCLP, getInitials } from '@/lib/utils'
import { useFetch } from '@/lib/useFetch'

// ── Validation schema ─────────────────────────────────────────────────
const schema = z.object({
  alumnoId:  z.string().min(1, 'Selecciona un estudiante'),
  categoria: z.enum(['1', '2'], { required_error: 'Selecciona categoría' }),
  monto:     z.string().min(1, 'Ingresa el monto').refine(
    v => !isNaN(Number(v.replace(/\./g,''))) && Number(v.replace(/\./g,'')) > 0,
    'Monto inválido'
  ),
})
type FormData = z.infer<typeof schema>

// ── Styles ────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 28px 32px;
  max-width: 680px;
  @media (max-width: 768px) { padding: 16px; }
`

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color:${tokens.gray[500]};
  background: none; border: none; cursor: pointer; padding: 0;
  margin-bottom: 24px;
  &:hover { color:${tokens.gray[800]}; }
`

const FormCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 18px;
  overflow: hidden;
`

const FormHeader = styled.div`
  padding: 22px 24px 20px;
  border-bottom: 1px solid ${tokens.gray[100]};
  h1 { font-size:18px; font-weight:800; color:${tokens.gray[900]}; }
  p  { font-size:13px; color:${tokens.gray[500]}; margin-top:3px; }
`

const FormBody = styled.div`
  padding: 24px;
  display: flex; flex-direction: column; gap: 20px;
`

const Field = styled.div`
  label {
    display: block; font-size: 12.5px; font-weight: 700;
    color: ${tokens.gray[600]}; text-transform: uppercase;
    letter-spacing: .5px; margin-bottom: 8px;
  }
`

const InputWrap = styled.div`
  position: relative;
  svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${tokens.gray[400]}; pointer-events: none; }
`

const Input = styled.input<{ hasIcon?: boolean; error?: boolean }>`
  width: 100%; padding: ${p => p.hasIcon ? '10px 14px 10px 38px' : '10px 14px'};
  border: 1.5px solid ${p => p.error ? tokens.rose[400] : tokens.gray[200]};
  border-radius: 11px; font-size: 14px; outline: none;
  transition: all .2s; background: #fff; box-sizing: border-box;
  &:focus {
    border-color: ${p => p.error ? tokens.rose[400] : tokens.brand[400]};
    box-shadow: 0 0 0 3px ${p => p.error ? tokens.rose[400]+'20' : tokens.brand[500]+'20'};
  }
`

const SelectWrap = styled.div`
  position: relative;
  svg.chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: ${tokens.gray[400]}; pointer-events: none; }
`

const Select = styled.select<{ error?: boolean }>`
  width: 100%; padding: 10px 36px 10px 14px;
  border: 1.5px solid ${p => p.error ? tokens.rose[400] : tokens.gray[200]};
  border-radius: 11px; font-size: 14px; outline: none;
  appearance: none; background: #fff; cursor: pointer;
  transition: all .2s;
  &:focus {
    border-color: ${p => p.error ? tokens.rose[400] : tokens.brand[400]};
    box-shadow: 0 0 0 3px ${p => p.error ? tokens.rose[400]+'20' : tokens.brand[500]+'20'};
  }
`

const ErrorMsg = styled.span`
  display: block; font-size: 11.5px; color: ${tokens.rose[500]}; margin-top: 5px;
`

const CategoriaGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
`

const CategoriaCard = styled.button<{ selected: boolean }>`
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 12px; cursor: pointer;
  transition: all .15s; text-align: left;
  border: 1.5px solid ${p => p.selected ? tokens.brand[400] : tokens.gray[200]};
  background: ${p => p.selected ? tokens.brand[500]+'12' : '#fff'};
  &:hover { border-color: ${tokens.brand[400]}; background: ${tokens.brand[500]+'08'}; }
  div { 
    p { font-size: 13px; font-weight: 700; color: ${p => p.selected ? tokens.brand[700] : tokens.gray[800]}; margin:0; }
    span { font-size: 11.5px; color: ${tokens.gray[400]}; }
  }
`

const CatIconWrap = styled.div<{ selected: boolean }>`
  width: 34px; height: 34px; border-radius: 9px;
  background: ${p => p.selected ? tokens.brand[500] : tokens.gray[100]};
  color: ${p => p.selected ? '#fff' : tokens.gray[400]};
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
`

const StudentPreview = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: ${tokens.brand[500]+'10'};
  border: 1px solid ${tokens.brand[400]+'30'};
  border-radius: 11px; margin-top: 8px;
`

const StudentAvatar = styled.div`
  width: 36px; height: 36px; border-radius: 9px;
  background: ${tokens.brand[500]+'25'}; color: ${tokens.brand[600]};
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800;
`

const UploadZone = styled.label<{ hasFile: boolean }>`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 28px; border-radius: 12px; cursor: pointer;
  border: 1.5px dashed ${p => p.hasFile ? tokens.emerald[400] : tokens.gray[200]};
  background: ${p => p.hasFile ? tokens.emerald[500]+'08' : tokens.gray[50]};
  transition: all .2s;
  &:hover { border-color: ${tokens.brand[400]}; background: ${tokens.brand[500]+'06'}; }
  p { font-size: 13px; color: ${tokens.gray[500]}; margin: 0; }
  span { font-size: 11.5px; color: ${tokens.gray[400]}; }
  input[type=file] { display: none; }
`

const MontoDisplay = styled.div`
  padding: 12px 14px;
  background: ${tokens.emerald[500]+'10'};
  border: 1px solid ${tokens.emerald[400]+'30'};
  border-radius: 11px; margin-top: 8px;
  span { font-size: 11.5px; color: ${tokens.gray[500]}; }
  strong { font-size: 20px; font-weight: 800; color: ${tokens.emerald[600]}; display: block; margin-top: 2px; }
`

const SubmitBtn = styled.button`
  width: 100%; padding: 13px;
  background: ${tokens.brand[500]}; color: #fff;
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover { background: ${tokens.brand[600]}; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`

const SuccessBanner = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px;
  padding: 48px 24px; text-align: center;
  h2 { font-size: 20px; font-weight: 800; color: ${tokens.gray[900]}; }
  p  { font-size: 13.5px; color: ${tokens.gray[500]}; }
`

// ── Component ─────────────────────────────────────────────────────────
export default function NuevoPagoPage() {
  const router      = useRouter()
  const params      = useSearchParams()
  const preAlumnoId = params.get('alumnoId') ?? ''

  const { data } = useFetch<any>('/api/alumnos')
  const alumnos: any[] = data?.alumnos ?? []
  const items:   any[] = data?.items   ?? []

  const [comprobante, setComprobante] = useState<File | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [montoRaw,    setMontoRaw]    = useState('')

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { alumnoId: preAlumnoId, categoria: '2' },
  })

  const alumnoId  = watch('alumnoId')
  const categoria = watch('categoria')

  const alumnoSel = alumnos.find(a => String(a.id) === alumnoId)

  // Build pending info for selected alumno + categoria
  const pendienteCategoria = (() => {
    if (!alumnoSel || !categoria) return 0
    const catNum = Number(categoria)
    return alumnoSel.pagos
      ? (() => {
          const pagosCat = (alumnoSel.pagos || []).filter((p: any) => p.tipo === catNum)
          const itemsCat = items.filter((i: any) => i.tipo === catNum)
          const totalPagado = pagosCat.reduce((s: number, p: any) => s + p.monto, 0)
          const totalDeuda  = itemsCat.reduce((s: number, i: any) => s + (categoria === '1' ? (alumnoSel.tallaPoleron?.valor ?? i.valor) : i.valor), 0)
          return Math.max(0, totalDeuda - totalPagado)
        })()
      : 0
  })()

  const formatMontoInput = (val: string) => {
    const num = val.replace(/\D/g, '')
    return num ? Number(num).toLocaleString('es-CL') : ''
  }

  const onSubmit = async (d: FormData) => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('tipo', 'alumno')
      fd.append('alumnoId',   d.alumnoId)
      fd.append('categoriaId', d.categoria)
      fd.append('monto', String(Number(d.monto.replace(/\./g,''))))
      if (comprobante) fd.append('comprobante', comprobante)

      const res = await fetch('/api/pagos', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      alert('Error al registrar el pago. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Page>
        <FormCard initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }}>
          <SuccessBanner initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
            <CheckCircle2 size={56} color={tokens.emerald[500]} />
            <h2>¡Pago Registrado!</h2>
            <p>El pago fue distribuido correctamente en los ítems pendientes del estudiante.</p>
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <SubmitBtn style={{ width:'auto', padding:'10px 20px', background: tokens.emerald[500] }}
                onClick={() => alumnoId ? router.push(`/dashboard/estudiantes/${alumnoId}`) : router.push('/dashboard/estudiantes')}>
                Ver Estudiante
              </SubmitBtn>
              <SubmitBtn style={{ width:'auto', padding:'10px 20px', background:tokens.gray[200], color:tokens.gray[700] }}
                onClick={() => { setSuccess(false); setMontoRaw(''); setValue('monto','') }}>
                Nuevo Pago
              </SubmitBtn>
            </div>
          </SuccessBanner>
        </FormCard>
      </Page>
    )
  }

  return (
    <Page>
      <BackBtn onClick={() => router.back()}>
        <ArrowLeft size={14} /> Volver
      </BackBtn>

      <FormCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
        <FormHeader>
          <h1>Registrar Pago de Estudiante</h1>
          <p>El monto se distribuye automáticamente en los ítems pendientes</p>
        </FormHeader>

        <FormBody as="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Estudiante */}
          <Field>
            <label>Estudiante</label>
            <InputWrap>
              <User size={14} />
              <SelectWrap>
                <Select {...register('alumnoId')} error={!!errors.alumnoId}>
                  <option value="">-- Selecciona un estudiante --</option>
                  {alumnos.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </Select>
                <ChevronDown size={14} className="chevron" />
              </SelectWrap>
            </InputWrap>
            {errors.alumnoId && <ErrorMsg>{errors.alumnoId.message}</ErrorMsg>}

            {alumnoSel && (
              <StudentPreview>
                <StudentAvatar>{getInitials(alumnoSel.nombre)}</StudentAvatar>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:tokens.gray[800], margin:0 }}>{alumnoSel.nombre}</p>
                  <p style={{ fontSize:11.5, color:tokens.gray[500], margin:'2px 0 0' }}>
                    Deuda total: <strong style={{ color: tokens.rose[600] }}>{formatCLP(alumnoSel.saldoPendiente)}</strong>
                  </p>
                </div>
              </StudentPreview>
            )}
          </Field>

          {/* Categoría */}
          <Field>
            <label>Categoría de Pago</label>
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <CategoriaGrid>
                  <CategoriaCard type="button" selected={field.value === '1'} onClick={() => field.onChange('1')}>
                    <CatIconWrap selected={field.value === '1'}><Package size={16} /></CatIconWrap>
                    <div><p>Poleron</p><span>Prenda de vestir</span></div>
                  </CategoriaCard>
                  <CategoriaCard type="button" selected={field.value === '2'} onClick={() => field.onChange('2')}>
                    <CatIconWrap selected={field.value === '2'}><CreditCard size={16} /></CatIconWrap>
                    <div><p>Cuota de Curso</p><span>Mensualidad</span></div>
                  </CategoriaCard>
                </CategoriaGrid>
              )}
            />
            {errors.categoria && <ErrorMsg>{errors.categoria.message}</ErrorMsg>}

            {alumnoSel && pendienteCategoria > 0 && (
              <div style={{ fontSize:12, color:tokens.gray[400], marginTop:8, display:'flex', gap:4 }}>
                Pendiente en esta categoría:
                <strong style={{ color:tokens.rose[600] }}>{formatCLP(pendienteCategoria)}</strong>
              </div>
            )}
          </Field>

          {/* Monto */}
          <Field>
            <label>Monto a Pagar (CLP)</label>
            <InputWrap>
              <DollarSign size={14} />
              <Controller
                name="monto"
                control={control}
                render={({ field }) => (
                  <Input
                    hasIcon
                    error={!!errors.monto}
                    placeholder="0"
                    value={montoRaw}
                    onChange={e => {
                      const fmt = formatMontoInput(e.target.value)
                      setMontoRaw(fmt)
                      field.onChange(fmt)
                    }}
                  />
                )}
              />
            </InputWrap>
            {errors.monto && <ErrorMsg>{errors.monto.message}</ErrorMsg>}
            {montoRaw && !errors.monto && (
              <MontoDisplay>
                <span>Monto a registrar</span>
                <strong>{formatCLP(Number(montoRaw.replace(/\./g,'')))}</strong>
              </MontoDisplay>
            )}
            {alumnoSel && pendienteCategoria > 0 && (
              <button
                type="button"
                style={{ marginTop:6, fontSize:12, color:tokens.brand[500], background:'none', border:'none', cursor:'pointer', padding:0 }}
                onClick={() => {
                  const fmt = pendienteCategoria.toLocaleString('es-CL')
                  setMontoRaw(fmt)
                  setValue('monto', fmt)
                }}
              >
                ↑ Completar pago pendiente ({formatCLP(pendienteCategoria)})
              </button>
            )}
          </Field>

          {/* Comprobante */}
          <Field>
            <label>Comprobante (opcional)</label>
            <UploadZone htmlFor="comp-upload" hasFile={!!comprobante}>
              <input id="comp-upload" type="file" accept="image/*,.pdf"
                onChange={e => setComprobante(e.target.files?.[0] ?? null)} />
              {comprobante
                ? <><CheckCircle2 size={22} color={tokens.emerald[500]} /><p>{comprobante.name}</p></>
                : <><Upload size={22} color={tokens.gray[400]} /><p>Haz clic o arrastra un archivo</p><span>PNG, JPG, PDF · Máx 5MB</span></>
              }
            </UploadZone>
          </Field>

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? '...' : <><CreditCard size={16} /> Registrar Pago</>}
          </SubmitBtn>
        </FormBody>
      </FormCard>
    </Page>
  )
}
