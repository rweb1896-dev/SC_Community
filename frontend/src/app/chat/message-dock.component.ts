import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, retry, Subscription } from 'rxjs';
import { LucideChevronDown, LucideMessageCircle, LucideMinus, LucideRefreshCw, LucideSearch, LucideSend, LucideX } from '@lucide/angular';
import { AuthService } from '../core/auth.service';
import { ChatService } from '../core/chat.service';
import { CommunityApiService } from '../core/community-api.service';
import { Message, UserResponse } from '../core/models';

@Component({
  selector: 'app-message-dock',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideChevronDown, LucideMessageCircle, LucideMinus, LucideRefreshCw, LucideSearch, LucideSend, LucideX],
  templateUrl: './message-dock.component.html',
  styleUrl: './message-dock.component.css'
})
export class MessageDockComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;
  @ViewChild('dockComposer') private dockComposer?: ElementRef<HTMLTextAreaElement>;
  @Input() openRequest = 0;
  users: UserResponse[] = [];
  messages: Message[] = [];
  selectedUser?: UserResponse;
  draft = '';
  searchTerm = '';
  error = '';
  loadingUsers = true;
  panelOpen = false;
  conversationMinimized = false;
  onlineUserIds = new Set<number>();
  unreadByUser = new Map<number, number>();
  private subscriptions = new Subscription();
  private shouldScroll = false;

  constructor(public auth: AuthService, private api: CommunityApiService, private chat: ChatService) {}

  get filteredUsers(): UserResponse[] {
    const search = this.searchTerm.trim().toLowerCase();
    return search ? this.users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(search)) : this.users;
  }

  get unreadTotal(): number {
    return [...this.unreadByUser.values()].reduce((total, count) => total + count, 0);
  }

  ngOnInit(): void {
    this.panelOpen = window.innerWidth >= 1100;
    this.loadUsers();
    this.chat.connect();
    this.subscriptions.add(this.chat.incoming$.subscribe((message) => this.receive(message)));
    this.subscriptions.add(this.chat.onlineUserIds$.subscribe((ids) => this.onlineUserIds = new Set(ids)));
    this.subscriptions.add(this.api.onlineUserIds().subscribe({
      next: (ids) => this.onlineUserIds = new Set(ids),
      error: () => this.onlineUserIds = new Set()
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openRequest'] && this.openRequest > 0) this.panelOpen = true;
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScroll || !this.messageList) return;
    this.shouldScroll = false;
    this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.error = '';
    this.api.verifiedUsers().pipe(retry({ count: 2, delay: 600 }), finalize(() => this.loadingUsers = false)).subscribe({
      next: (users) => {
        const currentId = this.auth.session?.userId;
        this.users = users.filter((user) => user.id !== currentId && user.status === 'VERIFIED' && user.role !== 'ROLE_ADMIN');
      },
      error: (error) => this.error = error.error?.detail || 'Messages could not be loaded.'
    });
  }

  togglePanel(): void { this.panelOpen = !this.panelOpen; }
  openPanel(): void { this.panelOpen = true; }

  selectUser(user: UserResponse): void {
    this.selectedUser = user;
    this.conversationMinimized = false;
    this.unreadByUser.delete(user.id);
    this.messages = [];
    this.api.conversation(user.id).subscribe({
      next: (messages) => { this.messages = messages; this.shouldScroll = true; },
      error: () => this.error = 'Conversation could not be loaded.'
    });
    if (window.innerWidth < 700) this.panelOpen = false;
  }

  minimizeConversation(): void { this.conversationMinimized = true; }
  restoreConversation(): void { this.conversationMinimized = false; this.shouldScroll = true; }
  closeConversation(): void { this.selectedUser = undefined; this.messages = []; this.draft = ''; }

  send(): void {
    const body = this.draft.trim();
    if (!this.selectedUser || !body) return;
    this.draft = '';
    this.chat.send(this.selectedUser.id, body);
    this.resetComposer(this.dockComposer);
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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }

  isOnline(userId: number): boolean { return this.onlineUserIds.has(userId); }
  unreadFor(userId: number): number { return this.unreadByUser.get(userId) || 0; }
  initials(name: string): string { return name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase(); }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.chat.disconnect();
  }

  private receive(message: Message): void {
    const currentId = this.auth.session?.userId;
    const otherUserId = message.senderId === currentId ? message.receiverId : message.senderId;
    if (this.selectedUser?.id === otherUserId) {
      if (!this.messages.some((item) => item.id === message.id)) this.messages = [...this.messages, message];
      if (this.conversationMinimized && message.senderId !== currentId) {
        this.unreadByUser.set(otherUserId, this.unreadFor(otherUserId) + 1);
      }
      this.shouldScroll = true;
      return;
    }
    if (message.senderId !== currentId) this.unreadByUser.set(otherUserId, this.unreadFor(otherUserId) + 1);
  }

  private resetComposer(composer?: ElementRef<HTMLTextAreaElement>): void {
    queueMicrotask(() => {
      if (composer) composer.nativeElement.style.height = '40px';
    });
  }
}
