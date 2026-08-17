import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideCamera, LucideLockKeyhole, LucideShieldCheck } from '@lucide/angular';
import { AuthService } from '../core/auth.service';
import { CommunityApiService } from '../core/community-api.service';
import { ImageUploadResponse, OtpChannel, OtpPurpose } from '../core/models';

type ProfileForm = {
  fullName: string; email: string; phoneNumber: string; address: string; photoUrl: string;
  currentPost: string; position: string; school: string; college: string; bestAchievement: string;
  profileCategory: string; workStatus: string; employmentType: string; dateOfBirth: string;
  lookingForJob: boolean; profilePublic: boolean;
};

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideCamera, LucideLockKeyhole, LucideShieldCheck],
  templateUrl: './member-profile.component.html',
  styleUrl: './member-profile.component.css'
})
export class MemberProfileComponent implements OnInit {
  loading = true;
  saving = false;
  uploading = false;
  uploadProgress = 0;
  error = '';
  success = '';
  emailCode = '';
  mobileCode = '';
  emailToken = '';
  mobileToken = '';
  emailFeedback = '';
  mobileFeedback = '';
  private original = { email: '', phoneNumber: '' };
  form: ProfileForm = this.blankForm();

  readonly profileCategories = ['DOCTOR', 'ENGINEER', 'STUDENT', 'TEACHER', 'LAWYER', 'BUSINESS', 'GOVERNMENT', 'COMMUNITY', 'OTHER'];
  readonly workStatuses = ['WORKING', 'STUDENT', 'RETIRED', 'LOOKING', 'SELF_EMPLOYED', 'UNEMPLOYED'];
  readonly employmentTypes = ['GOVT_JOB', 'PRIVATE_JOB', 'BUSINESS', 'FREELANCE', 'NOT_APPLICABLE'];

  constructor(private api: CommunityApiService, public auth: AuthService) { }

  ngOnInit(): void { this.load(); }

  get completion(): number {
    const values = [this.form.fullName, this.form.email, this.form.phoneNumber, this.form.address, this.form.photoUrl,
      this.form.currentPost || this.form.position, this.form.school, this.form.college, this.form.bestAchievement,
      this.form.profileCategory, this.form.workStatus || this.form.employmentType, this.form.dateOfBirth];
    const help = this.auth.session?.helpFieldIds?.length ? 1 : 0;
    return Math.round(((values.filter(Boolean).length + help) / 13) * 100);
  }

  emailChanged(): boolean { return this.form.email.trim().toLowerCase() !== this.original.email.toLowerCase(); }
  mobileChanged(): boolean { return this.normalizedPhone(this.form.phoneNumber) !== this.original.phoneNumber; }

  load(): void {
    this.loading = true; this.error = '';
    this.api.myProfile().subscribe({
      next: profile => {
        const user = profile.user;
        this.form = {
          fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber || '', address: user.address || '',
          photoUrl: user.photoUrl || '', currentPost: user.currentPost || '', position: user.position || '',
          school: user.school || '', college: user.college || '', bestAchievement: user.bestAchievement || '',
          profileCategory: user.profileCategory || '', workStatus: user.workStatus || '', employmentType: user.employmentType || '',
          dateOfBirth: profile.dateOfBirth || '', lookingForJob: !!user.lookingForJob, profilePublic: !!profile.profilePublic
        };
        this.original = { email: user.email, phoneNumber: user.phoneNumber || '' };
        this.loading = false;
      },
      error: error => { this.error = error.error?.detail || 'Profile could not be loaded.'; this.loading = false; }
    });
  }

  sendOtp(channel: OtpChannel): void {
    const destination = channel === 'EMAIL' ? this.form.email.trim().toLowerCase() : this.normalizedPhone(this.form.phoneNumber);
    const feedbackKey = channel === 'EMAIL' ? 'emailFeedback' : 'mobileFeedback';
    if (!destination) { this[feedbackKey] = `Enter the new ${channel === 'EMAIL' ? 'email' : 'mobile number'} first.`; return; }
    const purpose: OtpPurpose = channel === 'EMAIL' ? 'PROFILE_EMAIL' : 'PROFILE_MOBILE';
    this[feedbackKey] = 'Sending verification code…';
    this.auth.requestOtp(channel, purpose, destination).subscribe({
      next: result => this[feedbackKey] = result.developmentCode ? `Code sent. Demo OTP: ${result.developmentCode}` : 'Code sent.',
      error: error => this[feedbackKey] = error.error?.detail || 'Verification code could not be sent.'
    });
  }

  verifyOtp(channel: OtpChannel): void {
    const destination = channel === 'EMAIL' ? this.form.email.trim().toLowerCase() : this.normalizedPhone(this.form.phoneNumber);
    const code = channel === 'EMAIL' ? this.emailCode : this.mobileCode;
    const feedbackKey = channel === 'EMAIL' ? 'emailFeedback' : 'mobileFeedback';
    const tokenKey = channel === 'EMAIL' ? 'emailToken' : 'mobileToken';
    const purpose: OtpPurpose = channel === 'EMAIL' ? 'PROFILE_EMAIL' : 'PROFILE_MOBILE';
    if (!code.trim()) { this[feedbackKey] = 'Enter the OTP first.'; return; }
    this.auth.verifyOtp(channel, purpose, destination, code.trim()).subscribe({
      next: result => { this[tokenKey] = result.verificationToken; this[feedbackKey] = 'Verified. You can now save your profile.'; },
      error: error => this[feedbackKey] = error.error?.detail || 'OTP did not match.'
    });
  }

  choosePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.error = 'Use a JPG or PNG photo up to 5 MB.'; return;
    }
    this.uploading = true; this.uploadProgress = 0; this.error = '';
    this.api.uploadPostImage(file).subscribe({
      next: eventValue => {
        if (eventValue.type === HttpEventType.UploadProgress) this.uploadProgress = eventValue.total ? Math.round((eventValue.loaded * 100) / eventValue.total) : 0;
        if (eventValue instanceof HttpResponse) {
          this.form.photoUrl = (eventValue.body as ImageUploadResponse | null)?.imageUrl || '';
          this.uploading = false;
        }
      },
      error: error => { this.uploading = false; this.error = error.error?.detail || 'Photo upload failed.'; }
    });
  }

  save(): void {
    if (this.saving || this.uploading) return;
    this.error = ''; this.success = '';
    if (this.emailChanged() && !this.emailToken) { this.error = 'Verify the new email before saving.'; return; }
    if (this.mobileChanged() && !this.mobileToken) { this.error = 'Verify the new mobile number before saving.'; return; }
    this.saving = true;
    this.api.updateMyProfile({
      ...this.form,
      fullName: this.form.fullName.trim(), email: this.form.email.trim(), phoneNumber: this.normalizedPhone(this.form.phoneNumber),
      emailVerificationToken: this.emailToken || undefined, phoneVerificationToken: this.mobileToken || undefined
    }).subscribe({
      next: result => {
        const user = result.user.user;
        this.auth.syncProfile(user, result.token);
        this.original = { email: user.email, phoneNumber: user.phoneNumber || '' };
        this.emailToken = ''; this.mobileToken = ''; this.emailCode = ''; this.mobileCode = '';
        this.success = result.user.profilePublic ? 'Profile saved and public visibility is enabled.' : 'Profile saved. Your details remain private.';
        this.saving = false;
      },
      error: error => { this.error = error.error?.detail || 'Profile could not be saved.'; this.saving = false; }
    });
  }

  copyPublicProfileLink(): void {
    const userId = this.auth.session?.userId;
    if (!userId) return;
    navigator.clipboard.writeText(`${window.location.origin}/member/${userId}`)
      .then(() => this.success = 'Public profile link copied.')
      .catch(() => this.success = `Public profile link: ${window.location.origin}/member/${userId}`);
  }

  label(value: string): string { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
  private normalizedPhone(value: string): string { return value.replace(/[\s()\-]/g, ''); }
  private blankForm(): ProfileForm {
    return { fullName: '', email: '', phoneNumber: '', address: '', photoUrl: '', currentPost: '', position: '', school: '', college: '', bestAchievement: '', profileCategory: '', workStatus: '', employmentType: '', dateOfBirth: '', lookingForJob: false, profilePublic: false };
  }
}
