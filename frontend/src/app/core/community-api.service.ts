import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Broadcast, BroadcastMediaType, BroadcastStatus, Category, Comment, CommunityEvent, Dashboard, EventStatus, GalleryImage, InviteCode, InviteRequest, Meeting, MeetingAudience, Message, Post, ProfessionalGroup, UserResponse, UserStatus } from './models';

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

  comments(postId: number) {
    return this.http.get<Comment[]>(`${API}/posts/${postId}/comments`);
  }

  addComment(postId: number, commentText: string) {
    return this.http.post<Comment>(`${API}/posts/${postId}/comments`, { commentText });
  }

  conversation(userId: number) {
    return this.http.get<Message[]>(`${API}/messages/conversation/${userId}`);
  }

  sendMessage(receiverId: number, messageBody: string) {
    return this.http.post<Message>(`${API}/messages`, { receiverId, messageBody });
  }

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
}
