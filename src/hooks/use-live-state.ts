import { useGsdState } from '@/lib/state-context'

/**
 * Hook that provides access to the live GSD state.
 * State is initially fetched from /api/state and then updated via WebSocket.
 */
export function useLiveState() {
  return useGsdState()
}
