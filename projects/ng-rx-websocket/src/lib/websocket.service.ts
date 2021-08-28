import { Injectable } from '@angular/core'
import { merge, Observable, of, Subscription, throwError } from 'rxjs'
import { filter, skip, switchMap, take, takeUntil, tap, timeout } from 'rxjs/operators'
import * as uuid from 'uuid'
import { Socket } from './socket'
import { WebsocketOptionsProvider } from './websocket-options.provider'
import {
  ConnectionStatus,
  MessageInType,
  MessageOutType,
  SocketInboundMessage,
  SocketOutboundMessage,
  WebsocketOptions,
} from './websocket.types'
import { WebSocketOptionsWithDefaults } from './_websocket.types'

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  protected options: WebSocketOptionsWithDefaults
  #socket: Socket | null = null
  constructor(private readonly optionsProvider: WebsocketOptionsProvider) {
    this.options = this.optionsProvider.options
  }

  connect(options?: WebsocketOptions): void {
    this.options = { ...this.options, ...options }
    this.#socket = new Socket(this.options)
    this.#socket.connect()
  }

  disconnect(): void {
    this.#socket?.close()
  }

  send(message: MessageOutType<any>): void {
    try {
      this.#socket?.send<MessageOutType<any>>(message)
    } catch (err) {
      console.log(err)
      throw new Error(`Error trying to send message: ${message}`)
    }
  }

  requestStream<T>(dto: MessageOutType<T>): Observable<MessageInType<T>> {
    const stream = new Observable<MessageInType<T>>((observer) => {
      const disposables: Subscription[] = []
      const workflowId = dto.workflowId || uuid.v4()
      const message: SocketOutboundMessage = { ...dto, workflowId }
      const throwOnDisconnectionStream: Observable<Error> =
        this.#socket?.connectionStatus?.pipe(
          filter((c) => c === ConnectionStatus.Reconnecting),
          tap((_) => console.log('Reconnecting...')),
          take(1),
          switchMap((_) => {
            return throwError(() => new Error(`Connection lost inside stream, workflowId: ${workflowId}`))
          })
        ) || throwError(() => new Error('Socket or connection status is not right'))

      let inboundMessageStream: Observable<SocketInboundMessage | Error> = merge(
        this.#socket?.inboundStream?.pipe(
          filter((c) => c === 'heartbeat' || c.workflowId === workflowId),
          tap((_) => console.log('filter passed'))
        ) || throwError(() => new Error('Socket or InboundStream is not right')),
        throwOnDisconnectionStream
      )

      // if no message has been received down the stream in more than heartbeat interval + timeout, that indicates the heartbeat has failed
      inboundMessageStream = inboundMessageStream.pipe(
        timeout({
          first: this.options.heartbeatInterval + 10 + this.options.reconnectDelay,
          with: (_) => throwError(() => new Error('Heartbeat failed')),
        })
      )

      disposables.push(
        inboundMessageStream?.subscribe({
          next: (inMsg) => {
            console.log('Inbound message stream received a message: ', inMsg)
            if (inMsg !== 'heartbeat') {
              observer.next(inMsg as MessageInType<any>)
            }
          },
          error: (err) => {
            console.error('Error on inbound message stream: ', err)
            observer.error(err)
          },
          complete: () => {
            console.log('Inbound message stream completed')
            observer.complete()
          },
        }) || new Subscription()
      )

      try {
        this.#socket?.send<SocketOutboundMessage>(message)
      } catch (err) {
        console.log('Error trying to send dto up the socket', err)
      }
      return () => disposables.forEach((x) => x.unsubscribe())
    })

    return (
      this.#socket?.connectionStatus?.pipe(
        tap((cs) => console.log('.....Connection status: ', cs)),
        filter((c) => c === ConnectionStatus.Connected),
        take(1),
        switchMap(() => stream),
        takeUntil(
          this.#socket?.connectionStatus.pipe(
            filter((c) => c === ConnectionStatus.Idle),
            skip(1) // Skip the initial Idle of connect()
          )
        )
      ) || of()
    )
  }
}
