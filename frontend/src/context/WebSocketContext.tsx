"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface RealtimeEvent {
  type: string;
  entity: string;
  action: string;
  data?: any;
}

interface WebSocketContextType {
  lastEvent: RealtimeEvent | null;
  isConnected: boolean;
  subscribe: (entity: string, callback: (event: RealtimeEvent) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !user) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
    const wsHost = apiUrl.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}://${wsHost}/ws?token=${token}`;

    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          if (data.type === "REALTIME_UPDATE") {
            setLastEvent(data);
            const callbacks = listenersRef.current.get(data.entity);
            if (callbacks) {
              callbacks.forEach((cb) => cb(data));
            }
          }
        } catch {
          // Ignores non-JSON messages like pong
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Reintentar conexión en 3 segundos si el usuario sigue autenticado
        if (user) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    } catch (e) {
      console.error("Failed to establish WebSocket connection:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setIsConnected(false);
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [user, connect]);

  const subscribe = useCallback((entity: string, callback: (event: RealtimeEvent) => void) => {
    if (!listenersRef.current.has(entity)) {
      listenersRef.current.set(entity, new Set());
    }
    listenersRef.current.get(entity)!.add(callback);

    return () => {
      const callbacks = listenersRef.current.get(entity);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listenersRef.current.delete(entity);
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ lastEvent, isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}
