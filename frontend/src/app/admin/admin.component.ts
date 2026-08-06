import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityApiService } from '../core/community-api.service';
import { Broadcast, BroadcastMediaType, BroadcastStatus, CommunityEvent, Dashboard, EventStatus, GalleryImage, InviteCode, InviteRequest, ManagedContent, ManagedContentInput, ManagedContentStatus, MemberInviteRequest, Meeting, Post, ProfessionalGroup, UserResponse } from '../core/models';
import { MeetingSocketService } from '../core/meeting-socket.service';
import { auditTime, interval, Subscription } from 'rxjs';
import { LucideBan, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideCopy, LucideImages, LucideMail, LucidePause, LucidePlay, LucidePlus, LucideRadio, LucideRotateCcw, LucideSend, LucideSmartphone, LucideSquare, LucideTrash2, LucideUpload, LucideUserRound, LucideX } from '@lucide/angular';
import { COMMUNITY_LEADERS } from '../core/community-leaders';
import { COMMUNITY_BOOKS, PAID_COMMUNITY_BOOKS } from '../core/community-resources';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideBan, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideCopy, LucideImages, LucideMail, LucidePause, LucidePlay, LucidePlus, LucideRadio, LucideRotateCcw, LucideSend, LucideSmartphone, LucideSquare, LucideTrash2, LucideUpload, LucideUserRound, LucideX],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  dashboard?: Dashboard;
  users: UserResponse[] = [];
  codes: InviteCode[] = [];
  posts: Post[] = [];
  pendingMeetings: Meeting[] = [];
  events: CommunityEvent[] = [];
  broadcasts: Broadcast[] = [];
  galleryImages: GalleryImage[] = [];
  selectedCategory?: number;
  error = '';
  latestCode?: InviteCode;
  generatingCode = false;
  copiedCode = '';
  copiedInviteMessage = false;
  copiedApprovedMessage = false;
  inviteRequests: InviteRequest[] = [];
  memberInviteRequests: MemberInviteRequest[] = [];
  approvedInviteRequest?: InviteRequest;
  approvingInviteRequestId?: number;
  invitePanelOpen = false;
  inviteChannel: 'EMAIL' | 'MOBILE' = 'EMAIL';
  inviteRecipient = '';
  inviteFeedback = '';
  contentTab: 'leaders' | 'books' | 'events' | 'broadcasts' | 'gallery' = 'leaders';
  managedContent: ManagedContent[] = [];
  managingRecordId?: number;
  leaderForm = { name: '', role: '', contribution: '', era: 'CURRENT', department: '', imageUrl: '', overview: '' };
  bookForm = { title: '', author: '', summary: '', kind: 'FREE', languageOrFormat: 'English', url: '', imageUrl: '', sourceOrPrice: '' };
  savingContent = false;
  eventForm = { title: '', summary: '', venue: '', eventAt: '', registrationUrl: '' };
  broadcastForm = {
    title: '',
    description: '',
    hostName: '',
    mediaType: 'YOUTUBE' as BroadcastMediaType,
    mediaUrl: '',
    scheduledAt: ''
  };
  galleryForm = { title: '', caption: '', eventId: '' as number | '' };
  galleryFile?: File;
  galleryFileName = '';
  private galleryFileInput?: HTMLInputElement;
  readonly professionalGroups: { value: ProfessionalGroup; label: string }[] = [
    { value: 'COMMUNITY', label: 'Community' },
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'ENGINEER', label: 'Engineer' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'SOCIAL_WORKER', label: 'Social worker' }
  ];

  get leaderContentRows(): ManagedContent[] {
    return this.mergeDefaults('LEADER', COMMUNITY_LEADERS.map((leader) => ({
      type: 'LEADER' as const, key: leader.id, title: leader.name, byline: leader.role,
      summary: leader.contribution, category: leader.era, source: leader.department,
      url: leader.photoSourceUrl, imageUrl: leader.imageUrl, details: leader.overview
    })));
  }

  get bookContentRows(): ManagedContent[] {
    const free = COMMUNITY_BOOKS.map((book) => ({ type: 'BOOK' as const, key: book.id, title: book.title,
      byline: book.author, summary: book.summary, category: 'FREE', source: book.language,
      url: book.pdfUrl, imageUrl: '/favicon.svg', details: book.source }));
    const print = PAID_COMMUNITY_BOOKS.map((book) => ({ type: 'BOOK' as const, key: book.id, title: book.title,
      byline: book.author, summary: book.summary, category: 'PRINT', source: book.format,
      url: book.storeUrl, imageUrl: book.coverImageUrl, details: book.price }));
    return this.mergeDefaults('BOOK', [...free, ...print]);
  }
  private subscriptions = new Subscription();

  constructor(private api: CommunityApiService, private meetingSocket: MeetingSocketService) {}

  get inviteRegistrationUrl(): string {
    if (!this.latestCode) return '';
    return this.registrationUrlFor(this.latestCode.code);
  }

  get inviteMessage(): string {
    if (!this.latestCode) return '';
    return this.messageForCode(this.latestCode.code);
  }

  get approvedInviteMessage(): string {
    return this.approvedInviteRequest?.inviteCode
      ? this.messageForCode(this.approvedInviteRequest.inviteCode)
      : '';
  }

  ngOnInit(): void {
    this.refresh();
    this.meetingSocket.connect();
    this.subscriptions.add(this.meetingSocket.updates$.pipe(auditTime(250)).subscribe(() => this.loadPendingMeetings()));
    this.subscriptions.add(interval(15000).subscribe(() => {
      this.loadPendingMeetings();
      this.loadInviteRequests();
      this.loadMemberInviteRequests();
    }));
  }

  refresh(): void {
    this.api.dashboard().subscribe((dashboard) => this.dashboard = dashboard);
    this.api.users().subscribe((users) => this.users = users);
    this.api.inviteCodes().subscribe((codes) => {
      this.codes = [...codes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.latestCode = this.codes.find((code) => !code.used);
    });
    this.api.posts().subscribe((posts) => this.posts = posts);
    this.loadContent();
    this.loadPendingMeetings();
    this.loadInviteRequests();
    this.loadMemberInviteRequests();
  }

  createLeader(): void {
    const form = this.leaderForm;
    if (!form.name.trim() || !form.role.trim() || !form.contribution.trim() || !/^https?:\/\//i.test(form.imageUrl)) {
      this.error = 'Add the leader name, role, contribution and a valid image URL.'; return;
    }
    const input: ManagedContentInput = { type: 'LEADER', key: this.uniqueKey(form.name), title: form.name.trim(),
      byline: form.role.trim(), summary: form.contribution.trim(), category: form.era,
      source: form.department.trim() || 'Community leadership', url: form.imageUrl.trim(),
      imageUrl: form.imageUrl.trim(), details: form.overview.trim() || form.contribution.trim() };
    this.saveManaged(input, () => this.leaderForm = { name: '', role: '', contribution: '', era: 'CURRENT', department: '', imageUrl: '', overview: '' });
  }

  createBook(): void {
    const form = this.bookForm;
    if (!form.title.trim() || !form.author.trim() || !form.summary.trim() || !/^https?:\/\//i.test(form.url)) {
      this.error = 'Add the book title, author, summary and a valid reading/store URL.'; return;
    }
    const input: ManagedContentInput = { type: 'BOOK', key: this.uniqueKey(form.title), title: form.title.trim(),
      byline: form.author.trim(), summary: form.summary.trim(), category: form.kind,
      source: form.languageOrFormat.trim() || (form.kind === 'FREE' ? 'English' : 'Print edition'), url: form.url.trim(),
      imageUrl: form.imageUrl.trim() || '/favicon.svg', details: form.sourceOrPrice.trim() || 'Community Library' };
    this.saveManaged(input, () => this.bookForm = { title: '', author: '', summary: '', kind: 'FREE', languageOrFormat: 'English', url: '', imageUrl: '', sourceOrPrice: '' });
  }

  setManagedStatus(item: ManagedContent, status: ManagedContentStatus): void {
    this.error = '';
    this.managingRecordId = item.recordId || -1;
    const update = (saved: ManagedContent) => this.api.setManagedContentStatus(saved.recordId, status).subscribe({
      next: () => { this.managingRecordId = undefined; this.loadManagedContent(); },
      error: (error) => { this.error = error.error?.detail || 'Content status could not be updated'; this.managingRecordId = undefined; }
    });
    if (item.recordId) update(item);
    else this.api.saveManagedContent(this.contentInput(item)).subscribe({ next: update,
      error: (error) => { this.error = error.error?.detail || 'Content could not be managed'; this.managingRecordId = undefined; } });
  }

  approveMemberInviteRequest(request: MemberInviteRequest): void {
    this.approvingInviteRequestId = request.id;
    this.api.approveMemberInviteRequest(request.id).subscribe({
      next: () => { this.approvingInviteRequestId = undefined; this.loadMemberInviteRequests(); },
      error: (error) => { this.error = error.error?.detail || 'Member request could not be approved'; this.approvingInviteRequestId = undefined; }
    });
  }

  rejectMemberInviteRequest(request: MemberInviteRequest): void {
    this.api.rejectMemberInviteRequest(request.id, 'Request reviewed by administrator').subscribe({
      next: () => this.loadMemberInviteRequests(),
      error: (error) => this.error = error.error?.detail || 'Member request could not be rejected'
    });
  }

  createEvent(): void {
    const eventAt = new Date(this.eventForm.eventAt);
    if (!this.eventForm.title.trim() || !this.eventForm.summary.trim() || !this.eventForm.venue.trim() || Number.isNaN(eventAt.getTime())) {
      this.error = 'Complete the event title, summary, venue and date.';
      return;
    }
    this.error = '';
    this.savingContent = true;
    this.api.createEvent(
      this.eventForm.title,
      this.eventForm.summary,
      this.eventForm.venue,
      eventAt.toISOString(),
      this.eventForm.registrationUrl
    ).subscribe({
      next: (event) => {
        this.events = [...this.events, event].sort((a, b) => a.eventAt.localeCompare(b.eventAt));
        this.eventForm = { title: '', summary: '', venue: '', eventAt: '', registrationUrl: '' };
        this.savingContent = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Event could not be published';
        this.savingContent = false;
      }
    });
  }

  setEventStatus(event: CommunityEvent, status: EventStatus): void {
    this.api.updateEventStatus(event.id, status).subscribe({
      next: (updated) => Object.assign(event, updated),
      error: (error) => this.error = error.error?.detail || 'Event status could not be updated'
    });
  }

  deleteEvent(event: CommunityEvent): void {
    this.api.deleteEvent(event.id).subscribe({
      next: () => this.events = this.events.filter((item) => item.id !== event.id),
      error: (error) => this.error = error.error?.detail || 'Event could not be deleted'
    });
  }

  createBroadcast(): void {
    if (!this.broadcastForm.title.trim() || !this.broadcastForm.description.trim() || !this.broadcastForm.hostName.trim() || !/^https?:\/\//i.test(this.broadcastForm.mediaUrl)) {
      this.error = 'Complete the programme details and enter a valid media URL.';
      return;
    }
    const scheduledAt = this.broadcastForm.scheduledAt
      ? new Date(this.broadcastForm.scheduledAt).toISOString()
      : undefined;
    this.error = '';
    this.savingContent = true;
    this.api.createBroadcast(
      this.broadcastForm.title,
      this.broadcastForm.description,
      this.broadcastForm.hostName,
      this.broadcastForm.mediaType,
      this.broadcastForm.mediaUrl,
      scheduledAt
    ).subscribe({
      next: (broadcast) => {
        this.broadcasts = [broadcast, ...this.broadcasts];
        this.broadcastForm = { title: '', description: '', hostName: '', mediaType: 'YOUTUBE', mediaUrl: '', scheduledAt: '' };
        this.savingContent = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Broadcast could not be created';
        this.savingContent = false;
      }
    });
  }

  setBroadcastStatus(broadcast: Broadcast, status: BroadcastStatus): void {
    this.api.updateBroadcastStatus(broadcast.id, status).subscribe({
      next: () => this.loadContent(),
      error: (error) => this.error = error.error?.detail || 'Broadcast status could not be updated'
    });
  }

  deleteBroadcast(broadcast: Broadcast): void {
    this.api.deleteBroadcast(broadcast.id).subscribe({
      next: () => this.broadcasts = this.broadcasts.filter((item) => item.id !== broadcast.id),
      error: (error) => this.error = error.error?.detail || 'Broadcast could not be deleted'
    });
  }

  selectGalleryFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.galleryFileInput = input;
    this.galleryFile = file;
    this.galleryFileName = file?.name || '';
    if (file && file.size > 8 * 1024 * 1024) {
      this.error = 'Gallery image must be 8 MB or smaller.';
      this.galleryFile = undefined;
    }
  }

  uploadGalleryImage(): void {
    if (!this.galleryFile || !this.galleryForm.title.trim()) {
      this.error = 'Select a JPG or PNG image and add a photo title.';
      return;
    }
    this.error = '';
    this.savingContent = true;
    this.api.uploadGalleryImage(
      this.galleryFile,
      this.galleryForm.title,
      this.galleryForm.caption,
      this.galleryForm.eventId || undefined
    ).subscribe({
      next: (image) => {
        this.galleryImages = [image, ...this.galleryImages];
        this.galleryForm = { title: '', caption: '', eventId: '' };
        this.galleryFile = undefined;
        this.galleryFileName = '';
        if (this.galleryFileInput) this.galleryFileInput.value = '';
        this.savingContent = false;
      },
      error: (error) => {
        this.error = error.error?.detail || error.error?.message || 'Gallery image could not be uploaded';
        this.savingContent = false;
      }
    });
  }

  deleteGalleryImage(image: GalleryImage): void {
    this.api.deleteGalleryImage(image.id).subscribe({
      next: () => this.galleryImages = this.galleryImages.filter((item) => item.id !== image.id),
      error: (error) => this.error = error.error?.detail || 'Gallery image could not be deleted'
    });
  }

  approve(user: UserResponse): void {
    this.api.setUserStatus(user.id, 'VERIFIED').subscribe(() => this.refresh());
  }

  block(user: UserResponse): void {
    this.api.setUserStatus(user.id, 'BLOCKED').subscribe(() => this.refresh());
  }

  unblock(user: UserResponse): void {
    this.api.unblock(user.id).subscribe(() => this.refresh());
  }

  hidePost(post: Post): void {
    this.api.hidePost(post.id).subscribe(() => this.refresh());
  }

  generateCode(): void {
    this.error = '';
    this.generatingCode = true;
    this.api.generateInviteCode().subscribe({
      next: (code) => {
        this.latestCode = code;
        this.codes = [code, ...this.codes.filter((item) => item.id !== code.id)];
        this.generatingCode = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Invite code could not be generated';
        this.generatingCode = false;
      }
    });
  }

  copyInviteCode(code: string): void {
    this.error = '';
    this.copiedCode = code;
    navigator.clipboard.writeText(code).then(() => {
        setTimeout(() => {
          if (this.copiedCode === code) this.copiedCode = '';
        }, 1800);
      })
      .catch(() => {
        this.copiedCode = '';
        this.error = 'Copy failed. Select the code and copy it manually.';
      });
  }

  copyInviteMessage(): void {
    if (!this.inviteMessage) return;
    this.error = '';
    navigator.clipboard.writeText(this.inviteMessage).then(() => {
      this.copiedInviteMessage = true;
      setTimeout(() => this.copiedInviteMessage = false, 1800);
    }).catch(() => {
      this.error = 'Copy failed. Select the invite message and copy it manually.';
    });
  }

  copyApprovedInviteMessage(): void {
    if (!this.approvedInviteMessage) return;
    navigator.clipboard.writeText(this.approvedInviteMessage).then(() => {
      this.copiedApprovedMessage = true;
      setTimeout(() => this.copiedApprovedMessage = false, 1800);
    }).catch(() => this.error = 'Copy failed. Select the message and copy it manually.');
  }

  approveInviteRequest(request: InviteRequest): void {
    this.error = '';
    this.approvingInviteRequestId = request.id;
    this.api.approveInviteRequest(request.id).subscribe({
      next: (approved) => {
        this.approvedInviteRequest = approved;
        this.inviteRequests = this.inviteRequests.filter((item) => item.id !== request.id);
        this.approvingInviteRequestId = undefined;
        this.api.inviteCodes().subscribe((codes) => {
          this.codes = [...codes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          this.latestCode = this.codes.find((code) => !code.used);
        });
      },
      error: (error) => {
        this.error = error.error?.detail || 'Invite request could not be approved';
        this.approvingInviteRequestId = undefined;
      }
    });
  }

  openInvitePanel(): void {
    if (!this.latestCode) return;
    this.inviteRecipient = '';
    this.inviteFeedback = '';
    this.inviteChannel = 'EMAIL';
    this.invitePanelOpen = true;
  }

  closeInvitePanel(): void {
    this.invitePanelOpen = false;
    this.inviteFeedback = '';
  }

  sendInvite(): void {
    const recipient = this.inviteRecipient.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
    const normalizedMobile = recipient.replace(/[\s()-]/g, '');
    const validMobile = /^\+?[1-9]\d{9,14}$/.test(normalizedMobile);

    if ((this.inviteChannel === 'EMAIL' && !validEmail) || (this.inviteChannel === 'MOBILE' && !validMobile)) {
      this.inviteFeedback = this.inviteChannel === 'EMAIL'
        ? 'Enter a valid email address.'
        : 'Enter a valid mobile number with country code.';
      return;
    }

    this.inviteFeedback = '';
    if (this.inviteChannel === 'EMAIL') {
      const subject = encodeURIComponent('Your SC Community Connect invite');
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(this.inviteMessage)}`;
    } else {
      window.location.href = `sms:${normalizedMobile}?body=${encodeURIComponent(this.inviteMessage)}`;
    }
  }

  approveMeeting(meeting: Meeting): void {
    this.error = '';
    this.api.approveMeeting(meeting.id).subscribe({
      next: () => this.loadPendingMeetings(),
      error: (error) => this.error = error.error?.detail || 'Meeting could not be approved'
    });
  }

  rejectMeeting(meeting: Meeting): void {
    this.error = '';
    this.api.rejectMeeting(meeting.id, 'The request needs more information or a revised purpose.').subscribe({
      next: () => this.loadPendingMeetings(),
      error: (error) => this.error = error.error?.detail || 'Meeting could not be rejected'
    });
  }

  updateProfessionalGroup(user: UserResponse, professionalGroup: ProfessionalGroup): void {
    this.api.setProfessionalGroup(user.id, professionalGroup).subscribe({
      next: (updated) => Object.assign(user, updated),
      error: (error) => {
        this.error = error.error?.detail || 'Professional group could not be updated';
        this.api.users().subscribe((users) => this.users = users);
      }
    });
  }

  private loadPendingMeetings(): void {
    this.api.pendingMeetings().subscribe({
      next: (meetings) => this.pendingMeetings = meetings,
      error: (error) => this.error = error.error?.detail || 'Meeting requests could not be loaded'
    });
  }

  private loadInviteRequests(): void {
    this.api.inviteRequests().subscribe({
      next: (requests) => this.inviteRequests = requests,
      error: (error) => this.error = error.error?.detail || 'Invite requests could not be loaded'
    });
  }

  private loadMemberInviteRequests(): void {
    this.api.memberInviteRequests().subscribe({ next: (requests) => this.memberInviteRequests = requests,
      error: (error) => this.error = error.error?.detail || 'Member invite requests could not be loaded' });
  }

  private registrationUrlFor(code: string): string {
    return `${window.location.origin}/login?mode=register&invite=${encodeURIComponent(code)}`;
  }

  private messageForCode(code: string): string {
    return `You're invited to join SC Community Connect.\n\nRegister here: ${this.registrationUrlFor(code)}\nInvite code: ${code}\nEmail OTP: SC1E\nMobile OTP: SC2M\n\nThis invite code can be used once.`;
  }

  private loadContent(): void {
    this.loadManagedContent();
    this.api.adminEvents().subscribe({
      next: (events) => this.events = events,
      error: (error) => this.error = error.error?.detail || 'Events could not be loaded'
    });
    this.api.adminBroadcasts().subscribe({
      next: (broadcasts) => this.broadcasts = broadcasts,
      error: (error) => this.error = error.error?.detail || 'Broadcasts could not be loaded'
    });
    this.api.adminGallery().subscribe({
      next: (images) => this.galleryImages = images,
      error: (error) => this.error = error.error?.detail || 'Gallery could not be loaded'
    });
  }

  private loadManagedContent(): void {
    this.api.adminManagedContent().subscribe({ next: (items) => this.managedContent = items,
      error: (error) => this.error = error.error?.detail || 'Leaders and books could not be loaded' });
  }

  private saveManaged(input: ManagedContentInput, completed: () => void): void {
    this.error = ''; this.savingContent = true;
    this.api.saveManagedContent(input).subscribe({ next: () => { completed(); this.savingContent = false; this.loadManagedContent(); },
      error: (error) => { this.error = error.error?.detail || 'Content could not be saved'; this.savingContent = false; } });
  }

  private mergeDefaults(type: 'LEADER' | 'BOOK', defaults: ManagedContentInput[]): ManagedContent[] {
    const managed = new Map(this.managedContent.filter((item) => item.type === type).map((item) => [item.key, item]));
    const rows = defaults.map((item) => { const override = managed.get(item.key); managed.delete(item.key);
      return override || { ...item, recordId: 0, status: 'ACTIVE' as const, updatedAt: '' }; });
    return [...rows, ...managed.values()];
  }

  private contentInput(item: ManagedContent): ManagedContentInput {
    const { type, key, title, byline, summary, category, source, url, imageUrl, details } = item;
    return { type, key, title, byline, summary, category, source, url, imageUrl, details };
  }

  private uniqueKey(value: string): string {
    const base = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'item';
    return `${base}-${Date.now().toString(36)}`;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.meetingSocket.disconnect();
  }
}
