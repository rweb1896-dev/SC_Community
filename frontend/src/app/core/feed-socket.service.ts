import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { FeedEvent } from './models';

@Injectable({ providedIn: 'root' })
export class FeedSocketService {
  private client?: Client;
  private readonly updatesSubject = new Subject<FeedEvent>();
  readonly updates$ = this.updatesSubject.asObservable();

  constructor(private auth: AuthService) {}

  connect(): void {
    const session = this.auth.session;
    if (!session || this.client?.active) return;
    this.client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws-native`,
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${session.token}` },
      onConnect: () => this.client?.subscribe('/topic/feed', (frame) => {
        this.updatesSubject.next(JSON.parse(frame.body) as FeedEvent);
      })
    });
    this.client.activate();
  }

  disconnect(): void { this.client?.deactivate(); this.client = undefined; }
}
