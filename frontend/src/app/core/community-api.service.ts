import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Achiever, Broadcast, BroadcastMediaType, BroadcastStatus, Category, Comment, CommunityEvent, Dashboard, EventStatus, ExpertiseField, GalleryImage, HelpConversation, HelpMessage, HelpNotification, ImageUploadResponse, InviteCode, InviteRequest, ManagedContent, ManagedContentInput, ManagedContentStatus, Meeting, MeetingAudience, MemberInviteRequest, Message, MyHelpPost, Post, ProfessionalGroup, ProfileUpdateResponse, ReconnectRequest, SupportResponse, UserResponse, UserStatus, VolunteerRequest } from './models';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class CommunityApiService {
  constructor(private http: HttpClient) {}

  categories() {
    return this.http.get<Category[]>(`${API}/categories`);
  }

  posts(categoryId?: number) {
    const url = categoryId ? `${API}/posts?categoryId=${categoryId}` : `${API}/posts`;
    return this.http.get<Post[]>(url);
  }

  createPost(categoryId: number, content: string, imageUrl: string) {
    return this.http.post<Post>(`${API}/posts`, { categoryId, content, imageUrl });
  }
  updatePost(postId: number, categoryId: number, content: string, imageUrl: string) { return this.http.patch<Post>(`${API}/posts/${postId}`, { categoryId, content, imageUrl }); }
  deletePost(postId: number) { return this.http.delete<void>(`${API}/posts/${postId}`); }

  comments(postId: number) {
    return this.http.get<Comment[]>(`${API}/posts/${postId}/comments`);
  }

  addComment(postId: number, commentText: string) {
    return this.http.post<Comment>(`${API}/posts/${postId}/comments`, { commentText });
  }

  toggleSupport(postId: number) {
    return this.http.post<SupportResponse>(`${API}/posts/${postId}/support`, {});
  }

  uploadPostImage(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ImageUploadResponse>(`${API}/uploads/image`, body, {
      observe: 'events', reportProgress: true
    });
  }

  conversation(userId: number) {
    return this.http.get<Message[]>(`${API}/messages/conversation/${userId}`);
  }

  sendMessage(receiverId: number, messageBody: string) {
    return this.http.post<Message>(`${API}/messages`, { receiverId, messageBody });
  }

  helpConversations(view: 'ACTIVE' | 'HISTORY') { return this.http.get<HelpConversation[]>(`${API}/help/conversations?view=${view}`); }
  helpMessages(conversationId: number) { return this.http.get<HelpMessage[]>(`${API}/help/conversations/${conversationId}/messages`); }
  sendHelpMessage(conversationId: number, messageBody: string) { return this.http.post<HelpMessage>(`${API}/help/conversations/${conversationId}/messages`, { messageBody }); }
  offerHelp(postId: number) { return this.http.post<HelpConversation>(`${API}/help/posts/${postId}/offer`, {}); }
  volunteerForPost(postId: number) { return this.http.post<VolunteerRequest>(`${API}/help/posts/${postId}/volunteer`, {}); }
  requestHelpFromAll(postId: number) { return this.http.post<MyHelpPost>(`${API}/help/posts/${postId}/request-all`, {}); }
  endHelpConversation(id: number, reason = '') { return this.http.post<HelpConversation>(`${API}/help/conversations/${id}/end`, { reason }); }
  requestReconnect(id: number) { return this.http.post<ReconnectRequest>(`${API}/help/conversations/${id}/reconnect`, {}); }
  incomingReconnects() { return this.http.get<ReconnectRequest[]>(`${API}/help/reconnect-requests/incoming`); }
  decideReconnect(id: number, accept: boolean) { return this.http.post<ReconnectRequest>(`${API}/help/reconnect-requests/${id}/${accept ? 'accept' : 'decline'}`, {}); }
  incomingVolunteerRequests() { return this.http.get<VolunteerRequest[]>(`${API}/help/volunteer-requests/incoming`); }
  decideVolunteerRequest(id: number, accept: boolean) { return this.http.post<VolunteerRequest>(`${API}/help/volunteer-requests/${id}/${accept ? 'open-chat' : 'decline'}`, {}); }
  blockHelpUser(id: number) { return this.http.post<void>(`${API}/help/conversations/${id}/block`, {}); }
  reportHelpConversation(id: number, reason: string) { return this.http.post<void>(`${API}/help/conversations/${id}/report`, { reason }); }
  myHelpPosts(status: 'ACTIVE' | 'CLOSED') { return this.http.get<MyHelpPost[]>(`${API}/help/posts/mine?status=${status}`); }
  closeHelpPost(id: number) { return this.http.post<MyHelpPost>(`${API}/help/posts/${id}/close`, {}); }
  helpNotifications() { return this.http.get<HelpNotification[]>(`${API}/help/notifications`); }
  readHelpNotification(id: number) { return this.http.patch<HelpNotification>(`${API}/help/notifications/${id}/read`, {}); }

  dashboard() {
    return this.http.get<Dashboard>(`${API}/admin/dashboard`);
  }

  users() {
    return this.http.get<UserResponse[]>(`${API}/admin/users`);
  }

  verifiedUsers() {
    return this.http.get<UserResponse[]>(`${API}/users/verified`);
  }

  onlineUserIds() {
    return this.http.get<number[]>(`${API}/users/online`);
  }

  expertiseFields() { return this.http.get<ExpertiseField[]>(`${API}/public/expertise-fields`); }
  publicAchievers() { return this.http.get<Achiever[]>(`${API}/public/achievers`); }
  updateMyHelpFields(fieldIds: number[]) { return this.http.patch<UserResponse>(`${API}/users/me/help-fields`, { fieldIds }); }
  myProfile() { return this.http.get<UserResponse>(`${API}/users/me`); }
  updateMyProfile(payload: {
    fullName:string; email:string; phoneNumber:string; address:string; photoUrl:string;
    currentPost:string; position:string; school:string; college:string; bestAchievement:string;
    profileCategory:string; workStatus:string; employmentType:string;
    emailVerificationToken?:string; phoneVerificationToken?:string
  }) { return this.http.patch<ProfileUpdateResponse>(`${API}/users/me/profile`, payload); }

  adminExpertiseFields() { return this.http.get<ExpertiseField[]>(`${API}/admin/directory/expertise-fields`); }
  createExpertiseField(name: string, description: string, iconKey: string, displayOrder: number) {
    return this.http.post<ExpertiseField>(`${API}/admin/directory/expertise-fields`, { name, description, iconKey, displayOrder });
  }
  setExpertiseFieldActive(fieldId: number, active: boolean) {
    return this.http.patch<ExpertiseField>(`${API}/admin/directory/expertise-fields/${fieldId}/active`, { active });
  }
  adminAchievers() { return this.http.get<Achiever[]>(`${API}/admin/directory/achievers`); }
  createAchiever(payload: Omit<Achiever, 'id' | 'expertiseFieldName' | 'active' | 'updatedAt'>) {
    return this.http.post<Achiever>(`${API}/admin/directory/achievers`, payload);
  }
  setAchieverActive(achieverId: number, active: boolean) {
    return this.http.patch<Achiever>(`${API}/admin/directory/achievers/${achieverId}/active`, { active });
  }
  deleteAchiever(achieverId: number) { return this.http.delete<void>(`${API}/admin/directory/achievers/${achieverId}`); }

  setUserStatus(userId: number, status: Extract<UserStatus, 'VERIFIED' | 'BLOCKED'>) {
    const action = status === 'BLOCKED' ? 'block' : 'approve';
    return this.http.patch<UserResponse>(`${API}/admin/users/${userId}/${action}`, {});
  }

  unblock(userId: number) {
    return this.http.patch<UserResponse>(`${API}/admin/users/${userId}/unblock`, {});
  }

  hidePost(postId: number) {
    return this.http.delete<void>(`${API}/admin/posts/${postId}`);
  }

  inviteCodes() {
    return this.http.get<InviteCode[]>(`${API}/admin/invite-codes`);
  }

  generateInviteCode() {
    return this.http.post<InviteCode>(`${API}/admin/invite-codes`, {});
  }

  inviteRequests() {
    return this.http.get<InviteRequest[]>(`${API}/admin/invite-requests`);
  }

  approveInviteRequest(requestId: number) {
    return this.http.patch<InviteRequest>(`${API}/admin/invite-requests/${requestId}/approve`, {});
  }

  memberInviteRequests() {
    return this.http.get<MemberInviteRequest[]>(`${API}/admin/member-invite-requests`);
  }

  approveMemberInviteRequest(requestId: number) {
    return this.http.patch<MemberInviteRequest>(`${API}/admin/member-invite-requests/${requestId}/approve`, {});
  }

  rejectMemberInviteRequest(requestId: number, reason = '') {
    return this.http.patch<MemberInviteRequest>(`${API}/admin/member-invite-requests/${requestId}/reject`, { reason });
  }

  myInviteRequests() {
    return this.http.get<MemberInviteRequest[]>(`${API}/invite-requests/mine`);
  }

  requestMemberInvite(recipientEmail: string, recipientMobile: string) {
    return this.http.post<MemberInviteRequest>(`${API}/invite-requests`, { recipientEmail, recipientMobile });
  }

  meetings() {
    return this.http.get<Meeting[]>(`${API}/meetings`);
  }

  meeting(meetingId: number) {
    return this.http.get<Meeting>(`${API}/meetings/${meetingId}`);
  }

  requestMeeting(title: string, agenda: string, audience: MeetingAudience) {
    return this.http.post<Meeting>(`${API}/meetings`, { title, agenda, audience });
  }

  joinMeeting(meetingId: number) {
    return this.http.post<Meeting>(`${API}/meetings/${meetingId}/join`, {});
  }

  leaveMeeting(meetingId: number) {
    return this.http.post<void>(`${API}/meetings/${meetingId}/leave`, {});
  }

  endMeeting(meetingId: number) {
    return this.http.post<Meeting>(`${API}/meetings/${meetingId}/end`, {});
  }

  pendingMeetings() {
    return this.http.get<Meeting[]>(`${API}/admin/meetings/pending`);
  }

  approveMeeting(meetingId: number) {
    return this.http.patch<Meeting>(`${API}/admin/meetings/${meetingId}/approve`, {});
  }

  rejectMeeting(meetingId: number, reason = '') {
    return this.http.patch<Meeting>(`${API}/admin/meetings/${meetingId}/reject`, { reason });
  }

  setProfessionalGroup(userId: number, professionalGroup: ProfessionalGroup) {
    return this.http.patch<UserResponse>(`${API}/admin/users/${userId}/professional-group`, { professionalGroup });
  }

  publicEvents() {
    return this.http.get<CommunityEvent[]>(`${API}/public/events`);
  }

  publicBroadcasts() {
    return this.http.get<Broadcast[]>(`${API}/public/broadcasts`);
  }

  publicGallery() {
    return this.http.get<GalleryImage[]>(`${API}/public/gallery`);
  }

  adminEvents() {
    return this.http.get<CommunityEvent[]>(`${API}/admin/content/events`);
  }

  createEvent(title: string, summary: string, venue: string, eventAt: string, registrationUrl: string) {
    return this.http.post<CommunityEvent>(`${API}/admin/content/events`, {
      title,
      summary,
      venue,
      eventAt,
      registrationUrl
    });
  }

  updateEventStatus(eventId: number, status: EventStatus) {
    return this.http.patch<CommunityEvent>(`${API}/admin/content/events/${eventId}/status`, { status });
  }

  deleteEvent(eventId: number) {
    return this.http.delete<void>(`${API}/admin/content/events/${eventId}`);
  }

  adminBroadcasts() {
    return this.http.get<Broadcast[]>(`${API}/admin/content/broadcasts`);
  }

  createBroadcast(
    title: string,
    description: string,
    hostName: string,
    mediaType: BroadcastMediaType,
    mediaUrl: string,
    scheduledAt?: string
  ) {
    return this.http.post<Broadcast>(`${API}/admin/content/broadcasts`, {
      title,
      description,
      hostName,
      mediaType,
      mediaUrl,
      scheduledAt: scheduledAt || null
    });
  }

  updateBroadcastStatus(broadcastId: number, status: BroadcastStatus) {
    return this.http.patch<Broadcast>(`${API}/admin/content/broadcasts/${broadcastId}/status`, { status });
  }

  deleteBroadcast(broadcastId: number) {
    return this.http.delete<void>(`${API}/admin/content/broadcasts/${broadcastId}`);
  }

  adminGallery() {
    return this.http.get<GalleryImage[]>(`${API}/admin/content/gallery`);
  }

  uploadGalleryImage(file: File, title: string, caption: string, eventId?: number) {
    const body = new FormData();
    body.append('file', file);
    body.append('title', title);
    if (caption.trim()) body.append('caption', caption.trim());
    if (eventId) body.append('eventId', String(eventId));
    return this.http.post<GalleryImage>(`${API}/admin/content/gallery`, body);
  }

  deleteGalleryImage(imageId: number) {
    return this.http.delete<void>(`${API}/admin/content/gallery/${imageId}`);
  }

  publicManagedContent() {
    return this.http.get<ManagedContent[]>(`${API}/public/managed-content`);
  }

  adminManagedContent() {
    return this.http.get<ManagedContent[]>(`${API}/admin/content/managed`);
  }

  saveManagedContent(content: ManagedContentInput) {
    return this.http.post<ManagedContent>(`${API}/admin/content/managed`, content);
  }

  setManagedContentStatus(recordId: number, status: ManagedContentStatus) {
    return this.http.patch<ManagedContent>(`${API}/admin/content/managed/${recordId}/status`, { status });
  }
}
