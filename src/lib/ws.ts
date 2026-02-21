import type { GsdState } from '../../server/types'

type StateListener = (state: GsdState) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private listeners: Set<StateListener> = new Set()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('[WS] Connected')
        this.reconnectDelay = 1000
      }

      this.ws.onmessage = (event) => {
        try {
          const state = JSON.parse(event.data as string) as GsdState
          this.listeners.forEach((listener) => listener(state))
        } catch (err) {
          console.error('[WS] Failed to parse message:', err)
        }
      }

      this.ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting...')
        this.scheduleReconnect()
      }

      this.ws.onerror = (err) => {
        console.error('[WS] Error:', err)
        this.ws?.close()
      }
    } catch (err) {
      console.error('[WS] Failed to connect:', err)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
      this.connect()
    }, this.reconnectDelay)
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }
}

export const wsClient = new WebSocketClient()
