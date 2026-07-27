import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  AuthResponse,
  MessageResponse,
  OtpChannel,
  OtpPurpose,
  OtpRequestResponse,
  OtpVerifyResponse,
  ProfessionalGroup,
  UserResponse
} from './models';

const API = '/api';
const SESSION_KEY = 'sc-connect-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSubject = new BehaviorSubject<AuthResponse | null>(this.restore());
  session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get session(): AuthResponse | null {
    return this.sessionSubject.value;
  }

  register(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    inviteCode: string;
    idProofUrl: string;
    professionalGroup: ProfessionalGroup;
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

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/login`, { email, password }).pipe(
      tap((session) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.sessionSubject.next(session);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.sessionSubject.next(null);
    this.router.navigateByUrl('/login');
  }

  private restore(): AuthResponse | null {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AuthResponse : null;
  }
}
