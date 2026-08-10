package com.sc.community.entity;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="help_reconnect_requests")
public class HelpReconnectRequest {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="conversation_id") private HelpConversation conversation;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="requested_by_user_id") private User requestedBy;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="requested_to_user_id") private User requestedTo;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=24) private ReconnectRequestStatus status=ReconnectRequestStatus.PENDING;
 @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
 @Column(name="responded_at") private Instant respondedAt;
 @PrePersist void prePersist(){createdAt=Instant.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public HelpConversation getConversation(){return conversation;} public void setConversation(HelpConversation v){conversation=v;} public User getRequestedBy(){return requestedBy;} public void setRequestedBy(User v){requestedBy=v;} public User getRequestedTo(){return requestedTo;} public void setRequestedTo(User v){requestedTo=v;} public ReconnectRequestStatus getStatus(){return status;} public void setStatus(ReconnectRequestStatus v){status=v;} public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;} public Instant getRespondedAt(){return respondedAt;} public void setRespondedAt(Instant v){respondedAt=v;}
}
