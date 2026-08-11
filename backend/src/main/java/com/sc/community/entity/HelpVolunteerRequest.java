package com.sc.community.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "help_volunteer_requests", indexes = {
    @Index(name = "idx_volunteer_request_owner_status", columnList = "requested_to_user_id,status"),
    @Index(name = "idx_volunteer_request_post_status", columnList = "post_id,status")
})
public class HelpVolunteerRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "post_id") private Post post;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "volunteer_user_id") private User volunteer;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requested_to_user_id") private User requestedTo;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24) private VolunteerRequestStatus status = VolunteerRequestStatus.PENDING;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "conversation_id") private HelpConversation conversation;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "responded_at") private Instant respondedAt;
    @PrePersist void prePersist(){createdAt=Instant.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Post getPost(){return post;} public void setPost(Post v){post=v;}
    public User getVolunteer(){return volunteer;} public void setVolunteer(User v){volunteer=v;}
    public User getRequestedTo(){return requestedTo;} public void setRequestedTo(User v){requestedTo=v;}
    public VolunteerRequestStatus getStatus(){return status;} public void setStatus(VolunteerRequestStatus v){status=v;}
    public HelpConversation getConversation(){return conversation;} public void setConversation(HelpConversation v){conversation=v;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public Instant getRespondedAt(){return respondedAt;} public void setRespondedAt(Instant v){respondedAt=v;}
}
