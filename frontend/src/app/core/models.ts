export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';
export type UserStatus = 'PENDING' | 'VERIFIED' | 'BLOCKED';
export type PostStatus = 'ACTIVE' | 'FLAGGED' | 'BLOCKED';
export type ProfessionalGroup = 'COMMUNITY' | 'DOCTOR' | 'ENGINEER' | 'EDUCATION' | 'SOCIAL_WORKER';
export type MeetingAudience = 'ALL' | 'DOCTORS' | 'ENGINEERS' | 'EDUCATION' | 'SOCIAL_WORKERS';
export type MeetingStatus = 'PENDING_APPROVAL' | 'LIVE' | 'REJECTED' | 'ENDED';

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  professionalGroup: ProfessionalGroup;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  professionalGroup: ProfessionalGroup;
  idProofUrl?: string;
  inviteCodeUsed?: string;
  createdAt: string;
}

export interface Category {
  id: number;
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
}

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
