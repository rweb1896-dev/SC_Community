package com.sc.community.entity;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="help_notifications",uniqueConstraints=@UniqueConstraint(name="uk_help_notification_dedupe",columnNames={"dedupe_key"}))
public class HelpNotification {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="recipient_user_id") private User recipient;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=40) private HelpNotificationType type;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="post_id") private Post post;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="conversation_id") private HelpConversation conversation;
 @Column(nullable=false,length=180) private String title;
 @Column(nullable=false,length=500) private String body;
 @Column(name="dedupe_key",nullable=false,length=180) private String dedupeKey;
 @Column(name="is_read",nullable=false) private boolean read;
 @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
 @PrePersist void prePersist(){createdAt=Instant.now();}
 public Long getId(){return id;} public void setId(Long v){id=v;} public User getRecipient(){return recipient;} public void setRecipient(User v){recipient=v;} public HelpNotificationType getType(){return type;} public void setType(HelpNotificationType v){type=v;} public Post getPost(){return post;} public void setPost(Post v){post=v;} public HelpConversation getConversation(){return conversation;} public void setConversation(HelpConversation v){conversation=v;} public String getTitle(){return title;} public void setTitle(String v){title=v;} public String getBody(){return body;} public void setBody(String v){body=v;} public String getDedupeKey(){return dedupeKey;} public void setDedupeKey(String v){dedupeKey=v;} public boolean isRead(){return read;} public void setRead(boolean v){read=v;} public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
}
