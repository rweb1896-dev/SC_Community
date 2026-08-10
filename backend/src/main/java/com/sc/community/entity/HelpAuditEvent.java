package com.sc.community.entity;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="help_audit_events")
public class HelpAuditEvent {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="event_type",nullable=false,length=40) private String eventType;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="actor_user_id") private User actor;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="post_id") private Post post;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="conversation_id") private HelpConversation conversation;
 @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
 @PrePersist void prePersist(){createdAt=Instant.now();}
 public String getEventType(){return eventType;} public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;} public void setEventType(String v){eventType=v;} public void setActor(User v){actor=v;} public void setPost(Post v){post=v;} public void setConversation(HelpConversation v){conversation=v;}
}
