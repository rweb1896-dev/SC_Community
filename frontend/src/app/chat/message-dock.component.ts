import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LucideBan, LucideChevronDown, LucideClock3, LucideHistory, LucideMessageCircle, LucideMinus, LucideRefreshCw, LucideRotateCcw, LucideSend, LucideShieldAlert, LucideX } from '@lucide/angular';
import { AuthService } from '../core/auth.service';
import { ChatService } from '../core/chat.service';
import { CommunityApiService } from '../core/community-api.service';
import { HelpConversation, HelpMessage, HelpNotification, ReconnectRequest, VolunteerRequest } from '../core/models';

@Component({selector:'app-message-dock',standalone:true,imports:[CommonModule,FormsModule,LucideBan,LucideChevronDown,LucideClock3,LucideHistory,LucideMessageCircle,LucideMinus,LucideRefreshCw,LucideRotateCcw,LucideSend,LucideShieldAlert,LucideX],templateUrl:'./message-dock.component.html',styleUrl:'./message-dock.component.css'})
export class MessageDockComponent implements OnInit,OnDestroy,AfterViewChecked,OnChanges{
 @ViewChild('messageList') private messageList?:ElementRef<HTMLElement>;@ViewChild('dockComposer') private composer?:ElementRef<HTMLTextAreaElement>;@Input() openRequest=0;
 active:HelpConversation[]=[];history:HelpConversation[]=[];messages:HelpMessage[]=[];incoming:ReconnectRequest[]=[];incomingVolunteers:VolunteerRequest[]=[];notifications:HelpNotification[]=[];selected?:HelpConversation;
 tab:'ACTIVE'|'HISTORY'='ACTIVE';draft='';searchTerm='';error='';loading=true;panelOpen=false;conversationMinimized=false;endConfirm=false;relatedPostOpen=false;private subscriptions=new Subscription();private shouldScroll=false;
 constructor(public auth:AuthService,private api:CommunityApiService,private chat:ChatService){}
 get rows(){const all=this.tab==='ACTIVE'?this.active:this.history;const q=this.searchTerm.trim().toLowerCase();return q?all.filter(c=>`${c.otherUserName} ${c.postTitle} ${c.categoryName}`.toLowerCase().includes(q)):all;}
 get unreadTotal(){return this.notifications.filter(n=>!n.read).length+this.incoming.length+this.incomingVolunteers.length;}
 ngOnInit(){this.panelOpen=window.innerWidth>=1100;this.reload();this.chat.connect();this.subscriptions.add(this.chat.helpUpdates$.subscribe(()=>this.reload(true)));}
 ngOnChanges(changes:SimpleChanges){if(changes['openRequest']&&this.openRequest>0)this.panelOpen=true;}
 ngAfterViewChecked(){if(this.shouldScroll&&this.messageList){this.shouldScroll=false;this.messageList.nativeElement.scrollTop=this.messageList.nativeElement.scrollHeight;}}
 setTab(tab:'ACTIVE'|'HISTORY'){this.tab=tab;this.selected=undefined;this.messages=[];}
 reload(background=false){if(!background)this.loading=true;this.error='';this.api.helpConversations('ACTIVE').subscribe({next:r=>{this.active=r;this.syncSelected();},error:e=>this.error=e.error?.detail||'Active help chats could not be loaded.'});this.api.helpConversations('HISTORY').subscribe({next:r=>{this.history=r;this.syncSelected();this.loading=false;},error:e=>{this.error=e.error?.detail||'Chat history could not be loaded.';this.loading=false;}});this.api.incomingReconnects().subscribe({next:r=>this.incoming=r});this.api.incomingVolunteerRequests().subscribe({next:r=>this.incomingVolunteers=r});this.api.helpNotifications().subscribe({next:r=>this.notifications=r});}
 select(c:HelpConversation){this.selected=c;this.conversationMinimized=false;this.messages=[];this.api.helpMessages(c.id).subscribe({next:r=>{this.messages=r;this.shouldScroll=true;},error:e=>this.error=e.error?.detail||'Conversation could not be loaded.'});if(window.innerWidth<700)this.panelOpen=false;}
 send(){const body=this.draft.trim();if(!this.selected||this.selected.status!=='ACTIVE'||!body)return;this.draft='';this.api.sendHelpMessage(this.selected.id,body).subscribe({next:m=>{if(!this.messages.some(x=>x.id===m.id))this.messages=[...this.messages,m];this.shouldScroll=true;this.resetComposer();},error:e=>{this.error=e.error?.detail||'Message could not be sent.';this.reload(true);}});}
 confirmEnd(){this.endConfirm=true;} cancelEnd(){this.endConfirm=false;} end(){if(!this.selected)return;this.api.endHelpConversation(this.selected.id).subscribe({next:()=>{this.endConfirm=false;this.selected=undefined;this.messages=[];this.tab='HISTORY';this.reload();},error:e=>this.error=e.error?.detail||'Conversation could not be ended.'});}
 reconnect(){if(!this.selected)return;this.api.requestReconnect(this.selected.id).subscribe({next:()=>this.reload(),error:e=>this.error=e.error?.detail||'Reconnect request could not be sent.'});}
 decide(r:ReconnectRequest,accept:boolean){this.api.decideReconnect(r.id,accept).subscribe({next:()=>this.reload(),error:e=>this.error=e.error?.detail||'Reconnect request could not be updated.'});}
 decideVolunteer(r:VolunteerRequest,accept:boolean){this.api.decideVolunteerRequest(r.id,accept).subscribe({next:result=>{this.incomingVolunteers=this.incomingVolunteers.filter(item=>item.id!==r.id);if(accept&&result.conversationId){this.api.helpConversations('ACTIVE').subscribe({next:rows=>{this.active=rows;this.tab='ACTIVE';const chat=rows.find(item=>item.id===result.conversationId);if(chat)this.select(chat);this.panelOpen=true;}});}else this.reload(true);},error:e=>this.error=e.error?.detail||'Volunteer request could not be updated.'});}
 openNotification(n:HelpNotification){this.api.readHelpNotification(n.id).subscribe({next:()=>{n.read=true;const c=[...this.active,...this.history].find(row=>row.id===n.conversationId);if(c){this.tab=c.status==='ACTIVE'?'ACTIVE':'HISTORY';this.select(c);}else if(n.type==='VOLUNTEER_REQUEST'){this.panelOpen=true;}else if(n.postId){this.error=n.type==='POST_CLOSED'?'This help request is no longer active.':'Open the matching post in the feed to offer help.';}}});}
 block(){if(!this.selected||!confirm(`Block ${this.selected.otherUserName}? Messaging and reconnect requests will be disabled.`))return;this.api.blockHelpUser(this.selected.id).subscribe({next:()=>{this.selected=undefined;this.reload();},error:e=>this.error=e.error?.detail||'Member could not be blocked.'});}
 report(){if(!this.selected)return;const reason=prompt('Briefly describe the safety concern:','Inappropriate behaviour');if(!reason)return;this.api.reportHelpConversation(this.selected.id,reason).subscribe({next:()=>this.error='Report submitted for admin review.',error:e=>this.error=e.error?.detail||'Report could not be submitted.'});}
 togglePanel(){this.panelOpen=!this.panelOpen;} minimizeConversation(){this.conversationMinimized=true;} restoreConversation(){this.conversationMinimized=false;this.shouldScroll=true;} closeConversation(){this.selected=undefined;this.messages=[];this.draft='';this.relatedPostOpen=false;}
 handleKeydown(e:KeyboardEvent){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this.send();}} resizeComposer(e:Event){const t=e.target as HTMLTextAreaElement;t.style.height='auto';t.style.height=`${Math.min(t.scrollHeight,112)}px`;}
 initials(n:string){return n.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase();}
 endLabel(c:HelpConversation){if(c.status==='ENDED_POST_CLOSED')return 'Post closed';if(c.status==='BLOCKED')return 'Messaging blocked';return c.endedByName?`Ended by ${c.endedByName}`:'Conversation ended';}
 private syncSelected(){if(!this.selected)return;const updated=[...this.active,...this.history].find(c=>c.id===this.selected?.id);if(updated)this.selected=updated;else this.closeConversation();}
 private resetComposer(){queueMicrotask(()=>{if(this.composer)this.composer.nativeElement.style.height='40px';});}
 ngOnDestroy(){this.subscriptions.unsubscribe();this.chat.disconnect();}
}
