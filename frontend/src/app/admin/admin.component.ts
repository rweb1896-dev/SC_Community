import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityApiService } from '../core/community-api.service';
import { Broadcast, BroadcastMediaType, BroadcastStatus, CommunityEvent, Dashboard, EventStatus, GalleryImage, InviteCode, Meeting, Post, ProfessionalGroup, UserResponse } from '../core/models';
import { MeetingSocketService } from '../core/meeting-socket.service';
import { auditTime, interval, Subscription } from 'rxjs';
import { LucideCalendarDays, LucideCheck, LucideCopy, LucideImages, LucidePause, LucidePlay, LucidePlus, LucideRadio, LucideSquare, LucideTrash2, LucideUpload } from '@lucide/angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideCalendarDays, LucideCheck, LucideCopy, LucideImages, LucidePause, LucidePlay, LucidePlus, LucideRadio, LucideSquare, LucideTrash2, LucideUpload],
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
  contentTab: 'events' | 'broadcasts' | 'gallery' = 'events';
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
  private subscriptions = new Subscription();

  constructor(private api: CommunityApiService, private meetingSocket: MeetingSocketService) {}

  ngOnInit(): void {
    this.refresh();
    this.meetingSocket.connect();
    this.subscriptions.add(this.meetingSocket.updates$.pipe(auditTime(250)).subscribe(() => this.loadPendingMeetings()));
    this.subscriptions.add(interval(15000).subscribe(() => this.loadPendingMeetings()));
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

  private loadContent(): void {
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.meetingSocket.disconnect();
  }
}
