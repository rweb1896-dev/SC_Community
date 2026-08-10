package com.sc.community.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "help_conversations", uniqueConstraints = @UniqueConstraint(name = "uk_help_conversation_post_helper", columnNames = {"post_id", "helper_user_id"}))
public class HelpConversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "post_id") private Post post;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requester_user_id") private User requester;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "helper_user_id") private User helper;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40) private HelpConversationStatus status = HelpConversationStatus.ACTIVE;
    @Column(name = "session_number", nullable = false) private int sessionNumber = 1;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "activated_at", nullable = false) private Instant activatedAt;
    @Column(name = "ended_at") private Instant endedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ended_by_user_id") private User endedBy;
    @Column(name = "end_reason", length = 240) private String endReason;
    @Column(name = "last_message_at") private Instant lastMessageAt;
    @Version private long version;
    @PrePersist void prePersist() { createdAt = Instant.now(); activatedAt = createdAt; }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Post getPost(){return post;} public void setPost(Post post){this.post=post;}
    public User getRequester(){return requester;} public void setRequester(User requester){this.requester=requester;}
    public User getHelper(){return helper;} public void setHelper(User helper){this.helper=helper;}
    public HelpConversationStatus getStatus(){return status;} public void setStatus(HelpConversationStatus status){this.status=status;}
    public int getSessionNumber(){return sessionNumber;} public void setSessionNumber(int sessionNumber){this.sessionNumber=sessionNumber;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public Instant getActivatedAt(){return activatedAt;} public void setActivatedAt(Instant v){activatedAt=v;}
    public Instant getEndedAt(){return endedAt;} public void setEndedAt(Instant v){endedAt=v;}
    public User getEndedBy(){return endedBy;} public void setEndedBy(User v){endedBy=v;}
    public String getEndReason(){return endReason;} public void setEndReason(String v){endReason=v;}
    public Instant getLastMessageAt(){return lastMessageAt;} public void setLastMessageAt(Instant v){lastMessageAt=v;}
    public long getVersion(){return version;}
}
