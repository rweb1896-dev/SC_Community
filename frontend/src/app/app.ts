import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAward, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideChevronDown, LucideClock3, LucideCopy, LucideHouse, LucideImages, LucideKeyRound, LucideLogOut, LucideMessageCircle, LucideNewspaper, LucideRadio, LucideSearch, LucideSend, LucideShare2, LucideShieldCheck, LucideUpload, LucideUsersRound, LucideVideo, LucideX } from '@lucide/angular';
import { AuthService } from './core/auth.service';
import { CommunityApiService } from './core/community-api.service';
import { ExpertiseField, ImageUploadResponse, MemberInviteRequest } from './core/models';
import { interval, Subscription } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { AppLanguage, I18nService } from './core/i18n.service';
import { TranslatePipe } from './core/translate.pipe';
import { MessageDockComponent } from './chat/message-dock.component';
import { UiLocalizationService } from './core/ui-localization.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, DatePipe, NgFor, NgIf, FormsModule, TranslatePipe, MessageDockComponent, LucideAward, LucideBookOpen, LucideCalendarDays, LucideCheck, LucideChevronDown, LucideClock3, LucideCopy, LucideHouse, LucideImages, LucideKeyRound, LucideLogOut, LucideMessageCircle, LucideNewspaper, LucideRadio, LucideSearch, LucideSend, LucideShare2, LucideShieldCheck, LucideUpload, LucideUsersRound, LucideVideo, LucideX],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  menuOpen = false;
  profileOpen = false;
  searchTerm = '';
  publicSection = 'leaders';
  inviteWorkspaceOpen = false;
  inviteRequest?: MemberInviteRequest;
  inviteRecipientMode: 'EMAIL' | 'MOBILE' = 'EMAIL';
  inviteRecipient = '';
  inviteLoading = false;
  inviteFeedback = '';
  inviteCopied = false;
  profileHelpOpen = false;
  profileHelpSaving = false;
  profileHelpError = '';
  expertiseFields: ExpertiseField[] = [];
  selectedHelpFieldIds: number[] = [];
  profileHelpRequired = false;
  profileEditorOpen = false;
  profileEditorLoading = false;
  profileEditorSaving = false;
  profileEditorError = '';
  profileEditorSuccess = '';
  profileForm = { fullName:'', email:'', phoneNumber:'', address:'', photoUrl:'', currentPost:'', position:'', school:'', college:'', bestAchievement:'' };
  private profileOriginal = { email:'', phoneNumber:'' };
  profileEmailOtp = ''; profileMobileOtp = '';
  profileEmailToken = ''; profileMobileToken = '';
  profileEmailFeedback = ''; profileMobileFeedback = '';
  profilePhotoUploading = false;
  profilePhotoProgress = 0;
  messageOpenRequest = 0;
  private inviteCreatingNew = false;
  private subscriptions = new Subscription();

  constructor(public auth: AuthService, public router: Router, private api: CommunityApiService, public i18n: I18nService, private uiLocalization: UiLocalizationService) {}

  changeLanguage(value: string): void { this.i18n.setLanguage(value as AppLanguage); }
  openMessages(): void {
    this.menuOpen = false;
    this.messageOpenRequest += 1;
  }

  ngOnInit(): void {
    this.uiLocalization.start();
    this.subscriptions.add(this.auth.session$.subscribe((session) => {
      if (session) {
        this.refreshMemberInvite(false);
        if (session.role === 'ROLE_USER' && !session.profileComplete) { this.profileHelpRequired = true; this.openProfileHelp(session.helpFieldIds || []); }
        else this.profileHelpOpen = false;
      } else {
        this.inviteRequest = undefined; this.inviteWorkspaceOpen = false; this.profileHelpOpen = false;
        this.selectedHelpFieldIds = []; this.profileHelpError = '';
      }
    }));
    this.subscriptions.add(interval(7000).subscribe(() => {
      if (this.auth.session) this.refreshMemberInvite(true);
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  get memberInviteMessage(): string {
    const code = this.inviteRequest?.inviteCode;
    if (!code) return '';
    const url = `${window.location.origin}/login?mode=register&invite=${encodeURIComponent(code)}`;
    if (this.i18n.language() === 'hi') {
      return `आपको एससी कम्युनिटी कनेक्ट से जुड़ने के लिए आमंत्रित किया गया है।\n\nपंजीकरण लिंक: ${url}\nआमंत्रण कोड: ${code}\nईमेल OTP: SC1E\nमोबाइल OTP: SC2M\n\nयह आमंत्रण कोड केवल एक बार उपयोग किया जा सकता है।`;
    }
    return `You're invited to join SC Community Connect.\n\nRegister here: ${url}\nInvite code: ${code}\nEmail OTP: SC1E\nMobile OTP: SC2M\n\nThis invite code can be used once.`;
  }

  openInviteWorkspace(): void {
    this.menuOpen = false; this.profileOpen = false; this.inviteWorkspaceOpen = true;
    this.inviteFeedback = ''; this.refreshMemberInvite(false);
  }

  closeInviteWorkspace(): void { this.inviteWorkspaceOpen = false; this.inviteFeedback = ''; }

  requestMemberInvite(): void {
    const value = this.inviteRecipient.trim();
    const email = this.inviteRecipientMode === 'EMAIL' ? value : '';
    const mobile = this.inviteRecipientMode === 'MOBILE' ? value.replace(/[\s()-]/g, '') : '';
    if ((email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (mobile && !/^\+?[1-9]\d{9,14}$/.test(mobile))) {
      this.inviteFeedback = this.inviteRecipientMode === 'EMAIL' ? 'Enter a valid email address.' : 'Enter a valid mobile number with country code.'; return;
    }
    this.inviteLoading = true; this.inviteFeedback = '';
    this.api.requestMemberInvite(email, mobile).subscribe({
      next: (request) => { this.inviteCreatingNew = false; this.inviteRequest = request; this.inviteRecipient = ''; this.inviteLoading = false; },
      error: (error) => { this.inviteFeedback = error.error?.detail || 'Request could not be sent'; this.inviteLoading = false; }
    });
  }

  copyMemberInvite(): void {
    navigator.clipboard.writeText(this.memberInviteMessage).then(() => {
      this.inviteCopied = true; setTimeout(() => this.inviteCopied = false, 1800);
    }).catch(() => this.inviteFeedback = 'Copy failed. Select the message and copy it manually.');
  }

  shareMemberInvite(): void {
    if (navigator.share) navigator.share({ title: 'SC Community Connect invite', text: this.memberInviteMessage })
      .catch(() => undefined);
    else this.copyMemberInvite();
  }

  newMemberInviteRequest(): void { this.inviteCreatingNew = true; this.inviteRequest = undefined; this.inviteFeedback = ''; }

  toggleProfileHelpField(fieldId: number): void {
    this.profileHelpError = '';
    this.selectedHelpFieldIds = this.selectedHelpFieldIds.includes(fieldId)
      ? this.selectedHelpFieldIds.filter((id) => id !== fieldId)
      : this.selectedHelpFieldIds.length < 8 ? [...this.selectedHelpFieldIds, fieldId] : this.selectedHelpFieldIds;
  }

  saveProfileHelp(): void {
    if (!this.selectedHelpFieldIds.length) {
      this.profileHelpError = 'Select at least one field where you can help.'; return;
    }
    this.profileHelpSaving = true; this.profileHelpError = '';
    this.api.updateMyHelpFields(this.selectedHelpFieldIds).subscribe({
      next: (user) => { this.auth.syncHelpProfile(user); this.profileHelpSaving = false; this.profileHelpOpen = false; },
      error: (error) => { this.profileHelpError = error.error?.detail || 'Your profile could not be updated.'; this.profileHelpSaving = false; }
    });
  }

  editProfileHelp(): void {
    this.profileOpen = false;
    this.profileHelpRequired = false;
    this.openProfileHelp(this.auth.session?.helpFieldIds || []);
  }

  closeProfileHelp(): void { if (!this.profileHelpRequired) this.profileHelpOpen = false; }

  removeProfileHelpField(fieldId:number):void {
    this.selectedHelpFieldIds = this.selectedHelpFieldIds.filter(id => id !== fieldId);
  }

  selectedHelpFields(): ExpertiseField[] { return this.expertiseFields.filter(field => this.selectedHelpFieldIds.includes(field.id)); }

  profilePhoto():string { return this.auth.session?.photoUrl || '/assets/default-profile.svg'; }
  displayProfilePhoto(value?: string): string { return value && value.trim() ? value.trim() : '/assets/default-profile.svg'; }
  profileCompletionValue():number {
    const checks = [
      this.profileForm.fullName.trim(), this.profileForm.email.trim(), this.profileForm.phoneNumber.trim(),
      this.profileForm.address.trim(), this.profileForm.photoUrl.trim(),
      this.profileForm.currentPost.trim() || this.profileForm.position.trim(),
      this.profileForm.school.trim(), this.profileForm.college.trim(), this.profileForm.bestAchievement.trim(),
      this.selectedHelpFieldIds.length ? 'help' : ''
    ];
    return Math.min(100, Math.round(checks.filter(Boolean).length * 10));
  }

  openSelfProfile():void {
    this.profileOpen=false;this.profileEditorOpen=true;this.profileEditorLoading=true;this.profileEditorError='';this.profileEditorSuccess='';
    this.api.myProfile().subscribe({next:user=>{this.profileForm={fullName:user.fullName,email:user.email,phoneNumber:user.phoneNumber||'',address:user.address||'',photoUrl:user.photoUrl||'',currentPost:user.currentPost||'',position:user.position||'',school:user.school||'',college:user.college||'',bestAchievement:user.bestAchievement||''};this.selectedHelpFieldIds=[...(user.helpFieldIds||[])];this.profileOriginal={email:user.email,phoneNumber:user.phoneNumber||''};this.resetProfileVerification();this.profileEditorLoading=false;},error:e=>{this.profileEditorError=e.error?.detail||'Profile could not be loaded.';this.profileEditorLoading=false;}});
  }
  closeSelfProfile():void{if(!this.profileEditorSaving)this.profileEditorOpen=false;}
  selectProfilePhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { this.profileEditorError = 'Only JPG and PNG profile photos are allowed.'; return; }
    this.profilePhotoUploading = true; this.profilePhotoProgress = 0; this.profileEditorError = '';
    this.api.uploadPostImage(file).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) this.profilePhotoProgress = Math.round(100 * event.loaded / event.total);
        if (event instanceof HttpResponse) {
          this.profileForm.photoUrl = (event.body as ImageUploadResponse | null)?.imageUrl || '';
          this.profilePhotoUploading = false; this.profilePhotoProgress = 100;
        }
      },
      error: e => { this.profileEditorError = e.error?.detail || 'Profile photo could not be uploaded.'; this.profilePhotoUploading = false; }
    });
  }
  sendProfileOtp(channel:'EMAIL'|'MOBILE'):void{
    const destination=(channel==='EMAIL'?this.profileForm.email:this.profileForm.phoneNumber).trim();const purpose=channel==='EMAIL'?'PROFILE_EMAIL':'PROFILE_MOBILE';
    this.auth.requestOtp(channel,purpose,destination).subscribe({next:r=>{const message=`Code sent${r.developmentCode?' · OTP: '+r.developmentCode:''}`;if(channel==='EMAIL')this.profileEmailFeedback=message;else this.profileMobileFeedback=message;},error:e=>{const message=e.error?.detail||'OTP could not be sent.';if(channel==='EMAIL')this.profileEmailFeedback=message;else this.profileMobileFeedback=message;}});
  }
  verifyProfileOtp(channel:'EMAIL'|'MOBILE'):void{
    const email=channel==='EMAIL',destination=(email?this.profileForm.email:this.profileForm.phoneNumber).trim(),code=email?this.profileEmailOtp:this.profileMobileOtp,purpose=email?'PROFILE_EMAIL':'PROFILE_MOBILE';
    this.auth.verifyOtp(channel,purpose,destination,code).subscribe({next:r=>{if(email){this.profileEmailToken=r.verificationToken;this.profileEmailFeedback='Email verified.';}else{this.profileMobileToken=r.verificationToken;this.profileMobileFeedback='Mobile verified.';}},error:e=>{const message=e.error?.detail||'OTP verification failed.';if(email)this.profileEmailFeedback=message;else this.profileMobileFeedback=message;}});
  }
  saveSelfProfile():void{
    const emailChanged=this.profileForm.email.trim().toLowerCase()!==this.profileOriginal.email.toLowerCase(),phoneChanged=this.profileForm.phoneNumber.trim()!==this.profileOriginal.phoneNumber;
    if(emailChanged&&!this.profileEmailToken){this.profileEditorError='Verify the new email before saving.';return;}if(phoneChanged&&!this.profileMobileToken){this.profileEditorError='Verify the new mobile number before saving.';return;}
    this.profileEditorSaving=true;this.profileEditorError='';this.api.updateMyProfile({...this.profileForm,emailVerificationToken:this.profileEmailToken||undefined,phoneVerificationToken:this.profileMobileToken||undefined}).subscribe({next:result=>{const user=result.user;this.auth.syncProfile(user,result.token);this.profileOriginal={email:user.email,phoneNumber:user.phoneNumber||''};this.profileEditorSuccess='Profile updated successfully.';this.profileEditorSaving=false;this.resetProfileVerification();},error:e=>{this.profileEditorError=e.error?.detail||'Profile could not be updated.';this.profileEditorSaving=false;}});
  }
  emailChanged():boolean{return this.profileForm.email.trim().toLowerCase()!==this.profileOriginal.email.toLowerCase();}
  mobileChanged():boolean{return this.profileForm.phoneNumber.trim()!==this.profileOriginal.phoneNumber;}
  private resetProfileVerification():void{this.profileEmailOtp='';this.profileMobileOtp='';this.profileEmailToken='';this.profileMobileToken='';this.profileEmailFeedback='';this.profileMobileFeedback='';}

  private openProfileHelp(selected: number[]): void {
    this.selectedHelpFieldIds = [...selected];
    this.profileHelpOpen = true;
    if (this.expertiseFields.length) return;
    this.api.expertiseFields().subscribe({
      next: (fields) => this.expertiseFields = fields,
      error: () => this.profileHelpError = 'Help fields could not be loaded. Please check your connection and retry.'
    });
  }

  private refreshMemberInvite(openOnApproval: boolean): void {
    this.api.myInviteRequests().subscribe({ next: (requests) => {
      if (this.inviteCreatingNew) return;
      const previous = this.inviteRequest;
      this.inviteRequest = requests[0];
      if (openOnApproval && this.inviteRequest?.status !== 'PENDING' && previous?.status === 'PENDING') {
        this.inviteWorkspaceOpen = true;
      }
    }});
  }

  logout(): void {
    this.menuOpen = false;
    this.profileOpen = false;
    this.auth.logout();
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  selectPublicSection(section: string): void {
    this.publicSection = section;
    this.closeMenu();
  }

  isPublicSection(section: string): boolean {
    if (this.router.url.startsWith('/community')) return this.publicSection === section;
    if (section === 'leaders') return this.router.url.startsWith('/leaders');
    if (section === 'events') return this.router.url.startsWith('/events');
    if (section === 'live') return this.router.url.startsWith('/live');
    return false;
  }

  @HostListener('window:community-section-change', ['$event'])
  updatePublicSection(event: Event): void {
    this.publicSection = (event as CustomEvent<string>).detail;
  }

  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen = !this.profileOpen;
  }

  @HostListener('document:click')
  closeProfile(): void {
    this.profileOpen = false;
  }

  search(): void {
    this.router.navigate(['/feed'], { queryParams: this.searchTerm.trim() ? { q: this.searchTerm.trim() } : {} });
  }

}
