package com.sc.community.dto;

import com.sc.community.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class HelpChatDtos {
 private HelpChatDtos(){}
 public record SendHelpMessageRequest(@NotBlank @Size(max=2000) String messageBody){}
 public record EndConversationRequest(@Size(max=240) String reason){}
 public record HelpMessageResponse(Long id,Long conversationId,Long senderId,String senderName,String messageBody,boolean read,Instant timestamp){
  public static HelpMessageResponse from(HelpMessage m){return new HelpMessageResponse(m.getId(),m.getConversation().getId(),m.getSender().getId(),m.getSender().getFullName(),m.getMessageBody(),m.isRead(),m.getCreatedAt());}
 }
 public record ConversationResponse(Long id,Long postId,String postTitle,String postContent,String categoryName,PostStatus postStatus,Long otherUserId,String otherUserName,HelpConversationStatus status,int sessionNumber,Instant activatedAt,Instant endedAt,Long endedByUserId,String endedByName,String endReason,Instant lastMessageAt,boolean reconnectAllowed,Long pendingReconnectRequestId,boolean reconnectRequestedByMe){ }
 public record ReconnectResponse(Long id,Long conversationId,Long requestedByUserId,String requestedByName,Long requestedToUserId,String postTitle,ReconnectRequestStatus status,Instant createdAt,Instant respondedAt){
  public static ReconnectResponse from(HelpReconnectRequest r){return new ReconnectResponse(r.getId(),r.getConversation().getId(),r.getRequestedBy().getId(),r.getRequestedBy().getFullName(),r.getRequestedTo().getId(),title(r.getConversation().getPost()),r.getStatus(),r.getCreatedAt(),r.getRespondedAt());}
 }
 public record VolunteerRequestResponse(Long id,Long postId,String postTitle,Long volunteerUserId,String volunteerName,Long requestedToUserId,VolunteerRequestStatus status,Long conversationId,Instant createdAt,Instant respondedAt){
  public static VolunteerRequestResponse from(HelpVolunteerRequest r){return new VolunteerRequestResponse(r.getId(),r.getPost().getId(),title(r.getPost()),r.getVolunteer().getId(),r.getVolunteer().getFullName(),r.getRequestedTo().getId(),r.getStatus(),r.getConversation()==null?null:r.getConversation().getId(),r.getCreatedAt(),r.getRespondedAt());}
 }
 public record MyHelpPostResponse(Long id,String title,String content,Long categoryId,String categoryName,PostStatus status,Instant createdAt,Instant closedAt,long helperCount,long activeConversationCount,long pendingVolunteerCount,boolean audienceExpanded,boolean canRequestAll){ }
 public record NotificationResponse(Long id,HelpNotificationType type,String title,String body,Long postId,Long conversationId,boolean read,Instant createdAt){
  public static NotificationResponse from(HelpNotification n){return new NotificationResponse(n.getId(),n.getType(),n.getTitle(),n.getBody(),n.getPost()==null?null:n.getPost().getId(),n.getConversation()==null?null:n.getConversation().getId(),n.isRead(),n.getCreatedAt());}
 }
 public record LifecycleEvent(String type,Long conversationId,Long postId){}
 public static String title(Post p){String text=p.getContent().trim().replaceAll("\\s+"," ");return text.length()>72?text.substring(0,69)+"...":text;}
}
