import { Subject } from 'rxjs'
import { SecurityConstants } from './config'
import { SocketHeartbeatMessage, SocketInboundMessage } from './websocket.types'
import { CloseReason } from './_websocket.types'

const setupCsrfAndConnect = () => {
  // this._csrfTokenFetchSubscription?.unsubscribe()
  // this._csrfTokenFetchSubscription = fromFetch(getApiUrl('csrf/get-ws-csrf-token', API_GATEWAY_PORT), {
  //   method: 'GET',
  // })
  //   .pipe(
  //     switchMap((response: any) => {
  //       if (response.ok) {
  //         console.log('++++++++ received CSRF token, ', response)
  //         return of(true)
  //       } else {
  //         console.log('++++++++ error wrong with API endpoint: ', response)
  //         return of(false)
  //       }
  //     }),
  //     retryWhen((err$) =>
  //       err$.pipe(
  //         tap(console.error),
  //         mergeMap((_) => timer(3000))
  //       )
  //     ),
  //     catchError((er) => of(console.log(er)))
  //   )
  //   .subscribe(
  //     (result) => {
  //       if (result) {
  //         console.log('++++++++ Connecting websocket now.....')
  //         this.connectTransport()
  //       }
  //     },
  //     (err) => console.error('Error getting CSRF token, will try again in 3 seconds', err)
  //   )
}

export interface SetupTransportArgType {
  url: string
  onOpenSubject: Subject<{}>
  onCloseSubject: Subject<{}>
  onMessageSubject: Subject<SocketInboundMessage>
  heartbeatSubject: Subject<SocketHeartbeatMessage>
}

export const setupTransport = (props: SetupTransportArgType): WebSocket => {
  // Get CSRF token (todo: make this optional later),
  // if (props.isSecure) {
  //   setupCsrfAndConnect()
  // }
  return connectTransport(props)
}

const connectTransport = (props: SetupTransportArgType): WebSocket => {
  const { url, onOpenSubject, onCloseSubject, onMessageSubject, heartbeatSubject } = props

  console.log('Instantiating socket...')

  const socket = new WebSocket(url, 'ws')

  socket.onopen = () => {
    console.log('| <- OPEN')
    // if (isSecure) {
    //   const csrfCookie = getCookieByName(SecurityConstants.NG_RX_WS_CSRF_TOKEN)
    //   console.log('CSRF cookie: ', csrfCookie)
    //   if (csrfCookie) {
    //     const csrfMessage: CsrfMessage = {
    //       [SecurityConstants.SESSION_ID_TOKEN]: this._sessionId,
    //       [SecurityConstants.NG_RX_WS_CSRF_TOKEN]: csrfCookie,
    //     }
    //     socket.send<CsrfMessage>(csrfMessage)
    //   }
    // }
    onOpenSubject.next({})
  }

  socket.onclose = (args: any) => {
    console.log(`| <- CLOSE, code: ${args.code}`)
    const closeReason =
      args.code === SecurityConstants.EXPIRY_STATUS_CODE ? CloseReason.SessionInvalid : CloseReason.Normal
    onCloseSubject.next(closeReason)
  }

  socket.onmessage = (m: MessageEvent) => {
    console.log('| <- ', m.data)
    if (m.data === 'heartbeat') {
      socket?.send('heartbeat')
      console.log('| ->  heartbeat')
      heartbeatSubject.next(m.data)
    } else {
      const message = JSON.parse(m.data, (key, value) => {
        if (key === 'payload') {
          return typeof value === 'string' ? JSON.parse(value) : value
        }
        return value
      })
      onMessageSubject.next(message as SocketInboundMessage)
    }
  }

  return socket
}
