import { WebsocketOptions } from './websocket.types'

type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property]
}

export type WebSocketOptionsWithDefaults = Concrete<WebsocketOptions>

export enum CloseReason {
  Normal = 'Normal',
  SessionInvalid = 'SessionInvalid',
}
