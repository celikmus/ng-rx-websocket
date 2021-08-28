import { WebsocketOptionsProvider } from './websocket-options.provider'
import { WebsocketService } from './websocket.service'

export function websocketServiceFactory(websocketOptionsProvider: WebsocketOptionsProvider): WebsocketService {
  return new WebsocketService(websocketOptionsProvider)
}
