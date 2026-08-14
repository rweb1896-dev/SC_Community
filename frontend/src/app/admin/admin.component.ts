import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityApiService } from '../core/community-api.service';
import { Achiever, AdminUserResponse, AgeGroup, Broadcast, BroadcastMediaType, BroadcastStatus, CommunityEvent, Dashboard, EventStatus, ExpertiseField, GalleryImage, InviteCode, InviteRequest, ManagedContent, ManagedContentInput, ManagedContentStatus, MemberInviteRequest, Meeting, Post, ProfessionalGroup, UserResponse } from '../core/models';
import { MeetingSocketService } from '../core/meeting-socket.service';
import { auditTime, interval, Subscription } from 'rxjs';
import { LucideAward, LucideBan, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideCopy, LucideImages, LucideMail, LucidePause, LucidePlay, LucidePlus, LucideRadio, LucideRotateCcw, LucideSend, LucideSmartphone, LucideSquare, LucideTrash2, LucideUpload, LucideUserRound, LucideX } from '@lucide/angular';
import { COMMUNITY_LEADERS } from '../core/community-leaders';
import { COMMUNITY_BOOKS, PAID_COMMUNITY_BOOKS } from '../core/community-resources';
import { TranslatePipe } from '../core/translate.pipe';
import { I18nService } from '../core/i18n.service';

type DirectoryFilterKey = 'SEARCH' | 'STATUS' | 'GROUP' | 'PROFILE_TYPE' | 'WORK_STATUS' | 'EMPLOYMENT' | 'AGE_GROUP' | 'JOB_SEARCH' | 'HELP_FIELD' | 'COMPLETION';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LucideAward, LucideBan, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideCopy, LucideImages, LucideMail, LucidePause, LucidePlay, LucidePlus, LucideRadio, LucideRotateCcw, LucideSend, LucideSmartphone, LucideSquare, LucideTrash2, LucideUpload, LucideUserRound, LucideX],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  dashboard?: Dashboard;
  users: AdminUserResponse[] = [];
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
  memberSearch = '';
  memberStatusFilter: 'ALL' | 'PENDING' | 'VERIFIED' | 'BLOCKED' = 'ALL';
  memberGroupFilter: ProfessionalGroup | 'ALL' = 'ALL';
  memberHelpFilter: number | 'ALL' = 'ALL';
  memberCompletionFilter: 'ALL' | 'COMPLETE' | 'INCOMPLETE' = 'ALL';
  memberProfileCategoryFilter = 'ALL';
  memberWorkStatusFilter = 'ALL';
  memberEmploymentTypeFilter = 'ALL';
  memberAgeGroupFilter: AgeGroup | 'ALL' = 'ALL';
  memberJobSeekerFilter: 'ALL' | 'LOOKING' | 'NOT_LOOKING' = 'ALL';
  activeDirectoryFilters: DirectoryFilterKey[] = ['SEARCH'];
  directoryFilterToAdd: DirectoryFilterKey | '' = '';
  selectedMember?: AdminUserResponse;
  invitePanelOpen = false;
  inviteChannel: 'EMAIL' | 'MOBILE' = 'EMAIL';
  inviteRecipient = '';
  inviteFeedback = '';
  contentTab: 'leaders' | 'achievers' | 'books' | 'events' | 'broadcasts' | 'gallery' = 'leaders';
  workspaceTab: 'overview' | 'invitations' | 'content' | 'members' | 'moderation' = 'overview';
  managedContent: ManagedContent[] = [];
  managingRecordId?: number;
  leaderForm = { name: '', role: '', contribution: '', era: 'CURRENT', department: '', imageUrl: '', overview: '' };
  bookForm = { title: '', author: '', summary: '', kind: 'FREE', languageOrFormat: 'English', url: '', imageUrl: '', sourceOrPrice: '' };
  savingContent = false;
  expertiseFields: ExpertiseField[] = [];
  achievers: Achiever[] = [];
  fieldForm = { name: '', description: '', iconKey: 'STAR', displayOrder: 100 };
  achieverForm = { expertiseFieldId: 0, fullName: '', title: '', achievement: '', biography: '', imageUrl: '', profileUrl: '', displayOrder: 100 };
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
  readonly profileCategoryOptions = [
    { value: 'DOCTOR', label: 'Doctor' }, { value: 'ENGINEER', label: 'Engineer' },
    { value: 'STUDENT', label: 'Student' }, { value: 'TEACHER', label: 'Teacher' },
    { value: 'LAWYER', label: 'Lawyer' }, { value: 'BUSINESS', label: 'Business' },
    { value: 'GOVERNMENT', label: 'Government service' }, { value: 'COMMUNITY', label: 'Community' },
    { value: 'OTHER', label: 'Other' }
  ];
  readonly workStatusOptions = [
    { value: 'WORKING', label: 'Working' }, { value: 'STUDENT', label: 'Student' },
    { value: 'RETIRED', label: 'Retired' }, { value: 'LOOKING', label: 'Looking for work' },
    { value: 'SELF_EMPLOYED', label: 'Self-employed' }, { value: 'UNEMPLOYED', label: 'Unemployed' }
  ];
  readonly employmentTypeOptions = [
    { value: 'GOVT_JOB', label: 'Govt job' }, { value: 'PRIVATE_JOB', label: 'Private job' },
    { value: 'BUSINESS', label: 'Business' }, { value: 'FREELANCE', label: 'Freelance' },
    { value: 'NOT_APPLICABLE', label: 'Not applicable' }
  ];
  readonly directoryFilterOptions: { key: DirectoryFilterKey; label: string }[] = [
    { key: 'SEARCH', label: 'Search members' }, { key: 'STATUS', label: 'Status' },
    { key: 'GROUP', label: 'Group' }, { key: 'PROFILE_TYPE', label: 'Profile type' },
    { key: 'WORK_STATUS', label: 'Work status' }, { key: 'EMPLOYMENT', label: 'Employment' },
    { key: 'AGE_GROUP', label: 'Age group' }, { key: 'JOB_SEARCH', label: 'Job search' },
    { key: 'HELP_FIELD', label: 'Help field' }, { key: 'COMPLETION', label: 'Profile completion' }
  ];

  get filteredUsers(): AdminUserResponse[] {
    const query = this.memberSearch.trim().toLowerCase();
    return this.users.filter((user) => {
      const profileText = [
        user.fullName, user.email, user.phoneNumber, user.currentPost, user.position,
        user.school, user.college, user.bestAchievement, user.address, user.profileCategory, user.workStatus, user.employmentType, ...(user.helpFieldNames || [])
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !this.hasDirectoryFilter('SEARCH') || !query || profileText.includes(query);
      const matchesStatus = !this.hasDirectoryFilter('STATUS') || this.memberStatusFilter === 'ALL' || user.status === this.memberStatusFilter;
      const matchesGroup = !this.hasDirectoryFilter('GROUP') || this.memberGroupFilter === 'ALL' || user.professionalGroup === this.memberGroupFilter;
      const matchesHelp = !this.hasDirectoryFilter('HELP_FIELD') || this.memberHelpFilter === 'ALL' || (user.helpFieldIds || []).includes(Number(this.memberHelpFilter));
      const matchesProfileCategory = !this.hasDirectoryFilter('PROFILE_TYPE') || this.memberProfileCategoryFilter === 'ALL' || user.profileCategory === this.memberProfileCategoryFilter;
      const matchesWorkStatus = !this.hasDirectoryFilter('WORK_STATUS') || this.memberWorkStatusFilter === 'ALL' || user.workStatus === this.memberWorkStatusFilter;
      const matchesEmploymentType = !this.hasDirectoryFilter('EMPLOYMENT') || this.memberEmploymentTypeFilter === 'ALL' || user.employmentType === this.memberEmploymentTypeFilter;
      const matchesAgeGroup = !this.hasDirectoryFilter('AGE_GROUP') || this.memberAgeGroupFilter === 'ALL' || user.ageGroup === this.memberAgeGroupFilter;
      const matchesJobSeeker = !this.hasDirectoryFilter('JOB_SEARCH') || this.memberJobSeekerFilter === 'ALL'
        || (this.memberJobSeekerFilter === 'LOOKING' && (user.lookingForJob || user.workStatus === 'LOOKING' || user.workStatus === 'UNEMPLOYED'))
        || (this.memberJobSeekerFilter === 'NOT_LOOKING' && !user.lookingForJob && user.workStatus !== 'LOOKING' && user.workStatus !== 'UNEMPLOYED');
      const completion = user.profileCompletion || 0;
      const matchesCompletion = !this.hasDirectoryFilter('COMPLETION') || this.memberCompletionFilter === 'ALL'
        || (this.memberCompletionFilter === 'COMPLETE' && completion >= 80)
        || (this.memberCompletionFilter === 'INCOMPLETE' && completion < 80);
      return matchesQuery && matchesStatus && matchesGroup && matchesHelp && matchesProfileCategory
        && matchesWorkStatus && matchesEmploymentType && matchesAgeGroup && matchesJobSeeker && matchesCompletion;
    });
  }

  profileOptionLabel(value?: string): string {
    return [...this.profileCategoryOptions, ...this.workStatusOptions, ...this.employmentTypeOptions]
      .find((item) => item.value === value)?.label || value || 'Not added';
  }

  get memberCompletionAverage(): number {
    if (!this.users.length) return 0;
    return Math.round(this.users.reduce((sum, user) => sum + (user.profileCompletion || 0), 0) / this.users.length);
  }

  get ageInsights(): { label: string; value: AgeGroup; count: number }[] {
    return [
      { label: 'Under 18', value: 'UNDER_18', count: this.users.filter(user => user.ageGroup === 'UNDER_18').length },
      { label: '18–24', value: '18_24', count: this.users.filter(user => user.ageGroup === '18_24').length },
      { label: '25–34', value: '25_34', count: this.users.filter(user => user.ageGroup === '25_34').length },
      { label: '35–44', value: '35_44', count: this.users.filter(user => user.ageGroup === '35_44').length },
      { label: '45–59', value: '45_59', count: this.users.filter(user => user.ageGroup === '45_59').length },
      { label: '60+', value: '60_PLUS', count: this.users.filter(user => user.ageGroup === '60_PLUS').length }
    ];
  }

  get jobSeekingMembers(): number {
    return this.users.filter(user => user.lookingForJob || user.workStatus === 'LOOKING' || user.workStatus === 'UNEMPLOYED').length;
  }

  hasDirectoryFilter(key: DirectoryFilterKey): boolean { return this.activeDirectoryFilters.includes(key); }

  directoryFilterLabel(key: DirectoryFilterKey): string {
    return this.directoryFilterOptions.find((item) => item.key === key)?.label || key;
  }

  addDirectoryFilter(key: DirectoryFilterKey | ''): void {
    if (key && !this.activeDirectoryFilters.includes(key)) this.activeDirectoryFilters = [...this.activeDirectoryFilters, key];
    this.directoryFilterToAdd = '';
  }

  removeDirectoryFilter(key: DirectoryFilterKey): void {
    this.activeDirectoryFilters = this.activeDirectoryFilters.filter((item) => item !== key);
    if (key === 'SEARCH') this.memberSearch = '';
    if (key === 'STATUS') this.memberStatusFilter = 'ALL';
    if (key === 'GROUP') this.memberGroupFilter = 'ALL';
    if (key === 'PROFILE_TYPE') this.memberProfileCategoryFilter = 'ALL';
    if (key === 'WORK_STATUS') this.memberWorkStatusFilter = 'ALL';
    if (key === 'EMPLOYMENT') this.memberEmploymentTypeFilter = 'ALL';
    if (key === 'AGE_GROUP') this.memberAgeGroupFilter = 'ALL';
    if (key === 'JOB_SEARCH') this.memberJobSeekerFilter = 'ALL';
    if (key === 'HELP_FIELD') this.memberHelpFilter = 'ALL';
    if (key === 'COMPLETION') this.memberCompletionFilter = 'ALL';
  }

  clearDirectoryFilters(): void { [...this.activeDirectoryFilters].forEach((key) => this.removeDirectoryFilter(key)); }

  focusAgeGroup(value: AgeGroup): void {
    this.addDirectoryFilter('AGE_GROUP');
    this.memberAgeGroupFilter = value;
  }

  focusJobSeekers(): void {
    this.addDirectoryFilter('JOB_SEARCH');
    this.memberJobSeekerFilter = 'LOOKING';
  }

  openMemberDetails(user: AdminUserResponse): void { this.selectedMember = user; }
  closeMemberDetails(): void { this.selectedMember = undefined; }

  smartMemberSummary(user: AdminUserResponse): string {
    const signals = [user.profileCategory, user.currentPost || user.position, user.bestAchievement, ...(user.helpFieldNames || [])].filter(Boolean);
    if (user.lookingForJob || user.workStatus === 'LOOKING' || user.workStatus === 'UNEMPLOYED') {
      return `Opportunity match: ${signals.slice(0, 2).join(' · ') || 'complete profile for suitable roles'}`;
    }
    return `Best routing: ${signals.slice(0, 3).join(' · ') || 'complete profile to improve matching'}`;
  }

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

  constructor(private api: CommunityApiService, private meetingSocket: MeetingSocketService, private i18n: I18nService) {}

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
    this.error = '';
    const failed = (error: any) => this.error = this.apiError(error, 'Administration data could not be loaded.');
    this.api.dashboard().subscribe({ next: (dashboard) => this.dashboard = dashboard, error: failed });
    this.api.users().subscribe({ next: (users) => this.users = users, error: failed });
    this.api.inviteCodes().subscribe({ next: (codes) => {
      this.codes = [...codes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.latestCode = this.codes.find((code) => !code.used);
    }, error: failed });
    this.api.posts().subscribe({ next: (posts) => this.posts = posts, error: failed });
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

  createExpertiseField(): void {
    const form = this.fieldForm;
    if (!form.name.trim() || !form.description.trim()) { this.error = 'Add a field name and description.'; return; }
    this.savingContent = true; this.error = '';
    this.api.createExpertiseField(form.name, form.description, form.iconKey, form.displayOrder).subscribe({
      next: () => { this.fieldForm = { name: '', description: '', iconKey: 'STAR', displayOrder: 100 }; this.savingContent = false; this.loadDirectory(); },
      error: (error) => { this.error = error.error?.detail || 'Expertise field could not be added'; this.savingContent = false; }
    });
  }

  setExpertiseFieldActive(field: ExpertiseField, active: boolean): void {
    this.api.setExpertiseFieldActive(field.id, active).subscribe({
      next: (updated) => Object.assign(field, updated),
      error: (error) => this.error = error.error?.detail || 'Expertise field could not be updated'
    });
  }

  createAchiever(): void {
    const form = this.achieverForm;
    if (!form.expertiseFieldId || !form.fullName.trim() || !form.title.trim() || !form.achievement.trim() || !form.biography.trim()) {
      this.error = 'Complete category, name, title, achievement and profile summary.'; return;
    }
    this.savingContent = true; this.error = '';
    this.api.createAchiever({ ...form, fullName: form.fullName.trim(), title: form.title.trim(),
      achievement: form.achievement.trim(), biography: form.biography.trim(), imageUrl: form.imageUrl.trim(), profileUrl: form.profileUrl.trim() }).subscribe({
      next: () => { this.achieverForm = { expertiseFieldId: 0, fullName: '', title: '', achievement: '', biography: '', imageUrl: '', profileUrl: '', displayOrder: 100 }; this.savingContent = false; this.loadDirectory(); },
      error: (error) => { this.error = error.error?.detail || 'Achiever could not be added'; this.savingContent = false; }
    });
  }

  setAchieverActive(achiever: Achiever, active: boolean): void {
    this.api.setAchieverActive(achiever.id, active).subscribe({ next: (updated) => Object.assign(achiever, updated),
      error: (error) => this.error = error.error?.detail || 'Achiever status could not be updated' });
  }

  deleteAchiever(achiever: Achiever): void {
    this.api.deleteAchiever(achiever.id).subscribe({ next: () => this.achievers = this.achievers.filter((item) => item.id !== achiever.id),
      error: (error) => this.error = error.error?.detail || 'Achiever could not be removed' });
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
    if (this.i18n.language() === 'hi') {
      return `आपको एससी कम्युनिटी कनेक्ट से जुड़ने के लिए आमंत्रित किया गया है।\n\nपंजीकरण लिंक: ${this.registrationUrlFor(code)}\nआमंत्रण कोड: ${code}\nईमेल OTP: SC1E\nमोबाइल OTP: SC2M\n\nयह आमंत्रण कोड केवल एक बार उपयोग किया जा सकता है।`;
    }
    return `You're invited to join SC Community Connect.\n\nRegister here: ${this.registrationUrlFor(code)}\nInvite code: ${code}\nEmail OTP: SC1E\nMobile OTP: SC2M\n\nThis invite code can be used once.`;
  }

  private loadContent(): void {
    this.loadManagedContent();
    this.loadDirectory();
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

  private loadDirectory(): void {
    this.api.adminExpertiseFields().subscribe({ next: (fields) => { this.expertiseFields = fields;
      if (!this.achieverForm.expertiseFieldId) this.achieverForm.expertiseFieldId = fields.find((field) => field.active)?.id || 0; },
      error: (error) => this.error = error.error?.detail || 'Expertise fields could not be loaded' });
    this.api.adminAchievers().subscribe({ next: (achievers) => this.achievers = achievers,
      error: (error) => this.error = error.error?.detail || 'Achievers could not be loaded' });
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

  private apiError(error: any, fallback: string): string {
    if (error?.status === 0) return 'Network connection unavailable. Check your internet and try again.';
    return error?.error?.detail || error?.error?.message || fallback;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.meetingSocket.disconnect();
  }
}
