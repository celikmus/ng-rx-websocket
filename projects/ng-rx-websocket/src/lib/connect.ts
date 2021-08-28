import { Subject, Subscription, TimeoutError } from 'rxjs'
import { filter, finalize, takeUntil, tap, timeout } from 'rxjs/operators'
import { CloseReason, WebSocketOptionsWithDefaults } from './_websocket.types'
import { setupTransport } from './transport'
import { ConnectionStatus, SocketHeartbeatMessage, SocketInboundMessage } from './websocket.types'

export interface ConnectSocketType {
  heartbeat: Subject<SocketHeartbeatMessage>
  heartbeatReconnect: Subject<{}>
  socketMessage: Subject<SocketInboundMessage>
  socketSend: (_: string) => void
  socketClose: () => void
  socketId: number
}

interface SocketMapValueType {
  subscriptions: Subscription
  socket: WebSocket
}

let socketCounter = 0
const sockets = new Map<number, SocketMapValueType>()

interface ConnectSocketArgsType {
  socketId?: number
  options: WebSocketOptionsWithDefaults
  connectionStatusSubject: Subject<ConnectionStatus>
  heartbeat: Subject<SocketHeartbeatMessage> | null
  heartbeatReconnect: Subject<{}> | null
  socketMessage: Subject<SocketInboundMessage> | null
}

export const connectSocket = ({
  socketId,
  options,
  connectionStatusSubject,
  heartbeat,
  heartbeatReconnect,
  socketMessage,
}: ConnectSocketArgsType): ConnectSocketType => {
  const onOpenSubject = new Subject<{}>()
  const onCloseSubject = new Subject<{}>()
  const onMessageSubject = socketMessage || new Subject<SocketInboundMessage>()
  const heartbeatSubject = heartbeat || new Subject<SocketHeartbeatMessage>()
  const heartbeatReconnectSubject = heartbeatReconnect || new Subject<{}>()

  if (socketId) {
    console.log('Clearing previous socket...')
    const socketEntry = sockets.get(socketId)
    socketEntry?.subscriptions.unsubscribe()
    socketEntry?.socket.close()
    sockets.delete(socketId)
  }

  const socket = setupTransport({
    url: options.url,
    onOpenSubject,
    onCloseSubject,
    onMessageSubject,
    heartbeatSubject,
  })

  const subscriptions = new Subscription()
  sockets.set(++socketCounter, { socket, subscriptions })

  const onHeartbeatFailure = (err?: TimeoutError) => {
    console.error('Kicking off onHeartbeatFailure, error: ', err)
    heartbeatReconnectSubject.next({ reconnect: true })
  }

  subscriptions.add(
    onOpenSubject.subscribe(() => {
      connectionStatusSubject.next(ConnectionStatus.Connected)
      console.log('Open reached onOpen observer; connectionsStatus is: ', ConnectionStatus.Connected)
      // Kick off heartbeat handling...
      subscriptions.add(
        // If the source doesn't emit in 30s or if it goes not connected, it emits errors hence trigger
        // reconnect via onHeartbeatFailure()
        heartbeatSubject
          .pipe(
            takeUntil(
              connectionStatusSubject.pipe(
                tap((c) => console.log(`************** Heartbeat checking ConnectionStatus: ${c}`)),
                filter((c) => c !== ConnectionStatus.Connected)
              )
            ),
            timeout(options.heartbeatInterval),
            finalize(() => console.warn('Heartbeat detection stream completed'))
          )
          .subscribe({
            next: (h) => console.log('Heartbeat observer received an emission...', h),
            error: (err) => onHeartbeatFailure(err),
          })
      )
    })
  )

  subscriptions.add(
    onCloseSubject.subscribe((closeReason) => {
      console.log('Close reached in onClose observer, reason: ', closeReason)
      const shouldReconnect = closeReason === CloseReason.Normal
      const status = shouldReconnect ? ConnectionStatus.Reconnecting : ConnectionStatus.SessionInvalid
      connectionStatusSubject.next(status)
      if (shouldReconnect) {
        console.log(`Will reconnect in ${options.reconnectDelay / 1000}s...`)
        heartbeatReconnectSubject.next({ reconnect: true })
      }
    })
  )

  console.log(`ConnectSocket() done for ${options.url}`)

  return {
    heartbeat: heartbeatSubject,
    heartbeatReconnect: heartbeatReconnectSubject,
    socketMessage: onMessageSubject,
    socketSend: (arg) => socket.send(arg),
    socketClose: () => socket.close(),
    socketId: socketCounter,
  }
}
