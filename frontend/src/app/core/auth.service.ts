import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  AuthResponse,
  InviteRequest,
  MessageResponse,
  OtpChannel,
  OtpPurpose,
  OtpRequestResponse,
  OtpVerifyResponse,
  ProfessionalGroup,
  UserResponse
} from './models';

const API = '/api';
export const SESSION_KEY = 'sc-connect-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSubject = new BehaviorSubject<AuthResponse | null>(this.restore());
  session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get session(): AuthResponse | null {
    return this.sessionSubject.value;
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  isAdmin(): boolean {
    return this.session?.role === 'ROLE_ADMIN';
  }

  register(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    inviteCode: string;
    idProofUrl: string;
    professionalGroup: ProfessionalGroup;
    helpFieldIds: number[];
    emailVerificationToken: string;
    phoneVerificationToken: string;
  }): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${API}/auth/register`, payload);
  }

  requestOtp(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string
  ): Observable<OtpRequestResponse> {
    return this.http.post<OtpRequestResponse>(`${API}/auth/otp/request`, {
      channel,
      purpose,
      destination
    });
  }

  verifyOtp(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string,
    code: string
  ): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(`${API}/auth/otp/verify`, {
      channel,
      purpose,
      destination,
      code
    });
  }

  resetPassword(resetToken: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API}/auth/password/reset`, {
      resetToken,
      newPassword
    });
  }

  requestInviteCode(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    emailVerificationToken: string;
    phoneVerificationToken: string;
  }): Observable<InviteRequest> {
    return this.http.post<InviteRequest>(`${API}/auth/invite-requests`, payload);
  }

  inviteRequestStatus(requestToken: string): Observable<InviteRequest> {
    return this.http.post<InviteRequest>(
      `${API}/auth/invite-requests/${encodeURIComponent(requestToken)}/status`,
      {}
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/login`, { email: email.trim().toLowerCase(), password }).pipe(
      tap((session) => {
        this.storage()?.setItem(SESSION_KEY, JSON.stringify(session));
        this.sessionSubject.next(session);
      })
    );
  }

  logout(): void {
    this.clearSession(false);
    this.router.navigateByUrl('/community');
  }

  syncHelpProfile(user: UserResponse): void {
    const session = this.session;
    if (!session) return;
    const updated: AuthResponse = { ...session, photoUrl: user.photoUrl, helpFieldIds: user.helpFieldIds,
      helpFieldNames: user.helpFieldNames, profileComplete: user.profileComplete, profileCompletion: user.profileCompletion };
    this.storage()?.setItem(SESSION_KEY, JSON.stringify(updated));
    this.sessionSubject.next(updated);
  }

  syncProfile(user: UserResponse, token?: string): void {
    const session = this.session;
    if (!session) return;
    const updated: AuthResponse = { ...session, token: token || session.token, fullName: user.fullName, email: user.email,
      photoUrl: user.photoUrl, helpFieldIds: user.helpFieldIds, helpFieldNames: user.helpFieldNames,
      profileComplete: user.profileComplete, profileCompletion: user.profileCompletion };
    this.storage()?.setItem(SESSION_KEY, JSON.stringify(updated));
    this.sessionSubject.next(updated);
  }

  clearSession(navigate = true): void {
    this.storage()?.removeItem(SESSION_KEY);
    this.sessionSubject.next(null);
    if (navigate && !this.router.url.startsWith('/login')) {
      this.router.navigateByUrl('/login');
    }
  }

  private restore(): AuthResponse | null {
    const storage = this.storage();
    if (!storage) return null;

    try {
      const value = storage.getItem(SESSION_KEY);
      if (!value) return null;

      const session = JSON.parse(value) as Partial<AuthResponse>;
      if (!this.isUsableSession(session)) {
        storage.removeItem(SESSION_KEY);
        return null;
      }
      return {
        ...session,
        helpFieldIds: Array.isArray(session.helpFieldIds) ? session.helpFieldIds : [],
        helpFieldNames: Array.isArray(session.helpFieldNames) ? session.helpFieldNames : [],
        profileComplete: session.role === 'ROLE_ADMIN' || session.profileComplete === true,
        profileCompletion: typeof session.profileCompletion === 'number' ? session.profileCompletion : session.profileComplete === true ? 100 : 0
      } as AuthResponse;
    } catch {
      storage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private isUsableSession(session: Partial<AuthResponse>): boolean {
    if (!session.token || !session.email || typeof session.userId !== 'number' || !session.role) return false;
    const parts = session.token.split('.');
    if (parts.length !== 3) return false;

    try {
      const payload = JSON.parse(this.decodeBase64Url(parts[1])) as { exp?: number };
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '='));
  }

  private storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
