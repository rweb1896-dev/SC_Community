import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { MeetingSignal } from './models';

type OutgoingSignal = Omit<MeetingSignal, 'meetingId' | 'senderUserId' | 'senderName'>;

@Injectable({ providedIn: 'root' })
export class MeetingSocketService {
  private client?: Client;
  private roomId?: number;
  private roomSubscription?: StompSubscription;
  private updateSubject = new Subject<void>();
  private signalSubject = new Subject<MeetingSignal>();
  private connectedSubject = new BehaviorSubject(false);

  updates$ = this.updateSubject.asObservable();
  signals$ = this.signalSubject.asObservable();
  connected$ = this.connectedSubject.asObservable();

  constructor(private auth: AuthService) {}

  connect(): void {
    const session = this.auth.session;
    if (!session || this.client?.active) {
      return;
    }

    this.client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws-native`,
      reconnectDelay: 4000,
      connectHeaders: { Authorization: `Bearer ${session.token}` },
      onConnect: () => {
        this.connectedSubject.next(true);
        this.client?.subscribe('/topic/meetings/updates', () => this.updateSubject.next());
        this.subscribeToRoom();
      },
      onWebSocketClose: () => this.connectedSubject.next(false),
      onStompError: () => this.connectedSubject.next(false)
    });
    this.client.activate();
  }

  watchRoom(meetingId: number): void {
    this.roomId = meetingId;
    if (this.client?.connected) {
      this.subscribeToRoom();
    }
  }

  send(signal: OutgoingSignal): void {
    if (!this.roomId || !this.client?.connected) {
      return;
    }
    this.client.publish({
      destination: `/app/meetings/${this.roomId}/signal`,
      body: JSON.stringify(signal)
    });
  }

  disconnect(): void {
    this.roomSubscription?.unsubscribe();
    this.roomSubscription = undefined;
    this.roomId = undefined;
    this.connectedSubject.next(false);
    void this.client?.deactivate();
    this.client = undefined;
  }

  private subscribeToRoom(): void {
    if (!this.roomId || !this.client?.connected) {
      return;
    }
    this.roomSubscription?.unsubscribe();
    this.roomSubscription = this.client.subscribe(
      `/topic/meetings/${this.roomId}/signal`,
      (frame) => this.signalSubject.next(JSON.parse(frame.body) as MeetingSignal)
    );
  }
}
