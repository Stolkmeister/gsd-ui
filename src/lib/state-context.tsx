import React, { createContext, useContext, useEffect, useState } from 'react'
import type { GsdState } from '../../server/types'
import { wsClient } from './ws'

interface StateContextValue {
  state: GsdState | null
  loading: boolean
  error: string | null
}

const StateContext = createContext<StateContextValue>({
  state: null,
  loading: true,
  error: null,
})

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GsdState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial state
    fetch('/api/state')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: GsdState) => {
        setState(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch initial state:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
        setLoading(false)
      })

    // Subscribe to WebSocket updates
    wsClient.connect()
    const unsubscribe = wsClient.subscribe((newState) => {
      setState(newState)
      setLoading(false)
      setError(null)
    })

    return () => {
      unsubscribe()
      wsClient.disconnect()
    }
  }, [])

  return (
    <StateContext.Provider value={{ state, loading, error }}>
      {children}
    </StateContext.Provider>
  )
}

export function useGsdState(): StateContextValue {
  return useContext(StateContext)
}
