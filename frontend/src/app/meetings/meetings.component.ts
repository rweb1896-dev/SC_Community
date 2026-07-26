import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideBadgeCheck,
  LucideClock3,
  LucideGraduationCap,
  LucideHeartHandshake,
  LucideRadio,
  LucideStethoscope,
  LucideUsersRound,
  LucideVideo,
  LucideWrench
} from '@lucide/angular';
import { auditTime, interval, Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CommunityApiService } from '../core/community-api.service';
import { MeetingSocketService } from '../core/meeting-socket.service';
import { Meeting, MeetingAudience } from '../core/models';

@Component({
  selector: 'app-meetings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideBadgeCheck,
    LucideClock3,
    LucideGraduationCap,
    LucideHeartHandshake,
    LucideRadio,
    LucideStethoscope,
    LucideUsersRound,
    LucideVideo,
    LucideWrench
  ],
  templateUrl: './meetings.component.html',
  styleUrl: './meetings.component.css'
})
export class MeetingsComponent implements OnInit, OnDestroy {
  meetings: Meeting[] = [];
  loading = true;
  submitting = false;
  error = '';
  success = '';
  requestForm: { title: string; agenda: string; audience: MeetingAudience } = {
    title: '',
    agenda: '',
    audience: 'ALL'
  };
  readonly audiences: { value: MeetingAudience; label: string; description: string }[] = [
    { value: 'ALL', label: 'Everyone', description: 'All verified members' },
    { value: 'DOCTORS', label: 'Doctors', description: 'Healthcare group' },
    { value: 'ENGINEERS', label: 'Engineers', description: 'Engineering group' },
    { value: 'EDUCATION', label: 'Education', description: 'Teachers and educators' },
    { value: 'SOCIAL_WORKERS', label: 'Social workers', description: 'Community service group' }
  ];
  private subscriptions = new Subscription();

  constructor(
    public auth: AuthService,
    private api: CommunityApiService,
    private socket: MeetingSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMeetings();
    this.socket.connect();
    this.subscriptions.add(this.socket.updates$.pipe(auditTime(250)).subscribe(() => this.loadMeetings(false)));
    this.subscriptions.add(interval(15000).subscribe(() => this.loadMeetings(false)));
  }

  get liveMeetings(): Meeting[] {
    return this.meetings.filter((meeting) => meeting.status === 'LIVE');
  }

  get myRequests(): Meeting[] {
    return this.meetings.filter((meeting) => meeting.hostId === this.auth.session?.userId);
  }

  requestMeeting(): void {
    if (!this.requestForm.title.trim() || this.submitting) {
      return;
    }
    this.submitting = true;
    this.error = '';
    this.success = '';
    this.api.requestMeeting(
      this.requestForm.title.trim(),
      this.requestForm.agenda.trim(),
      this.requestForm.audience
    ).subscribe({
      next: (meeting) => {
        this.meetings = [meeting, ...this.meetings.filter((item) => item.id !== meeting.id)];
        this.requestForm = { title: '', agenda: '', audience: 'ALL' };
        this.success = 'Request sent. The meeting will go live as soon as an admin approves it.';
        this.submitting = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Meeting request could not be sent';
        this.submitting = false;
      }
    });
  }

  join(meeting: Meeting): void {
    if (!meeting.canJoin) {
      return;
    }
    this.error = '';
    this.api.joinMeeting(meeting.id).subscribe({
      next: () => this.router.navigate(['/meetings', meeting.id]),
      error: (error) => this.error = error.error?.detail || 'Unable to join this meeting'
    });
  }

  loadMeetings(showLoader = true): void {
    if (showLoader) {
      this.loading = true;
    }
    this.api.meetings().subscribe({
      next: (meetings) => {
        this.meetings = meetings;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Meetings could not be loaded';
        this.loading = false;
      }
    });
  }

  audienceLabel(audience: MeetingAudience): string {
    return this.audiences.find((item) => item.value === audience)?.label || audience;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.socket.disconnect();
  }
}
