import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * SocketAdapter acts as a bridge between the React frontend and Spring Boot's STOMP broker.
 * 
 * It wraps `@stomp/stompjs` and `sockjs-client` with an event-driven EventEmitter pattern
 * (similar to Socket.IO), providing familiar `.emit(event, data)`, `.on(event, callback)`,
 * and `.off(event, callback)` APIs while handling STOMP protocol framing under the hood.
 */
class SocketAdapter {
  constructor() {
    this.client = null          // The underlying STOMP Client instance from @stomp/stompjs
    this.listeners = {}       // Registered UI event callbacks: { 'receive-message': [cb1, cb2] }
    this.subscriptions = {}   // Active STOMP topic subscriptions: { 'receive-message': StompSubscription }
    this.userId = null          // Current logged-in user's ID used for private topic routing
    this.isConnected = false     // Boolean flag tracking whether the STOMP connection is currently open
    this.pendingEmits = []      // Queue of emits attempted before connection was established
    this.initClient()
  }

  /**
   * Initializes and activates the STOMP client using SockJS for transport.
   * Configures automatic reconnection, heartbeat intervals, and event callbacks.
   */
  initClient() {
    const wsUrl = import.meta.env.VITE_WS_URL || '/ws'

    this.client = new Client({
      // Factory creating a SockJS instance connecting to the backend /ws endpoint
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,       // Automatically attempt to reconnect after 5s if disconnected
      heartbeatIncoming: 4000,    // Expected incoming server heartbeat every 4000ms
      heartbeatOutgoing: 4000,    // Outgoing client heartbeat sent every 4000ms

      onConnect: () => {
        this.isConnected = true
        // Subscribe/resubscribe to all required public and user-specific topics
        this.resubscribeAll()

        // Flush any message events that were queued while offline
        while (this.pendingEmits.length > 0) {
          const { event, data } = this.pendingEmits.shift()
          this.emit(event, data)
        }
      },

      onDisconnect: () => {
        this.isConnected = false
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body)
      },
    })

    // Initiate the connection handshake
    this.client.activate()
  }

  /**
   * Subscribes to STOMP destinations on the message broker.
   * Called upon connection establishment and whenever the user identity changes.
   */
  resubscribeAll() {
    if (!this.isConnected || !this.client) return

    // 1. Online users broadcast topic (Public broadcast channel)
    // Only subscribe if a listener is registered in UI and subscription doesn't already exist
    if (this.listeners['online-users'] && !this.subscriptions['online-users']) {
      this.subscriptions['online-users'] = this.client.subscribe(
        '/topic/online-users',
        (msg) => {
          try {
            const data = JSON.parse(msg.body)
            this.trigger('online-users', data)
          } catch (e) {
            console.error('Failed to parse online-users payload', e)
          }
        }
      )
    }

    // 2. User-specific private topics (Dedicated channels for this logged-in user)
    // Listens to incoming chat messages, typing events, and unread clear receipts
    if (this.userId) {
      if (this.subscribedUserId !== this.userId) {
        ['receive-message', 'started-typing', 'unread-messages-cleared'].forEach((event) => {
          if (this.subscriptions[event]) {
            try {
              this.subscriptions[event].unsubscribe()
            } catch (e) {
              console.error(e)
            }
            delete this.subscriptions[event]
          }
        })
        this.subscribedUserId = this.userId
      }

      const userTopics = [
        { event: 'receive-message', path: `/topic/user/${this.userId}/receive-message` },
        { event: 'started-typing', path: `/topic/user/${this.userId}/started-typing` },
        { event: 'unread-messages-cleared', path: `/topic/user/${this.userId}/unread-messages-cleared` },
      ]

      userTopics.forEach(({ event, path }) => {
        if (!this.subscriptions[event]) {
          this.subscriptions[event] = this.client.subscribe(path, (msg) => {
            try {
              const data = JSON.parse(msg.body)
              this.trigger(event, data)
            } catch (e) {
              console.error(`Failed to parse ${event} payload`, e)
            }
          })
        }
      })
    }
  }

  /**
   * Publishes an event to the backend STOMP broker.
   * Maps friendly event names to Spring Boot `@MessageMapping` destinations prefixed with `/app/`.
   * 
   * If the client is not yet connected, the emit is queued in `pendingEmits` and sent once connected.
   *
   * @param {string} event - The event name (e.g., 'send-message', 'typing', 'came-online')
   * @param {any} data - The payload to send as JSON
   */
  emit(event, data) {
    // Intercept user presence events to capture and store the active userId
    if (event === 'join-room' || event === 'came-online') {
      const incomingId = typeof data === 'string' ? data : data?.userId
      if (incomingId) {
        this.userId = incomingId
        if (this.isConnected) {
          this.resubscribeAll()
        }
      }
    }

    // Queue outgoing messages if connection is still in progress
    if (!this.isConnected) {
      this.pendingEmits.push({ event, data })
      return
    }

    // Map UI event names to STOMP application destinations
    switch (event) {
      case 'came-online':
        this.client.publish({
          destination: '/app/came-online',
          body: typeof data === 'string' ? data : JSON.stringify(data),
        })
        break
      case 'went-offline':
        this.client.publish({
          destination: '/app/went-offline',
          body: typeof data === 'string' ? data : JSON.stringify(data),
        })
        this.userId = null
        this.subscribedUserId = null
        ;['receive-message', 'started-typing', 'unread-messages-cleared'].forEach((ev) => {
          if (this.subscriptions[ev]) {
            try {
              this.subscriptions[ev].unsubscribe()
            } catch (e) {}
            delete this.subscriptions[ev]
          }
        })
        break
      case 'send-message':
        this.client.publish({
          destination: '/app/send-message',
          body: JSON.stringify(data),
        })
        break
      case 'typing':
        this.client.publish({
          destination: '/app/typing',
          body: JSON.stringify(data),
        })
        break
      case 'clear-unread-messages':
        this.client.publish({
          destination: '/app/clear-unread-messages',
          body: JSON.stringify(data),
        })
        break
      default:
        break
    }
  }

  /**
   * Registers an event callback listener (called by React components).
   *
   * @param {string} event - The event name to listen for
   * @param {Function} callback - The callback invoked with event data
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)

    // Ensure topic subscriptions exist for newly added listeners
    if (this.isConnected) {
      this.resubscribeAll()
    }
  }

  /**
   * Removes an event callback listener.
   *
   * @param {string} event - The event name
   * @param {Function} callback - The specific callback function to remove
   */
  off(event, callback) {
    if (!this.listeners[event]) return
    if (!callback) {
      delete this.listeners[event]
    } else {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  /**
   * Dispatches received STOMP message payload to all registered listener callbacks.
   *
   * @param {string} event - The event name
   * @param {any} data - The deserialized message body payload
   */
  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data))
    }
  }
}

// Singleton instance shared across all React components
export const socket = new SocketAdapter()
export default socket
