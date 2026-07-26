import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityApiService } from '../core/community-api.service';
import { Dashboard, InviteCode, Meeting, Post, ProfessionalGroup, UserResponse } from '../core/models';
import { MeetingSocketService } from '../core/meeting-socket.service';
import { auditTime, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  dashboard?: Dashboard;
  users: UserResponse[] = [];
  codes: InviteCode[] = [];
  posts: Post[] = [];
  pendingMeetings: Meeting[] = [];
  selectedCategory?: number;
  error = '';
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
    this.api.inviteCodes().subscribe((codes) => this.codes = codes);
    this.api.posts().subscribe((posts) => this.posts = posts);
    this.loadPendingMeetings();
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
    this.api.generateInviteCode().subscribe((code) => this.codes = [code, ...this.codes]);
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.meetingSocket.disconnect();
  }
}
