import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, retry, Subscription } from 'rxjs';
import { LucideMessageCircle, LucideRefreshCw, LucideSearch, LucideSend, LucideShieldCheck } from '@lucide/angular';
import { AuthService } from '../core/auth.service';
import { ChatService } from '../core/chat.service';
import { CommunityApiService } from '../core/community-api.service';
import { Message, UserResponse } from '../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideMessageCircle, LucideRefreshCw, LucideSearch, LucideSend, LucideShieldCheck],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('threadComposer') private threadComposer?: ElementRef<HTMLTextAreaElement>;
  users: UserResponse[] = [];
  messages: Message[] = [];
  selectedUser?: UserResponse;
  draft = '';
  error = '';
  loadingUsers = true;
  onlineUserIds = new Set<number>();
  private subscriptions = new Subscription();

  constructor(
    public auth: AuthService,
    private api: CommunityApiService,
    private chat: ChatService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.chat.connect();
    this.subscriptions.add(this.chat.incoming$.subscribe((message) => {
      if (this.selectedUser && [message.senderId, message.receiverId].includes(this.selectedUser.id)) {
        this.messages = [...this.messages, message];
      }
    }));
    this.subscriptions.add(this.chat.onlineUserIds$.subscribe((ids) => {
      this.onlineUserIds = new Set(ids);
    }));
    this.subscriptions.add(this.api.onlineUserIds().subscribe({
      next: (ids) => this.onlineUserIds = new Set(ids),
      error: () => this.onlineUserIds = new Set()
    }));
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.error = '';
    this.api.verifiedUsers().pipe(
      retry({ count: 2, delay: 600 }),
      finalize(() => this.loadingUsers = false)
    ).subscribe({
      next: (users) => {
        const currentId = this.auth.session?.userId;
        this.users = users.filter((user) => user.id !== currentId && user.status === 'VERIFIED');
      },
      error: (error) => {
        this.error = error.error?.detail || 'Members load nahi ho pa rahe hain';
      }
    });
  }

  selectUser(user: UserResponse): void {
    this.selectedUser = user;
    this.api.conversation(user.id).subscribe((messages) => this.messages = messages);
  }

  send(): void {
    if (!this.selectedUser || !this.draft.trim()) {
      return;
    }
    const body = this.draft.trim();
    this.draft = '';
    this.chat.send(this.selectedUser.id, body);
    queueMicrotask(() => {
      if (this.threadComposer) this.threadComposer.nativeElement.style.height = '42px';
    });
  }

  handleComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  resizeComposer(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 130)}px`;
  }

  isOnline(userId: number): boolean {
    return this.onlineUserIds.has(userId);
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
