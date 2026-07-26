import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideCamera,
  LucideCameraOff,
  LucideLogOut,
  LucideMic,
  LucideMicOff,
  LucidePhoneOff,
  LucideShieldCheck,
  LucideUsersRound,
  LucideVideo
} from '@lucide/angular';
import { filter, Subscription, take } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CommunityApiService } from '../core/community-api.service';
import { MeetingSocketService } from '../core/meeting-socket.service';
import { Meeting, MeetingSignal } from '../core/models';

interface RemoteParticipant {
  userId: number;
  name: string;
  stream: MediaStream;
}

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [
    CommonModule,
    LucideCamera,
    LucideCameraOff,
    LucideLogOut,
    LucideMic,
    LucideMicOff,
    LucidePhoneOff,
    LucideShieldCheck,
    LucideUsersRound,
    LucideVideo
  ],
  templateUrl: './meeting-room.component.html',
  styleUrl: './meeting-room.component.css'
})
export class MeetingRoomComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('localVideo') localVideo?: ElementRef<HTMLVideoElement>;
  @ViewChildren('remoteVideo') remoteVideos?: QueryList<ElementRef<HTMLVideoElement>>;

  meeting?: Meeting;
  remoteParticipants: RemoteParticipant[] = [];
  localStream?: MediaStream;
  loading = true;
  error = '';
  micEnabled = true;
  cameraEnabled = true;

  private meetingId = 0;
  private peers = new Map<number, RTCPeerConnection>();
  private queuedCandidates = new Map<number, RTCIceCandidateInit[]>();
  private subscriptions = new Subscription();
  private leaving = false;

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private api: CommunityApiService,
    private socket: MeetingSocketService
  ) {}

  ngOnInit(): void {
    this.meetingId = Number(this.route.snapshot.paramMap.get('meetingId'));
    if (!this.meetingId) {
      void this.router.navigateByUrl('/meetings');
      return;
    }
    this.enterRoom();
  }

  ngAfterViewChecked(): void {
    if (this.localVideo && this.localVideo.nativeElement.srcObject !== this.localStream) {
      this.localVideo.nativeElement.srcObject = this.localStream || null;
    }
    this.remoteVideos?.forEach((videoRef) => {
      const userId = Number(videoRef.nativeElement.dataset['userId']);
      const participant = this.remoteParticipants.find((item) => item.userId === userId);
      if (participant && videoRef.nativeElement.srcObject !== participant.stream) {
        videoRef.nativeElement.srcObject = participant.stream;
      }
    });
  }

  toggleMic(): void {
    this.micEnabled = !this.micEnabled;
    this.localStream?.getAudioTracks().forEach((track) => track.enabled = this.micEnabled);
  }

  toggleCamera(): void {
    this.cameraEnabled = !this.cameraEnabled;
    this.localStream?.getVideoTracks().forEach((track) => track.enabled = this.cameraEnabled);
  }

  leave(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.socket.send({ type: 'LEAVE' });
    this.api.leaveMeeting(this.meetingId).subscribe({
      next: () => void this.router.navigateByUrl('/meetings'),
      error: () => void this.router.navigateByUrl('/meetings')
    });
  }

  endMeeting(): void {
    if (!this.meeting?.canManage || this.leaving) {
      return;
    }
    this.socket.send({ type: 'END' });
    this.leaving = true;
    this.api.endMeeting(this.meetingId).subscribe({
      next: () => void this.router.navigateByUrl('/meetings'),
      error: (error) => {
        this.error = error.error?.detail || 'Meeting could not be ended';
        this.leaving = false;
      }
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  ngOnDestroy(): void {
    if (!this.leaving && this.meetingId) {
      this.socket.send({ type: 'LEAVE' });
      this.api.leaveMeeting(this.meetingId).subscribe();
    }
    this.subscriptions.unsubscribe();
    this.closeMedia();
    this.socket.disconnect();
  }

  private enterRoom(): void {
    this.api.joinMeeting(this.meetingId).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        void this.startMediaAndSignaling();
      },
      error: (error) => {
        this.error = error.error?.detail || 'You cannot join this meeting';
        this.loading = false;
      }
    });
  }

  private async startMediaAndSignaling(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera and microphone require HTTPS or localhost.');
      }
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      this.error = error instanceof Error
        ? `${error.message} You can still join in listen-only mode.`
        : 'Camera and microphone are unavailable. You can still join in listen-only mode.';
      this.cameraEnabled = false;
      this.micEnabled = false;
    }

    this.socket.watchRoom(this.meetingId);
    this.socket.connect();
    this.subscriptions.add(this.socket.signals$.subscribe((signal) => void this.handleSignal(signal)));
    this.subscriptions.add(this.socket.updates$.subscribe(() => this.checkMeetingStatus()));
    this.subscriptions.add(
      this.socket.connected$.pipe(filter(Boolean), take(1)).subscribe(() => {
        this.socket.send({ type: 'JOIN' });
        this.loading = false;
      })
    );
  }

  private async handleSignal(signal: MeetingSignal): Promise<void> {
    const currentUserId = this.auth.session?.userId;
    if (!currentUserId || signal.senderUserId === currentUserId) {
      return;
    }
    if (signal.targetUserId && signal.targetUserId !== currentUserId) {
      return;
    }

    try {
      switch (signal.type) {
        case 'JOIN':
          await this.createOffer(signal.senderUserId, signal.senderName);
          break;
        case 'OFFER':
          await this.acceptOffer(signal);
          break;
        case 'ANSWER':
          await this.acceptAnswer(signal);
          break;
        case 'ICE':
          await this.acceptCandidate(signal);
          break;
        case 'LEAVE':
          this.removePeer(signal.senderUserId);
          break;
        case 'END':
          this.error = 'The host ended this meeting.';
          setTimeout(() => void this.router.navigateByUrl('/meetings'), 900);
          break;
      }
    } catch {
      this.error = 'A participant connection was interrupted. Reconnecting may help.';
    }
  }

  private async createOffer(userId: number, name: string): Promise<void> {
    const peer = this.peerFor(userId, name);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    this.socket.send({ type: 'OFFER', targetUserId: userId, sdp: offer.sdp });
  }

  private async acceptOffer(signal: MeetingSignal): Promise<void> {
    if (!signal.sdp) return;
    const peer = this.peerFor(signal.senderUserId, signal.senderName);
    await peer.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
    await this.flushCandidates(signal.senderUserId);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    this.socket.send({ type: 'ANSWER', targetUserId: signal.senderUserId, sdp: answer.sdp });
  }

  private async acceptAnswer(signal: MeetingSignal): Promise<void> {
    if (!signal.sdp) return;
    const peer = this.peers.get(signal.senderUserId);
    if (!peer) return;
    await peer.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
    await this.flushCandidates(signal.senderUserId);
  }

  private async acceptCandidate(signal: MeetingSignal): Promise<void> {
    if (!signal.candidate) return;
    const candidate: RTCIceCandidateInit = {
      candidate: signal.candidate,
      sdpMid: signal.sdpMid,
      sdpMLineIndex: signal.sdpMLineIndex
    };
    const peer = this.peers.get(signal.senderUserId);
    if (!peer?.remoteDescription) {
      const queued = this.queuedCandidates.get(signal.senderUserId) || [];
      this.queuedCandidates.set(signal.senderUserId, [...queued, candidate]);
      return;
    }
    await peer.addIceCandidate(candidate);
  }

  private peerFor(userId: number, name: string): RTCPeerConnection {
    const existing = this.peers.get(userId);
    if (existing) {
      return existing;
    }

    const config = (window as Window & { SC_CONNECT_CONFIG?: RTCConfiguration }).SC_CONNECT_CONFIG || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    const peer = new RTCPeerConnection(config);
    this.localStream?.getTracks().forEach((track) => peer.addTrack(track, this.localStream!));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.send({
          type: 'ICE',
          targetUserId: userId,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid || undefined,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined
        });
      }
    };
    peer.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.upsertParticipant(userId, name, stream);
    };
    peer.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peer.connectionState)) {
        this.removePeer(userId);
      }
    };
    this.peers.set(userId, peer);
    return peer;
  }

  private upsertParticipant(userId: number, name: string, stream: MediaStream): void {
    const current = this.remoteParticipants.find((participant) => participant.userId === userId);
    if (current) {
      current.stream = stream;
      this.remoteParticipants = [...this.remoteParticipants];
      return;
    }
    this.remoteParticipants = [...this.remoteParticipants, { userId, name, stream }];
  }

  private async flushCandidates(userId: number): Promise<void> {
    const peer = this.peers.get(userId);
    const candidates = this.queuedCandidates.get(userId) || [];
    if (!peer) return;
    for (const candidate of candidates) {
      await peer.addIceCandidate(candidate);
    }
    this.queuedCandidates.delete(userId);
  }

  private removePeer(userId: number): void {
    this.peers.get(userId)?.close();
    this.peers.delete(userId);
    this.queuedCandidates.delete(userId);
    this.remoteParticipants = this.remoteParticipants.filter((participant) => participant.userId !== userId);
  }

  private checkMeetingStatus(): void {
    this.api.meeting(this.meetingId).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        if (meeting.status !== 'LIVE') {
          this.error = 'This meeting has ended.';
          setTimeout(() => void this.router.navigateByUrl('/meetings'), 900);
        }
      }
    });
  }

  private closeMedia(): void {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
  }
}
