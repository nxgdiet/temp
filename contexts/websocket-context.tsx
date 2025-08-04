'use client'

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react'

interface WebSocketMessage {
  type: string;
  roomId?: string;
  hostData?: any;
  guestData?: any;
  error?: string;
  reason?: string;
  requiredStake?: number;
  betType?: string;
  tournamentId?: number;
  txHash?: string;
}

interface WebSocketContextType {
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const subscribersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const log = useCallback((message: string, type: 'INFO' | 'ERROR' | 'WARN' = 'INFO') => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${type}] [GlobalWebSocket] ${message}`)
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      log('WebSocket already connected')
      return
    }

    log(`Connecting to WebSocket server: ${WS_URL}`)

    try {
      wsRef.current = new WebSocket(WS_URL)

      wsRef.current.onopen = () => {
        log('Global WebSocket connection established')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          log(`Received message: ${message.type}`)
          console.log('🌐 [DEBUG] Global WebSocket received:', message.type, message);
          
          // Notify all subscribers
          subscribersRef.current.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              log(`Error in subscriber callback: ${error}`, 'ERROR')
            }
          })
        } catch (error) {
          log(`Error parsing message: ${error}`, 'ERROR')
        }
      }

      wsRef.current.onclose = (event) => {
        log(`WebSocket connection closed: ${event.code} - ${event.reason}`)
        setIsConnected(false)

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          log('Max reconnection attempts reached', 'ERROR')
        }
      }

      wsRef.current.onerror = (error) => {
        log(`WebSocket error: ${error}`, 'ERROR')
      }
    } catch (error) {
      log(`Failed to create WebSocket connection: ${error}`, 'ERROR')
    }
  }, [log])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message)
      log(`Sending message: ${message.type}`)
      wsRef.current.send(messageStr)
    } else {
      log('Cannot send message: WebSocket not connected', 'ERROR')
    }
  }, [log])

  const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
    subscribersRef.current.add(callback)
    log(`Added subscriber, total: ${subscribersRef.current.size}`)

    return () => {
      subscribersRef.current.delete(callback)
      log(`Removed subscriber, total: ${subscribersRef.current.size}`)
    }
  }, [log])

  const disconnect = useCallback(() => {
    log('Disconnecting global WebSocket')
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect')
      wsRef.current = null
    }
    setIsConnected(false)
    subscribersRef.current.clear()
  }, [log])

  // Connect on mount
  useEffect(() => {
    log('WebSocket provider mounting - initiating connection')
    connect()

    // Global connection - don't disconnect on unmount
    return () => {
      log('WebSocket provider unmounting - keeping connection alive')
    }
  }, [connect, log])

  // Add connection status logging
  useEffect(() => {
    log(`WebSocket connection status changed: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`)
  }, [isConnected, log])

  // Cleanup on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [disconnect])

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      sendMessage,
      subscribe,
      disconnect
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useGlobalWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useGlobalWebSocket must be used within a WebSocketProvider')
  }
  return context
}