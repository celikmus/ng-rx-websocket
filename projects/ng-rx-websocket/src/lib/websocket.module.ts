import { ModuleWithProviders, NgModule } from '@angular/core'
import { WebsocketOptionsProvider, WEBSOCKET_OPTIONS } from './websocket-options.provider'
import { websocketServiceFactory } from './websocket.factory'
import { WebsocketService } from './websocket.service'
import { WebsocketOptions } from './websocket.types'
@NgModule({
  providers: [WebsocketOptionsProvider],
})
export class WebsocketModule {
  /**
   * Use this method in your root module to provide the WebSocketService
   */
  static forRoot(options: WebsocketOptions = {} as WebsocketOptions): ModuleWithProviders<WebsocketModule> {
    return {
      ngModule: WebsocketModule,
      providers: [
        { provide: WEBSOCKET_OPTIONS, useValue: options },
        {
          provide: WebsocketService,
          useFactory: websocketServiceFactory,
          deps: [WebsocketOptionsProvider],
        },
      ],
    }
  }

  /**
   * Use this method in your other (non root) modules to import the directive/pipe
   */
  static forChild(options: WebsocketOptions): ModuleWithProviders<WebsocketModule> {
    return WebsocketModule.forRoot(options)
  }
}
