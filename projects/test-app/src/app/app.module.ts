import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { WebsocketModule } from 'ng-rx-websocket';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    WebsocketModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
