import { TestBed } from '@angular/core/testing'
import { MessageOutType } from 'ng-rx-websocket'
import * as Connect from './connect'
import { mockModuleFunction } from './utils/mock'
import { WebsocketModule } from './websocket.module'
import { WebsocketService } from './websocket.service'

describe('WebsocketService', () => {
  let service: WebsocketService
  let connectSocketSpy: jasmine.Spy

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WebsocketModule.forRoot()],
    })
    service = TestBed.inject(WebsocketService)
    connectSocketSpy = mockModuleFunction(Connect, 'connectSocket', {})
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('connect()', () => {
    beforeEach(() => {
      service.connect()
    })
    it('should call connectSocket()', () => {
      expect(Connect.connectSocket).toHaveBeenCalled()
    })
  })

  describe('disconnect()', () => {
    const socketCloseSpy = jasmine.createSpy()
    beforeEach(() => {
      connectSocketSpy.and.returnValue({
        socketClose: socketCloseSpy,
      })
      service.connect()
      service.disconnect()
    })
    it('should call Websocket.close()', () => {
      expect(socketCloseSpy).toHaveBeenCalled()
    })
  })

  describe('send()', () => {
    const socketSendSpy = jasmine.createSpy()
    const message: MessageOutType<any> = { payload: 'test' }
    beforeEach(() => {
      connectSocketSpy.and.returnValue({
        socketSend: socketSendSpy,
      })
      service.connect()
      service.send(message)
    })
    it('should call Websocket.send() with correct parameter', () => {
      expect(socketSendSpy).toHaveBeenCalledWith(JSON.stringify(message))
    })
  })
})
