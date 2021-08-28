import { Component, OnInit } from '@angular/core'
import { WebsocketService } from 'ng-rx-websocket'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'test-app'

  constructor(private websocketService: WebsocketService) {
    console.log('Ran app component constructor')
    this.websocketService.connect({
      // retryTimes: 4,
      // heartbeatInterval: 30000,
      // reconnectDelay: 2000,
      url: 'ws://localhost:3500/hello',
    })
  }

  ngOnInit(): void {
    console.log('Subscribing to a stream...')
    this.websocketService.requestStream({ payload: { test: 'hello test' } }).subscribe({
      next: (res) => {
        console.log('Received from stream: ', res)
      },
      error: (err) => console.log('Received from stream, error: ', err),
      complete: () => console.log('Received from stream, complete...'),
    })
  }
}
