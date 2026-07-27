import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCheckCircle2,
  LucideEye,
  LucideEyeOff,
  LucideMail,
  LucideShieldCheck,
  LucideSmartphone
} from '@lucide/angular';
import { AuthService } from '../core/auth.service';
import { OtpChannel, OtpPurpose } from '../core/models';

type AuthMode = 'login' | 'register' | 'forgot';
type MessageTone = 'error' | 'success' | 'info';

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
    LucideCheckCircle2,
    LucideEye,
    LucideEyeOff,
    LucideMail,
    LucideShieldCheck,
    LucideSmartphone
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mode: AuthMode = 'login';
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

  constructor(private auth: AuthService, private router: Router) {}

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.loading = false;
    this.otpLoading = '';
    this.message = '';
    if (mode === 'forgot') {
      this.resetForgotFlow();
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
        this.loading = false;
      },
      error: (error) => {
        this.showError(error, 'Registration failed');
        this.loading = false;
      }
    });
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
