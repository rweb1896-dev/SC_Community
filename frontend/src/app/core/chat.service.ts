import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { Message } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private client?: Client;
  private incomingSubject = new Subject<Message>();
  incoming$ = this.incomingSubject.asObservable();
  private helpUpdateSubject = new Subject<{ type:string; conversationId?:number; postId?:number }>();
  helpUpdates$ = this.helpUpdateSubject.asObservable();
  private onlineUserIdsSubject = new BehaviorSubject<number[]>([]);
  onlineUserIds$ = this.onlineUserIdsSubject.asObservable();

  constructor(private auth: AuthService) {}

  connect(): void {
    const session = this.auth.session;
    if (!session || this.client?.active) {
      return;
    }

    this.client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws-native`,
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${session.token}` },
      onConnect: () => {
        this.client?.subscribe(`/topic/messages/${session.userId}`, (frame) => {
          this.incomingSubject.next(JSON.parse(frame.body) as Message);
        });
        this.client?.subscribe(`/topic/help/${session.userId}`, (frame) => this.helpUpdateSubject.next(JSON.parse(frame.body)));
        this.client?.subscribe('/topic/presence', (frame) => {
          const presence = JSON.parse(frame.body) as { onlineUserIds: number[] };
          this.onlineUserIdsSubject.next(presence.onlineUserIds || []);
        });
      }
    });
    this.client.activate();
  }

  send(receiverId: number, messageBody: string): void {
    this.connect();
    this.client?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ receiverId, messageBody })
    });
  }

  disconnect(): void {
    this.client?.deactivate();
  }
}
