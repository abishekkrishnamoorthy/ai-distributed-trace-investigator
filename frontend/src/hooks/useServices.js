import { useCallback, useEffect, useState } from 'react'
import { traceApi } from '../services/traceApi'

export const useServices = () => {
  const [services, setServices] = useState([])

  const loadServices = useCallback(async () => {
    try {
      const result = await traceApi.getServices()
      setServices((result.data || []).filter((service) => service.name))
    } catch {
      setServices([])
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadServices()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadServices])

  return { services, refetch: loadServices }
}
