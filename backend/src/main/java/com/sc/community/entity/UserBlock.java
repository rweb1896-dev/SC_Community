package com.sc.community.entity;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="user_blocks",uniqueConstraints=@UniqueConstraint(name="uk_user_block_pair",columnNames={"blocker_user_id","blocked_user_id"}))
public class UserBlock {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="blocker_user_id") private User blocker;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="blocked_user_id") private User blocked;
 @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
 @PrePersist void prePersist(){createdAt=Instant.now();}
 public Long getId(){return id;} public User getBlocker(){return blocker;} public void setBlocker(User v){blocker=v;} public User getBlocked(){return blocked;} public void setBlocked(User v){blocked=v;} public Instant getCreatedAt(){return createdAt;}
}
