package com.sc.community.entity;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="help_messages")
public class HelpMessage {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="conversation_id") private HelpConversation conversation;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="sender_id") private User sender;
 @Column(name="message_body",nullable=false,columnDefinition="TEXT") private String messageBody;
 @Column(name="is_read",nullable=false) private boolean read;
 @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
 @PrePersist void prePersist(){createdAt=Instant.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public HelpConversation getConversation(){return conversation;} public void setConversation(HelpConversation v){conversation=v;} public User getSender(){return sender;} public void setSender(User v){sender=v;} public String getMessageBody(){return messageBody;} public void setMessageBody(String v){messageBody=v;} public boolean isRead(){return read;} public void setRead(boolean v){read=v;} public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
}
