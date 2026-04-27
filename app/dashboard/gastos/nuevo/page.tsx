import { redirect } from 'next/navigation'

export default function NuevoGastoRedirect() {
  redirect('/dashboard/gastos')
}
