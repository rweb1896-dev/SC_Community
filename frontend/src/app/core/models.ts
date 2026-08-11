export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';
export type UserStatus = 'PENDING' | 'VERIFIED' | 'BLOCKED';
export type PostStatus = 'ACTIVE' | 'CLOSED' | 'FLAGGED' | 'BLOCKED';
export type ProfessionalGroup = 'COMMUNITY' | 'DOCTOR' | 'ENGINEER' | 'EDUCATION' | 'SOCIAL_WORKER';
export type MeetingAudience = 'ALL' | 'DOCTORS' | 'ENGINEERS' | 'EDUCATION' | 'SOCIAL_WORKERS';
export type MeetingStatus = 'PENDING_APPROVAL' | 'LIVE' | 'REJECTED' | 'ENDED';
export type OtpChannel = 'EMAIL' | 'MOBILE';
export type OtpPurpose = 'SIGNUP_EMAIL' | 'SIGNUP_MOBILE' | 'PASSWORD_RESET';
export type EventStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
export type BroadcastMediaType = 'PODCAST' | 'VIDEO' | 'YOUTUBE';
export type BroadcastStatus = 'DRAFT' | 'LIVE' | 'PAUSED' | 'ENDED';
export type InviteRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ManagedContentType = 'LEADER' | 'BOOK';
export type ManagedContentStatus = 'ACTIVE' | 'BLOCKED' | 'REMOVED';

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  professionalGroup: ProfessionalGroup;
  helpFieldIds: number[];
  helpFieldNames: string[];
  profileComplete: boolean;
}

export interface OtpRequestResponse {
  message: string;
  expiresAt: string;
  developmentCode?: string;
}

export interface OtpVerifyResponse {
  verificationToken: string;
  expiresAt: string;
}

export interface MessageResponse {
  message: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  professionalGroup: ProfessionalGroup;
  helpFieldIds: number[];
  helpFieldNames: string[];
  profileComplete: boolean;
  idProofUrl?: string;
  inviteCodeUsed?: string;
  createdAt: string;
}

export interface ExpertiseField {
  id: number;
  name: string;
  description: string;
  iconKey: string;
  active: boolean;
  displayOrder: number;
}

export interface Achiever {
  id: number;
  expertiseFieldId: number;
  expertiseFieldName: string;
  fullName: string;
  title: string;
  achievement: string;
  biography: string;
  imageUrl?: string;
  profileUrl?: string;
  active: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface Category {
  id: number;
  key: string;
  name: string;
  description: string;
}

export interface Post {
  id: number;
  userId: number;
  authorName: string;
  verifiedAuthor: boolean;
  categoryId: number;
  categoryName: string;
  content: string;
  imageUrl?: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  supportCount: number;
  commentCount: number;
  supportedByCurrentUser: boolean;
}

export interface SupportResponse { postId: number; supportCount: number; supported: boolean; }
export interface ImageUploadResponse { imageUrl: string; contentType: string; sizeBytes: number; }
export interface FeedEvent { type: 'POST_CREATED' | 'POST_REMOVED' | 'COMMENT_CREATED' | 'SUPPORT_UPDATED'; postId: number; }

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  authorName: string;
  commentText: string;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  messageBody: string;
  read: boolean;
  timestamp: string;
}

export type HelpConversationStatus = 'ACTIVE' | 'ENDED_BY_USER' | 'ENDED_POST_CLOSED' | 'BLOCKED';
export type ReconnectRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
export type VolunteerRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export interface HelpConversation { id:number; postId:number; postTitle:string; postContent:string; categoryName:string; postStatus:PostStatus; otherUserId:number; otherUserName:string; status:HelpConversationStatus; sessionNumber:number; activatedAt:string; endedAt?:string; endedByUserId?:number; endedByName?:string; endReason?:string; lastMessageAt?:string; reconnectAllowed:boolean; pendingReconnectRequestId?:number; reconnectRequestedByMe:boolean; }
export interface HelpMessage { id:number; conversationId:number; senderId:number; senderName:string; messageBody:string; read:boolean; timestamp:string; }
export interface ReconnectRequest { id:number; conversationId:number; requestedByUserId:number; requestedByName:string; requestedToUserId:number; postTitle:string; status:ReconnectRequestStatus; createdAt:string; respondedAt?:string; }
export interface VolunteerRequest { id:number; postId:number; postTitle:string; volunteerUserId:number; volunteerName:string; requestedToUserId:number; status:VolunteerRequestStatus; conversationId?:number; createdAt:string; respondedAt?:string; }
export interface MyHelpPost { id:number; title:string; content:string; categoryId:number; categoryName:string; status:PostStatus; createdAt:string; closedAt?:string; helperCount:number; activeConversationCount:number; pendingVolunteerCount:number; audienceExpanded:boolean; canRequestAll:boolean; }
export interface HelpNotification { id:number; type:string; title:string; body:string; postId?:number; conversationId?:number; read:boolean; createdAt:string; }

export interface Dashboard {
  totalUsers: number;
  pendingUsers: number;
  verifiedUsers: number;
  blockedUsers: number;
  activePosts: number;
}

export interface InviteCode {
  id: number;
  code: string;
  used: boolean;
  createdAt: string;
}

export interface InviteRequest {
  id: number;
  requestToken: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: InviteRequestStatus;
  inviteCode?: string;
  requestedAt: string;
  approvedAt?: string;
}

export interface MemberInviteRequest {
  id: number;
  requesterName: string;
  requesterEmail: string;
  recipientEmail: string;
  recipientMobile: string;
  status: InviteRequestStatus;
  inviteCode?: string;
  rejectionReason?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface ManagedContent {
  recordId: number;
  type: ManagedContentType;
  key: string;
  status: ManagedContentStatus;
  title: string;
  byline: string;
  summary: string;
  category: string;
  source: string;
  url: string;
  imageUrl: string;
  details: string;
  updatedAt: string;
}

export type ManagedContentInput = Omit<ManagedContent, 'recordId' | 'status' | 'updatedAt'>;

export interface Meeting {
  id: number;
  title: string;
  agenda?: string;
  audience: MeetingAudience;
  status: MeetingStatus;
  hostId: number;
  hostName: string;
  approvedByName?: string;
  rejectionReason?: string;
  requestedAt: string;
  approvedAt?: string;
  startedAt?: string;
  endedAt?: string;
  participantCount: number;
  canJoin: boolean;
  canManage: boolean;
}

export interface MeetingSignal {
  meetingId: number;
  type: 'JOIN' | 'OFFER' | 'ANSWER' | 'ICE' | 'LEAVE' | 'END';
  senderUserId: number;
  senderName: string;
  targetUserId?: number;
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export interface CommunityEvent {
  id: number;
  title: string;
  summary: string;
  venue: string;
  eventAt: string;
  registrationUrl?: string;
  status: EventStatus;
  createdAt: string;
}

export interface Broadcast {
  id: number;
  title: string;
  description: string;
  hostName: string;
  mediaType: BroadcastMediaType;
  mediaUrl: string;
  status: BroadcastStatus;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: number;
  eventId?: number;
  eventTitle?: string;
  title: string;
  caption?: string;
  imageUrl: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}
