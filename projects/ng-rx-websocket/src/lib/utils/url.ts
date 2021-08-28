import { API_GATEWAY_PORT } from '../config'

export const getApiUrl = (path: string, port: number): string =>
  `${document.location.protocol}//${document.location.hostname}:${port}/api/${path}`

export const getWebsocketUrl = (port: number = API_GATEWAY_PORT, isEncrypted = false): string =>
  `${isEncrypted ? 'wss' : 'ws'}://${document.location.hostname}:${port}`
