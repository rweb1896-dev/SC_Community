import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBookOpen,
  LucideBuilding2,
  LucideCheckCircle2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideEye,
  LucideEyeOff,
  LucideExternalLink,
  LucideFileText,
  LucideInfo,
  LucideMail,
  LucideMegaphone,
  LucideShieldCheck,
  LucideSmartphone,
  LucideUsersRound,
  LucideX
} from '@lucide/angular';
import { AuthService } from '../core/auth.service';
import { GalleryImage, OtpChannel, OtpPurpose } from '../core/models';
import { CommunityApiService } from '../core/community-api.service';
import { COMMUNITY_LEADERS } from '../core/community-leaders';
import {
  COMMUNITY_BOOKS,
  type CommunityBook,
  COMMUNITY_NOTICES,
  COMMUNITY_ORGANISATIONS,
  PAID_COMMUNITY_BOOKS,
  SOCIAL_WORKERS
} from '../core/community-resources';

type AuthMode = 'login' | 'register' | 'forgot';
type MessageTone = 'error' | 'success' | 'info';
type ResourceView = 'about' | 'leaders' | 'books' | 'network' | 'notices';

interface VerificationState {
  requested: boolean;
  verified: boolean;
  code: string;
  token: string;
  destination: string;
  developmentCode: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowLeft,
    LucideBookOpen,
    LucideBuilding2,
    LucideCheckCircle2,
    LucideChevronLeft,
    LucideChevronRight,
    LucideEye,
    LucideEyeOff,
    LucideExternalLink,
    LucideFileText,
    LucideInfo,
    LucideMail,
    LucideMegaphone,
    LucideShieldCheck,
    LucideSmartphone,
    LucideUsersRound,
    LucideX
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  mode: AuthMode = 'login';
  registerStep: 1 | 2 | 3 = 1;
  activeLeaderIndex = 0;
  activeGalleryIndex = 0;
  galleryImages: GalleryImage[] = [];
  readonly leaders = COMMUNITY_LEADERS;
  readonly books = COMMUNITY_BOOKS;
  readonly paidBooks = PAID_COMMUNITY_BOOKS;
  readonly socialWorkers = SOCIAL_WORKERS;
  readonly organisations = COMMUNITY_ORGANISATIONS;
  readonly notices = COMMUNITY_NOTICES;
  resourceView: ResourceView = 'leaders';
  resourceSheetOpen = false;
  loading = false;
  otpLoading = '';
  message = '';
  messageTone: MessageTone = 'info';
  showLoginPassword = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;
  showResetPassword = false;
  showResetConfirmPassword = false;
  loginForm = { email: '', password: '' };
  registerForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
    idProofUrl: '',
    professionalGroup: 'COMMUNITY' as const,
    emailVerificationToken: '',
    phoneVerificationToken: ''
  };
  emailVerification = this.newVerificationState();
  phoneVerification = this.newVerificationState();
  forgotStep: 1 | 2 | 3 = 1;
  forgotForm = {
    channel: 'EMAIL' as OtpChannel,
    destination: '',
    code: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
    developmentCode: ''
  };
  private leaderTimer?: ReturnType<typeof setInterval>;
  private galleryTimer?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService, private router: Router, private api: CommunityApiService, private route: ActivatedRoute) {}

  get activeLeader() {
    return this.leaders[this.activeLeaderIndex];
  }

  get activeGallery(): GalleryImage | undefined {
    return this.galleryImages[this.activeGalleryIndex];
  }

  pdfHref(book: CommunityBook): string {
    return `/api/public/books/${encodeURIComponent(book.id)}/pdf`;
  }

  ngOnInit(): void {
    document.body.classList.add('auth-lock');
    const invitedCode = this.route.snapshot.queryParamMap.get('invite')?.trim();
    if (this.route.snapshot.queryParamMap.get('mode') === 'register' || invitedCode) {
      this.mode = 'register';
      this.registerStep = 1;
      this.registerForm.inviteCode = invitedCode || '';
    }
    this.resumeLeaderRotation();
    this.api.publicGallery().subscribe({
      next: (images) => {
        this.galleryImages = images;
        this.activeGalleryIndex = 0;
        this.startGalleryRotation();
      }
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-lock');
    this.pauseLeaderRotation();
    this.pauseGalleryRotation();
  }

  showGalleryImage(index: number): void {
    this.activeGalleryIndex = index;
    this.startGalleryRotation();
  }

  private startGalleryRotation(): void {
    this.pauseGalleryRotation();
    if (this.galleryImages.length < 2) return;
    this.galleryTimer = setInterval(() => {
      this.activeGalleryIndex = (this.activeGalleryIndex + 1) % this.galleryImages.length;
    }, 5500);
  }

  private pauseGalleryRotation(): void {
    if (this.galleryTimer) clearInterval(this.galleryTimer);
    this.galleryTimer = undefined;
  }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.loading = false;
    this.otpLoading = '';
    this.message = '';
    if (mode === 'register') {
      this.registerStep = 1;
    }
    if (mode === 'forgot') {
      this.resetForgotFlow();
    }
  }

  setResourceView(view: ResourceView): void {
    this.resourceView = view;
    if (view === 'leaders') {
      this.resumeLeaderRotation();
    } else {
      this.pauseLeaderRotation();
    }
  }

  openResourceSheet(view: ResourceView = 'books'): void {
    this.resourceSheetOpen = true;
    this.setResourceView(view);
  }

  closeResourceSheet(): void {
    this.resourceSheetOpen = false;
    this.resumeLeaderRotation();
  }

  @HostListener('document:keydown', ['$event'])
  closeResourcesOnEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.resourceSheetOpen) {
      this.closeResourceSheet();
    }
  }

  login(): void {
    this.loading = true;
    this.clearMessage();
    this.auth.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: () => this.router.navigateByUrl('/feed'),
      error: (error) => {
        this.showError(error, 'Login failed');
        this.loading = false;
      }
    });
  }

  register(): void {
    if (!this.canSubmitRegistration()) {
      this.setMessage('Complete all registration steps before submitting your account.', 'error');
      return;
    }
    if (!this.emailVerification.verified || !this.phoneVerification.verified) {
      this.setMessage('Verify both email and mobile number before creating your account.', 'error');
      return;
    }
    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      this.setMessage('Passwords do not match.', 'error');
      return;
    }
    this.loading = true;
    this.clearMessage();
    this.registerForm.emailVerificationToken = this.emailVerification.token;
    this.registerForm.phoneVerificationToken = this.phoneVerification.token;
    this.auth.register(this.registerForm).subscribe({
      next: () => {
        this.setMessage(
          'Registration submitted. An admin will review your ID proof before login.',
          'success'
        );
        this.mode = 'login';
        this.registerStep = 1;
        this.loading = false;
      },
      error: (error) => {
        this.showError(error, 'Registration failed');
        this.loading = false;
      }
    });
  }

  continueRegistration(): void {
    this.clearMessage();
    if (this.registerStep === 1 && this.canContinueProfile()) {
      this.registerStep = 2;
      return;
    }
    if (this.registerStep === 2 && this.emailVerification.verified && this.phoneVerification.verified) {
      this.registerStep = 3;
    }
  }

  backRegistration(): void {
    this.clearMessage();
    if (this.registerStep > 1) {
      this.registerStep = (this.registerStep - 1) as 1 | 2 | 3;
    }
  }

  canContinueProfile(): boolean {
    return this.registerForm.fullName.trim().length >= 2;
  }

  canSubmitRegistration(): boolean {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/.test(
      this.registerForm.password
    );
    return (
      this.canContinueProfile() &&
      this.registerForm.inviteCode.trim().length > 0 &&
      this.emailVerification.verified &&
      this.phoneVerification.verified &&
      strongPassword &&
      this.registerForm.password === this.registerForm.confirmPassword
    );
  }

  showLeader(index: number): void {
    this.activeLeaderIndex = (index + this.leaders.length) % this.leaders.length;
    this.restartLeaderRotation();
  }

  previousLeader(): void {
    this.showLeader(this.activeLeaderIndex - 1);
  }

  nextLeader(): void {
    this.showLeader(this.activeLeaderIndex + 1);
  }

  pauseLeaderRotation(): void {
    if (this.leaderTimer) {
      clearInterval(this.leaderTimer);
      this.leaderTimer = undefined;
    }
  }

  resumeLeaderRotation(): void {
    if (!this.leaderTimer) {
      this.leaderTimer = setInterval(() => {
        this.activeLeaderIndex = (this.activeLeaderIndex + 1) % this.leaders.length;
      }, 6500);
    }
  }

  private restartLeaderRotation(): void {
    this.pauseLeaderRotation();
    this.resumeLeaderRotation();
  }

  requestSignupOtp(channel: OtpChannel): void {
    const isEmail = channel === 'EMAIL';
    const destination = isEmail ? this.registerForm.email : this.registerForm.phoneNumber;
    const purpose: OtpPurpose = isEmail ? 'SIGNUP_EMAIL' : 'SIGNUP_MOBILE';
    const state = isEmail ? this.emailVerification : this.phoneVerification;
    this.otpLoading = isEmail ? 'email-request' : 'phone-request';
    this.clearMessage();
    this.auth.requestOtp(channel, purpose, destination).subscribe({
      next: (response) => {
        state.requested = true;
        state.verified = false;
        state.code = '';
        state.token = '';
        state.destination = this.normalizeDestination(channel, destination);
        state.developmentCode = response.developmentCode || '';
        this.otpLoading = '';
        this.setMessage(
          response.developmentCode
            ? `${isEmail ? 'Email' : 'Mobile'} testing OTP: ${response.developmentCode}`
            : response.message,
          'info'
        );
      },
      error: (error) => {
        this.otpLoading = '';
        this.showError(error, 'Could not generate OTP');
      }
    });
  }

  verifySignupOtp(channel: OtpChannel): void {
    const isEmail = channel === 'EMAIL';
    const destination = isEmail ? this.registerForm.email : this.registerForm.phoneNumber;
    const purpose: OtpPurpose = isEmail ? 'SIGNUP_EMAIL' : 'SIGNUP_MOBILE';
    const state = isEmail ? this.emailVerification : this.phoneVerification;
    this.otpLoading = isEmail ? 'email-verify' : 'phone-verify';
    this.clearMessage();
    this.auth.verifyOtp(channel, purpose, destination, state.code).subscribe({
      next: (response) => {
        state.verified = true;
        state.token = response.verificationToken;
        state.destination = this.normalizeDestination(channel, destination);
        this.otpLoading = '';
        this.setMessage(`${isEmail ? 'Email' : 'Mobile number'} verified successfully.`, 'success');
      },
      error: (error) => {
        state.verified = false;
        state.token = '';
        this.otpLoading = '';
        this.showError(error, 'OTP verification failed');
      }
    });
  }

  onIdentityChanged(channel: OtpChannel, value: string): void {
    const state = channel === 'EMAIL' ? this.emailVerification : this.phoneVerification;
    if (state.destination && state.destination !== this.normalizeDestination(channel, value)) {
      this.resetVerificationState(state);
    }
  }

  setForgotChannel(channel: OtpChannel): void {
    if (this.forgotForm.channel === channel) {
      return;
    }
    this.forgotForm.channel = channel;
    this.forgotForm.destination = '';
    this.forgotStep = 1;
    this.forgotForm.code = '';
    this.forgotForm.resetToken = '';
    this.forgotForm.developmentCode = '';
    this.clearMessage();
  }

  requestPasswordOtp(): void {
    this.otpLoading = 'forgot-request';
    this.clearMessage();
    this.auth
      .requestOtp(this.forgotForm.channel, 'PASSWORD_RESET', this.forgotForm.destination)
      .subscribe({
        next: (response) => {
          this.forgotForm.developmentCode = response.developmentCode || '';
          this.forgotStep = 2;
          this.otpLoading = '';
          this.setMessage(
            response.developmentCode
              ? `Testing OTP: ${response.developmentCode}`
              : response.message,
            'info'
          );
        },
        error: (error) => {
          this.otpLoading = '';
          this.showError(error, 'Could not generate reset OTP');
        }
      });
  }

  verifyPasswordOtp(): void {
    this.otpLoading = 'forgot-verify';
    this.clearMessage();
    this.auth
      .verifyOtp(
        this.forgotForm.channel,
        'PASSWORD_RESET',
        this.forgotForm.destination,
        this.forgotForm.code
      )
      .subscribe({
        next: (response) => {
          this.forgotForm.resetToken = response.verificationToken;
          this.forgotStep = 3;
          this.otpLoading = '';
          this.setMessage('Identity verified. Create your new password.', 'success');
        },
        error: (error) => {
          this.otpLoading = '';
          this.showError(error, 'OTP verification failed');
        }
      });
  }

  resetPassword(): void {
    if (this.forgotForm.newPassword !== this.forgotForm.confirmPassword) {
      this.setMessage('Passwords do not match.', 'error');
      return;
    }
    this.loading = true;
    this.clearMessage();
    this.auth
      .resetPassword(this.forgotForm.resetToken, this.forgotForm.newPassword)
      .subscribe({
        next: (response) => {
          this.setMessage(`${response.message}. Sign in with your new password.`, 'success');
          this.mode = 'login';
          this.loading = false;
          this.resetForgotFlow();
        },
        error: (error) => {
          this.loading = false;
          this.showError(error, 'Password reset failed');
        }
      });
  }

  private newVerificationState(): VerificationState {
    return {
      requested: false,
      verified: false,
      code: '',
      token: '',
      destination: '',
      developmentCode: ''
    };
  }

  private resetVerificationState(state: VerificationState): void {
    Object.assign(state, this.newVerificationState());
  }

  private resetForgotFlow(): void {
    const channel = this.forgotForm.channel;
    this.forgotStep = 1;
    this.forgotForm = {
      channel,
      destination: '',
      code: '',
      resetToken: '',
      newPassword: '',
      confirmPassword: '',
      developmentCode: ''
    };
  }

  private normalizeDestination(channel: OtpChannel, value: string): string {
    return channel === 'EMAIL'
      ? value.trim().toLowerCase()
      : value.replace(/[\s()-]/g, '');
  }

  private clearMessage(): void {
    this.message = '';
  }

  private setMessage(message: string, tone: MessageTone): void {
    this.message = message;
    this.messageTone = tone;
  }

  private showError(error: any, fallback: string): void {
    this.setMessage(error.error?.message || error.error?.detail || fallback, 'error');
  }
}
