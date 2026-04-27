'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, TrendingUp, Upload, CheckCircle2, DollarSign, FileText,
} from 'lucide-react'
import { tokens } from '@/styles/theme'
import { formatCLP } from '@/lib/utils'

// ── Validation ────────────────────────────────────────────────────────
const schema = z.object({
  concepto: z.string().min(2, 'Ingresa el concepto del ingreso'),
  monto: z.string().min(1, 'Ingresa el monto').refine(
    v => !isNaN(Number(v.replace(/\./g,''))) && Number(v.replace(/\./g,'')) > 0,
    'Monto inválido'
  ),
})
type FormData = z.infer<typeof schema>

// ── Styles ────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 28px 32px; max-width: 600px;
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
  background: #fff; border: 1px solid ${tokens.gray[100]};
  border-radius: 18px; overflow: hidden;
`

const FormHeader = styled.div`
  padding: 22px 24px 20px; border-bottom: 1px solid ${tokens.gray[100]};
  display: flex; align-items: center; gap: 12px;
  h1 { font-size: 18px; font-weight: 800; color: ${tokens.gray[900]}; }
  p  { font-size: 13px; color: ${tokens.gray[500]}; margin-top: 3px; }
`

const IconBox = styled.div`
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: ${tokens.emerald[500]+'18'}; color: ${tokens.emerald[600]};
  display: flex; align-items: center; justify-content: center;
`

const FormBody = styled.div`
  padding: 24px; display: flex; flex-direction: column; gap: 20px;
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
  svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:${tokens.gray[400]}; pointer-events:none; }
`

const Input = styled.input<{ hasIcon?: boolean; error?: boolean }>`
  width: 100%; padding: ${p => p.hasIcon ? '10px 14px 10px 38px' : '10px 14px'};
  border: 1.5px solid ${p => p.error ? tokens.rose[400] : tokens.gray[200]};
  border-radius: 11px; font-size: 14px; outline: none;
  transition: all .2s; background:#fff; box-sizing: border-box;
  &:focus {
    border-color: ${tokens.emerald[400]};
    box-shadow: 0 0 0 3px ${tokens.emerald[400]+'20'};
  }
`

const ErrorMsg = styled.span`
  display: block; font-size: 11.5px; color: ${tokens.rose[500]}; margin-top: 5px;
`

const MontoDisplay = styled.div`
  padding: 11px 13px; background: ${tokens.emerald[500]+'08'};
  border: 1px solid ${tokens.emerald[400]+'25'}; border-radius: 11px; margin-top: 8px;
  span { font-size: 11.5px; color: ${tokens.gray[500]}; }
  strong { font-size: 20px; font-weight: 800; color: ${tokens.emerald[600]}; display: block; margin-top: 2px; }
`

const UploadZone = styled.label<{ hasFile: boolean }>`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 24px; border-radius: 12px; cursor: pointer;
  border: 1.5px dashed ${p => p.hasFile ? tokens.emerald[400] : tokens.gray[200]};
  background: ${p => p.hasFile ? tokens.emerald[500]+'08' : tokens.gray[50]};
  transition: all .2s;
  &:hover { border-color: ${tokens.emerald[400]}; background: ${tokens.emerald[500]+'06'}; }
  p { font-size: 13px; color: ${tokens.gray[500]}; margin: 0; }
  span { font-size: 11.5px; color: ${tokens.gray[400]}; }
  input[type=file] { display: none; }
`

const SubmitBtn = styled.button`
  width: 100%; padding: 13px;
  background: ${tokens.emerald[500]}; color: #fff;
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover { background: ${tokens.emerald[600]}; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`

const SuccessBanner = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 48px 24px; text-align: center;
  h2 { font-size: 20px; font-weight: 800; color: ${tokens.gray[900]}; }
  p  { font-size: 13.5px; color: ${tokens.gray[500]}; }
`

// ── Component ─────────────────────────────────────────────────────────
export default function NuevoIngresoPage() {
  const router = useRouter()
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [montoRaw,    setMontoRaw]    = useState('')

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const formatMontoInput = (val: string) => {
    const num = val.replace(/\D/g, '')
    return num ? Number(num).toLocaleString('es-CL') : ''
  }

  const onSubmit = async (d: FormData) => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('tipo', 'otro')
      fd.append('conceptoOtro', d.concepto)
      fd.append('monto', String(Number(d.monto.replace(/\./g,''))))
      if (comprobante) fd.append('comprobante', comprobante)

      const res = await fetch('/api/pagos', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      alert('Error al registrar el ingreso. Intenta nuevamente.')
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
            <h2>¡Ingreso Registrado!</h2>
            <p>El ingreso fue guardado correctamente en el sistema.</p>
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <SubmitBtn style={{ width:'auto', padding:'10px 20px' }}
                onClick={() => router.push('/dashboard')}>
                Ir al Dashboard
              </SubmitBtn>
              <SubmitBtn style={{ width:'auto', padding:'10px 20px', background:tokens.gray[200], color:tokens.gray[700] }}
                onClick={() => { setSuccess(false); setMontoRaw(''); reset(); setComprobante(null) }}>
                Nuevo Ingreso
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
          <IconBox><TrendingUp size={20} /></IconBox>
          <div>
            <h1>Registrar Otro Ingreso</h1>
            <p>Agrega un ingreso adicional al balance del curso</p>
          </div>
        </FormHeader>

        <FormBody as="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Concepto */}
          <Field>
            <label>Concepto del Ingreso</label>
            <InputWrap>
              <FileText size={14} />
              <Input
                hasIcon
                error={!!errors.concepto}
                placeholder="Ej: Donación, venta de rifas, etc."
                {...register('concepto')}
              />
            </InputWrap>
            {errors.concepto && <ErrorMsg>{errors.concepto.message}</ErrorMsg>}
          </Field>

          {/* Monto */}
          <Field>
            <label>Monto (CLP)</label>
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
                <span>Monto del ingreso</span>
                <strong>+{formatCLP(Number(montoRaw.replace(/\./g,'')))}</strong>
              </MontoDisplay>
            )}
          </Field>

          {/* Comprobante */}
          <Field>
            <label>Comprobante (opcional)</label>
            <UploadZone htmlFor="ingreso-comp" hasFile={!!comprobante}>
              <input id="ingreso-comp" type="file" accept="image/*,.pdf"
                onChange={e => setComprobante(e.target.files?.[0] ?? null)} />
              {comprobante
                ? <><CheckCircle2 size={22} color={tokens.emerald[500]} /><p>{comprobante.name}</p></>
                : <><Upload size={22} color={tokens.gray[400]} /><p>Adjuntar comprobante</p><span>PNG, JPG, PDF · Máx 5MB</span></>
              }
            </UploadZone>
          </Field>

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? '...' : <><TrendingUp size={16} /> Registrar Ingreso</>}
          </SubmitBtn>
        </FormBody>
      </FormCard>
    </Page>
  )
}
