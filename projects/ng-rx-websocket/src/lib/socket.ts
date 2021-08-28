import { BehaviorSubject, Connectable, connectable, merge, Observable, Subject, Subscription } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { connectSocket } from './connect'
import { getRandomString } from './utils'
import { ConnectionStatus, SocketHeartbeatMessage, SocketInboundMessage } from './websocket.types'
import { WebSocketOptionsWithDefaults } from './_websocket.types'
export class Socket {
  #sessionId: string
  #options: WebSocketOptionsWithDefaults
  #heartbeat: Subject<SocketHeartbeatMessage> | null = null
  #heartbeatReconnect: Subject<{}> | null = null
  #socketMessage: Subject<SocketInboundMessage> | null = null
  #socketSend: ((s: string) => void) | null = null
  #socketClose: (() => void) | null = null
  #socketId: number | undefined = undefined
  #retryCount = 0

  #connectStream: Connectable<ConnectionStatus> | null = null
  #connectStreamSubscription = new Subscription()

  constructor(options: WebSocketOptionsWithDefaults) {
    this.#options = options
    this.#sessionId = getRandomString(8)
  }

  get sessionId(): string {
    return this.#sessionId
  }

  get connectionStatus(): Observable<ConnectionStatus> | null {
    return this.#connectStream
  }

  close(): void {
    console.log('Closing socket...')
    this.#connectStreamSubscription?.unsubscribe()
    this.#socketClose?.call(this)
  }

  connect(): void {
    this.#connectStream = connectable(this.buildStream(), {
      connector: () => new BehaviorSubject<ConnectionStatus>(ConnectionStatus.Idle),
    })
    console.log('....Connecting websocket with options: ', this.#options)
    this.#connectStreamSubscription.add(this.#connectStream.connect())
  }

  public get inboundStream(): Observable<SocketInboundMessage> | null {
    if (this.#socketMessage && this.#heartbeat) {
      return merge(this.#socketMessage.asObservable(), this.#heartbeat.asObservable())
    }
    return null
  }

  send<T>(payload: T): void {
    console.log('Sending message over websocket: ', payload)
    this.#socketSend?.call(this, JSON.stringify(payload))
  }

  // To create the connectable stream, called by constructor
  private buildStream(): Observable<ConnectionStatus> {
    const connectionStatusSubject = new Subject<ConnectionStatus>()

    // connectionStatusSubject.next(ConnectionStatus.Connecting)
    this.connectSocket(connectionStatusSubject)

    console.log('Heartbeat and heartbeatReconnect observables subscribing...')
    // reconnect within WS_RECONNECT_DELAY unless a message/heartbeat arrives (We're not doing this at the moment;
    // ie. we're not observing message/heartbeat emissions) TODO
    this.#connectStreamSubscription.add(
      this.#heartbeatReconnect?.pipe(debounceTime(this.#options.reconnectDelay)).subscribe(() => {
        const { retryTimes } = this.#options
        console.log('Handling heartbeat reconnect attempt...')
        if (retryTimes && retryTimes > ++this.#retryCount) {
          console.log('Timeout kicked in, reconnecting now...')
          connectionStatusSubject.next(ConnectionStatus.Connecting)
          this.connectSocket(connectionStatusSubject)
        } else {
          console.log('Reconnect attempts limit exceeded, clearing resources...')
          this.close()
        }
      })
    )

    return connectionStatusSubject.asObservable()
  }

  private connectSocket(connectionStatusSubject: Subject<ConnectionStatus>): void {
    const { heartbeat, heartbeatReconnect, socketMessage, socketSend, socketClose, socketId } = connectSocket({
      socketId: this.#socketId,
      options: this.#options,
      connectionStatusSubject,
      heartbeat: this.#heartbeat,
      heartbeatReconnect: this.#heartbeatReconnect,
      socketMessage: this.#socketMessage,
    })
    console.log('connect() has a new socket, id: ', socketId)
    this.#heartbeat = heartbeat
    this.#heartbeatReconnect = heartbeatReconnect
    this.#socketMessage = socketMessage
    this.#socketSend = socketSend
    this.#socketClose = socketClose
    this.#socketId = socketId
  }
}
