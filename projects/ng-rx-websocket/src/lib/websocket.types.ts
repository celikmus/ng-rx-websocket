export interface CsrfMessage {
  [key: string]: string
}

export enum ConnectionStatus {
  Connecting = 'Connecting',
  Connected = 'Connected',
  Idle = 'Idle',
  Reconnecting = 'Reconnecting',
  SessionInvalid = 'SessionInvalid',
}

export interface BaseMessageType {
  isOperationCompleted?: boolean
  operationName?: string
  schemaName?: string | 'heartbeat'
  workflowId?: string
}

export interface MessageOutType<T> extends BaseMessageType {
  payload: T
}

export interface MessageInType<T> extends BaseMessageType {
  payload: T
}

export interface WebsocketOptions {
  url?: string
  heartbeatInterval?: number
  reconnectDelay?: number
  retryTimes?: number
}

export type SocketHeartbeatMessage = BaseMessageType
export type SocketInboundMessage = SocketHeartbeatMessage | MessageInType<any>
export type SocketOutboundMessage = SocketHeartbeatMessage | MessageOutType<any>
