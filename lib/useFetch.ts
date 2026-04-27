import { useState, useEffect, useCallback } from 'react'

interface FetchState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  mutate: () => void
}

export function useFetch<T = unknown>(
  url: string | null,
  options?: { refreshInterval?: number }
): FetchState<T> {
  const [data, setData]         = useState<T | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<Error | null>(null)
  const [tick, setTick]         = useState(0)

  const mutate = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!url) { setLoading(false); return }
    let cancelled = false
    setLoading(true)

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<T>
      })
      .then((d) => { if (!cancelled) { setData(d); setError(null) } })
      .catch((e) => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [url, tick])

  useEffect(() => {
    if (!options?.refreshInterval || !url) return
    const id = setInterval(mutate, options.refreshInterval)
    return () => clearInterval(id)
  }, [url, options?.refreshInterval, mutate])

  return { data, isLoading, error, mutate }
}
