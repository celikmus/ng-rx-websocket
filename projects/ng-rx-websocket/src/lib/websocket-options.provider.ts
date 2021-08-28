import { Inject, Injectable, InjectionToken } from '@angular/core'
import { WS_HEARBEAT_TIMEOUT, WS_RECONNECT_DELAY } from './config'
import { getWebsocketUrl } from './utils'
import { WebSocketOptionsWithDefaults } from './_websocket.types'

export const WEBSOCKET_OPTIONS = new InjectionToken<WebSocketOptionsWithDefaults>('WEBSOCKET_OPTIONS')

@Injectable()
export class WebsocketOptionsProvider {
  private readonly _defaultOptions: WebSocketOptionsWithDefaults

  constructor(@Inject(WEBSOCKET_OPTIONS) private _options: WebSocketOptionsWithDefaults) {
    this._defaultOptions = {
      url: getWebsocketUrl(),
      heartbeatInterval: WS_HEARBEAT_TIMEOUT,
      retryTimes: Infinity,
      reconnectDelay: WS_RECONNECT_DELAY,
    }
    this._options = { ...this._defaultOptions, ..._options }
  }

  get defaultOptions(): WebSocketOptionsWithDefaults {
    return this._defaultOptions
  }

  get options(): WebSocketOptionsWithDefaults {
    return this._options
  }

  set options(options: WebSocketOptionsWithDefaults) {
    this._options = { ...this._options, ...options }
  }
}
