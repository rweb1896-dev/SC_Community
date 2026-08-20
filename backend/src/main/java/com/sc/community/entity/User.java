package com.sc.community.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "phone_number", unique = true, length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.ROLE_USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "id_proof_url", length = 1000)
    private String idProofUrl;

    @Column(name = "invite_code_used")
    private String inviteCodeUsed;

    @Enumerated(EnumType.STRING)
    @Column(name = "professional_group", nullable = false, length = 40)
    private ProfessionalGroup professionalGroup = ProfessionalGroup.COMMUNITY;

    @Transient
    private Set<ExpertiseField> helpFields = new LinkedHashSet<>();

    @Transient
    private String address;

    @Transient
    private String photoUrl;

    @Transient
    private String currentPost;

    @Transient
    private String position;

    @Transient
    private String school;

    @Transient
    private String college;

    @Transient
    private String bestAchievement;

    @Transient
    private String profileCategory;

    @Transient
    private String workStatus;

    @Transient
    private String employmentType;

    /** Kept in the profile directory record, never in the public member response. */
    @Transient
    private String dateOfBirth;

    @Transient
    private boolean lookingForJob;

    /** Profile details remain private unless the member explicitly turns this on. */
    @Transient
    private boolean profilePublic;

    @Transient
    private int profileCompletion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Transient
    private Instant lastLoginAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
    public String getIdProofUrl() { return idProofUrl; }
    public void setIdProofUrl(String idProofUrl) { this.idProofUrl = idProofUrl; }
    public String getInviteCodeUsed() { return inviteCodeUsed; }
    public void setInviteCodeUsed(String inviteCodeUsed) { this.inviteCodeUsed = inviteCodeUsed; }
    public ProfessionalGroup getProfessionalGroup() { return professionalGroup; }
    public void setProfessionalGroup(ProfessionalGroup professionalGroup) { this.professionalGroup = professionalGroup; }
    public Set<ExpertiseField> getHelpFields() { return helpFields; }
    public void setHelpFields(Set<ExpertiseField> helpFields) { this.helpFields = helpFields; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getCurrentPost() { return currentPost; }
    public void setCurrentPost(String currentPost) { this.currentPost = currentPost; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }
    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }
    public String getBestAchievement() { return bestAchievement; }
    public void setBestAchievement(String bestAchievement) { this.bestAchievement = bestAchievement; }
    public String getProfileCategory() { return profileCategory; }
    public void setProfileCategory(String profileCategory) { this.profileCategory = profileCategory; }
    public String getWorkStatus() { return workStatus; }
    public void setWorkStatus(String workStatus) { this.workStatus = workStatus; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public boolean isLookingForJob() { return lookingForJob; }
    public void setLookingForJob(boolean lookingForJob) { this.lookingForJob = lookingForJob; }
    public boolean isProfilePublic() { return profilePublic; }
    public void setProfilePublic(boolean profilePublic) { this.profilePublic = profilePublic; }
    public int getProfileCompletion() { return profileCompletion; }
    public void setProfileCompletion(int profileCompletion) { this.profileCompletion = profileCompletion; }
    public boolean isProfileComplete() { return role == UserRole.ROLE_ADMIN || (helpFields != null && !helpFields.isEmpty()); }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
