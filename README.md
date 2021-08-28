# NgRxWebsocket

## Getting started

Do we need to do one `npm install` or one in the back-end-app folder as well?
What's the difference between `npm run` vs `npm run-script`

- Build and run the back-end app:
  - `cd projects/back-end-test-app`
  - `npm run-script build`
  - `npm run-script start`
- Build ng-rx-websocket, at project root `/`:
  - `ng build ng-rx-websocket --configuration production`
- Run test-app that uses ng-rx-websocket:
  - `npm start test-app`

## Running unit tests

Run `ng test ng-rx-websocket` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Websocket Options

```ts
export interface WebsocketOptions {
  url?: string
  heartbeatTimeout?: number
  retryTimes?: number
  reconnectDelay?: number
}
```

Options:

| Option           | Type   | Description                                                                                                                                                                                                                                             |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url              | string | Websocket service address, starts with `wss://` or `ws://`. Default: `ws://<hostname>:3500/`. If the websocket is intended to be setup on a channel called 'lobby' on a server at 'myWebsocketServer', the URL would be: `ws://myWebsocketServer/lobby` |
| heartbeatTimeout | number | Browser declares heartbeat is lost after this timeout and it then starts reconnection attempts. Default: `30000`, ie 30 seconds                                                                                                                         |
| retryTimes       | number | Upon heartbeat loss, browser will try reconnecting for this many times. Default: `Infinity`                                                                                                                                                             |
| reconnectDelay   | number | Upon heartbeat loss, browser will delay reconnecting for this long time; it will debounce any reconnect requests until then. Default: `2000`, ie 2s                                                                                                     |

## Service API:

| Method                                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect(options?: WebsocketOptions): void`                              | The websocket service will start subscription to the socket when this method is called. If an options object is provided, it will update the options before connecting to it.                                                                                                                                                                                                                                                                                                                 |
| `disconnect(): void`                                                     | This will complete the subscription and close the socket.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `send<T>(payload: T): void`                                              | This method can be used to send messages over the websocket without subscribing to a stream.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `requestStream<T>(dto: MessageOutType<T>): Observable<MessageInType<T>>` | This method will send the given message dto and return observable stream for responses by the services at the other end. The user of this method must subsribe in order to send a message and receive responses to it. The stream will throw and complete when heartbeat is lost, which clocks on a total of 'heartbeatTimeout' + 'reconnectDelay' + 10 milliseconds; so the application should connect the WebsocketService again and initiate a new requestStream in case of disconnection. |

## Why do we need it?

Web sockets provide full-duplex communication, but in high-frequency messaging applications, it is not possible to track responses to a particular message over a socket. In such applications, we often need to send a message and receive updates from the other side for that particular message.

For example, you may be asking for an FX trade quotation and would like to receive the response(s) in a stream; one or more microservices may respond to that message. This service provides the `requestStream()` API that does just that; you can send a message over the websocket and subscribe to responses that the other parties send. For tracking to work, in the response message, the server-end must include the workflowId that is sent in the message meta-data). You may track the message via an application level id (ie. workflowId) that you assign, or the service will track it under the hood and provide only the responses for this particular request. All of that meta-data is defined in the `MessageOutType` and `MessageInType`.

Or you may use the service for its `send()` API, which is pretty much a proxy for websocket's send(), with the bonus of heartbeat connectivity for the socket. So, if the socket connection goes down, it will reconnect. You can monitor whether the send() will throw and error to ensure the message was sent successfully; if it does throw an error, then it means heartbeat is lost and you can try sending in an interval until it is successfully sent.

It also comes with websocket heartbeat hand-shake with the Websocket server, with fully configurable timeout/retry mechanism. This makes the service a reliable messaging tunnel for high-frequency messaging applications.

## How it works

We currently include the following meta-data in the messages that go out and in, but you can do more overriding this interface. Make sure `workflowId` property names stays as is if you are planning to pass in an application-level workflowId.

```ts
export interface MessageOutType<T> {
  isOperationCompleted?: boolean
  operationName?: string
  schemaName?: string | 'heartbeat'
  workflowId?: string
  payload: T
}
```

As you can see, you can give instructions to the server-end using these meta-data, e.g. stopping a particular operation/service.

## Features to add

- Front-end polling
- CSRF security over websocket
