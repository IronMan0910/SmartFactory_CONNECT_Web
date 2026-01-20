/**
 * useSocket - Custom hook for real-time data updates
 * Simplifies subscribing to channels and handling events with auto-cleanup
 */
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useSocketContext, SocketEvent } from '../contexts/SocketContext';

interface UseSocketOptions {
    /** Channels to subscribe to on mount (e.g., 'incidents', 'ideas', 'news') */
    channels?: string[];
    /** Event handlers map */
    events?: Partial<Record<SocketEvent, (data: any) => void>>;
    /** Whether to automatically subscribe on mount (default: true) */
    autoSubscribe?: boolean;
}

/**
 * Hook for components to easily use WebSocket real-time updates
 * 
 * @example
 * // In a component that needs real-time incident updates:
 * useSocket({
 *   channels: ['incidents'],
 *   events: {
 *     incident_created: () => refetchData(),
 *     incident_updated: () => refetchData(),
 *   }
 * });
 */
export function useSocket(options: UseSocketOptions = {}) {
    const { channels = [], events = {}, autoSubscribe = true } = options;
    const { socket, isConnected, subscribe, on, off } = useSocketContext();

    // Use ref to track registered handlers for cleanup
    const registeredHandlers = useRef<Map<SocketEvent, (data: any) => void>>(new Map());

    // Subscribe to channels when connected
    useEffect(() => {
        if (isConnected && autoSubscribe) {
            channels.forEach(channel => {
                subscribe(channel);
                console.log(`[WebSocket] Subscribed to channel: ${channel}`);
            });
        }
    }, [isConnected, channels, subscribe, autoSubscribe]);

    // Register event handlers
    useEffect(() => {
        if (!socket) return;

        // Register new handlers
        Object.entries(events).forEach(([event, handler]) => {
            if (handler) {
                const eventName = event as SocketEvent;
                // Wrap handler with debug log
                const wrappedHandler = (data: any) => {
                    console.log(`[WebSocket] Received event: ${eventName}`, data);
                    handler(data);
                };
                on(eventName, wrappedHandler);
                registeredHandlers.current.set(eventName, wrappedHandler);
                console.log(`[WebSocket] Registered handler for: ${eventName}`);
            }
        });

        // Cleanup on unmount
        return () => {
            registeredHandlers.current.forEach((handler, event) => {
                off(event, handler);
            });
            registeredHandlers.current.clear();
        };
    }, [socket, events, on, off]);

    // Manual emit function
    const emit = useCallback((event: string, data?: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    }, [socket, isConnected]);

    return {
        isConnected,
        emit,
        subscribe,
    };
}

/**
 * Simple hook variant for just triggering a refetch on specific events
 * 
 * @example
 * const refetch = useCallback(() => fetchData(), []);
 * useSocketRefresh(['incident_created', 'incident_updated'], refetch, ['incidents']);
 */
export function useSocketRefresh(
    events: SocketEvent[],
    onRefresh: () => void,
    channels: string[] = []
) {
    const eventHandlers = useMemo(() => {
        return events.reduce((acc, event) => {
            acc[event] = onRefresh;
            return acc;
        }, {} as Partial<Record<SocketEvent, () => void>>);
    }, [events.join(','), onRefresh]);

    return useSocket({
        channels,
        events: eventHandlers,
    });
}
