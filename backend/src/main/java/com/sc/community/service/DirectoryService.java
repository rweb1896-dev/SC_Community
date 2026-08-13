package com.sc.community.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sc.community.dto.DirectoryDtos.AchieverResponse;
import com.sc.community.dto.DirectoryDtos.CreateAchieverRequest;
import com.sc.community.dto.DirectoryDtos.CreateExpertiseFieldRequest;
import com.sc.community.dto.DirectoryDtos.ExpertiseFieldResponse;
import com.sc.community.dto.UserResponse;
import com.sc.community.entity.Achiever;
import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastMediaType;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.entity.ExpertiseField;
import com.sc.community.entity.User;
import com.sc.community.entity.UserRole;
import com.sc.community.repository.BroadcastRepository;
import com.sc.community.repository.UserRepository;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Stores directory metadata in the existing broadcasts content table. This keeps production schema
 * validation strict while giving fields, achievers and member help profiles independent records.
 */
@Service
public class DirectoryService {
    private static final String ROOT = ManagedContentService.PREFIX;
    private static final String FIELD = ROOT + "EXPERTISE:";
    private static final String ACHIEVER = ROOT + "ACHIEVER:";
    private static final String USER_HELP = ROOT + "USER_HELP:";
    private static final String USER_PROFILE = ROOT + "USER_PROFILE:";

    private final BroadcastRepository repository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public DirectoryService(BroadcastRepository repository, UserRepository userRepository,
            CurrentUserService currentUserService, ObjectMapper objectMapper) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ExpertiseFieldResponse> publicFields() {
        return fields().stream().filter(ExpertiseField::isActive).map(ExpertiseFieldResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ExpertiseFieldResponse> adminFields() {
        return fields().stream().map(ExpertiseFieldResponse::from).toList();
    }

    @Transactional
    public ExpertiseFieldResponse createField(CreateExpertiseFieldRequest request) {
        if (fields().stream().anyMatch(field -> field.getName().equalsIgnoreCase(request.name().trim()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An expertise field with this name already exists");
        }
        Broadcast item = content(FIELD + slug(request.name()), request.name().trim(), "", BroadcastStatus.LIVE);
        item.setDescription(payload("", request.description().trim(), request.iconKey().trim().toUpperCase(),
                Integer.toString(request.displayOrder()), "", ""));
        return ExpertiseFieldResponse.from(field(repository.save(item)));
    }

    @Transactional
    public ExpertiseFieldResponse setFieldActive(Long fieldId, boolean active) {
        Broadcast item = require(fieldId, FIELD, "Expertise field not found");
        item.setStatus(active ? BroadcastStatus.LIVE : BroadcastStatus.PAUSED);
        return ExpertiseFieldResponse.from(field(repository.save(item)));
    }

    @Transactional(readOnly = true)
    public List<AchieverResponse> publicAchievers() {
        Set<Long> activeFields = fields().stream().filter(ExpertiseField::isActive)
                .map(ExpertiseField::getId).collect(java.util.stream.Collectors.toSet());
        return achievers().stream().filter(Achiever::isActive)
                .filter(item -> activeFields.contains(item.getExpertiseField().getId()))
                .map(AchieverResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AchieverResponse> adminAchievers() {
        return achievers().stream().map(AchieverResponse::from).toList();
    }

    @Transactional
    public AchieverResponse createAchiever(CreateAchieverRequest request) {
        ExpertiseField field = requireActiveField(request.expertiseFieldId());
        Broadcast item = content(ACHIEVER + UUID.randomUUID(), request.fullName().trim(),
                blankToEmpty(request.imageUrl()), BroadcastStatus.LIVE);
        item.setDescription(payload(request.title().trim(), request.achievement().trim(),
                Long.toString(field.getId()), blankToEmpty(request.profileUrl()),
                Integer.toString(request.displayOrder()), request.biography().trim()));
        return AchieverResponse.from(achiever(repository.save(item), Map.of(field.getId(), field)));
    }

    @Transactional
    public AchieverResponse setAchieverActive(Long achieverId, boolean active) {
        Broadcast item = require(achieverId, ACHIEVER, "Achiever not found");
        item.setStatus(active ? BroadcastStatus.LIVE : BroadcastStatus.PAUSED);
        return AchieverResponse.from(achiever(repository.save(item), fieldMap()));
    }

    @Transactional
    public void deleteAchiever(Long achieverId) {
        repository.delete(require(achieverId, ACHIEVER, "Achiever not found"));
    }

    @Transactional
    public UserResponse updateMyHelpFields(Set<Long> fieldIds) {
        User current = currentUserService.verifiedUser();
        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        saveHelpFields(user, fieldIds);
        populateProfile(user);
        return UserResponse.from(user);
    }

    @Transactional
    public void saveHelpFields(User user, Set<Long> fieldIds) {
        LinkedHashSet<ExpertiseField> selected = resolveActiveFields(fieldIds);
        String marker = USER_HELP + user.getId();
        Broadcast item = repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(candidate -> marker.equals(candidate.getTitle())).findFirst()
                .orElseGet(() -> content(marker, user.getEmail(), "", BroadcastStatus.LIVE));
        String ids = selected.stream().map(field -> field.getId().toString()).collect(java.util.stream.Collectors.joining(","));
        item.setHostName(user.getEmail());
        item.setDescription(payload("", "", ids, "", "", ""));
        item.setStatus(BroadcastStatus.LIVE);
        repository.save(item);
        user.setHelpFields(selected);
    }

    @Transactional(readOnly = true)
    public UserResponse responseForUser(User user) {
        populateHelpFields(user);
        populateProfile(user);
        return UserResponse.from(user);
    }

    @Transactional
    public void saveProfile(User user, String address, String photoUrl, String currentPost, String position,
            String school, String college, String bestAchievement, String profileCategory, String workStatus,
            String employmentType, String dateOfBirth, boolean lookingForJob) {
        String marker = USER_PROFILE + user.getId();
        Broadcast item = repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(candidate -> marker.equals(candidate.getTitle())).findFirst()
                .orElseGet(() -> content(marker, user.getEmail(), "", BroadcastStatus.LIVE));
        item.setHostName(user.getEmail());
        item.setDescription(payload(trim(currentPost), trim(address), trim(position), trim(school), trim(college),
                profileDetails(bestAchievement, profileCategory, workStatus, employmentType, dateOfBirth, lookingForJob)));
        item.setMediaUrl(trim(photoUrl));
        item.setStatus(BroadcastStatus.LIVE);
        repository.save(item);
        applyProfile(user, item);
    }

    @Transactional(readOnly = true)
    public void populateProfile(User user) {
        String marker = USER_PROFILE + user.getId();
        Broadcast item = repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(candidate -> marker.equals(candidate.getTitle()) && candidate.getStatus() != BroadcastStatus.ENDED)
                .findFirst().orElse(null);
        applyProfile(user, item);
    }

    @Transactional(readOnly = true)
    public void populateHelpFields(User user) {
        if (user.getRole() == UserRole.ROLE_ADMIN) { user.setHelpFields(new LinkedHashSet<>()); return; }
        String marker = USER_HELP + user.getId();
        Broadcast item = repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(candidate -> marker.equals(candidate.getTitle()) && candidate.getStatus() != BroadcastStatus.ENDED)
                .findFirst().orElse(null);
        if (item == null) { user.setHelpFields(new LinkedHashSet<>()); return; }
        Map<Long, ExpertiseField> available = fieldMap();
        LinkedHashSet<ExpertiseField> selected = new LinkedHashSet<>();
        for (String value : data(item).getOrDefault("category", "").split(",")) {
            try {
                ExpertiseField field = available.get(Long.parseLong(value));
                if (field != null && field.isActive()) selected.add(field);
            } catch (NumberFormatException ignored) { }
        }
        user.setHelpFields(selected);
    }

    @Transactional(readOnly = true)
    public LinkedHashSet<ExpertiseField> resolveActiveFields(Set<Long> fieldIds) {
        if (fieldIds == null || fieldIds.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one field where you can help");
        if (fieldIds.size() > 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select no more than 8 fields");
        Map<Long, ExpertiseField> available = fieldMap();
        List<ExpertiseField> selected = fieldIds.stream().map(available::get)
                .filter(java.util.Objects::nonNull).filter(ExpertiseField::isActive)
                .sorted(Comparator.comparingInt(ExpertiseField::getDisplayOrder).thenComparing(ExpertiseField::getName))
                .toList();
        if (selected.size() != fieldIds.size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected expertise fields are unavailable");
        return new LinkedHashSet<>(selected);
    }

    @Transactional
    public void seedField(String name, String description, String iconKey, int displayOrder) {
        if (fields().stream().anyMatch(field -> field.getName().equalsIgnoreCase(name))) return;
        createField(new CreateExpertiseFieldRequest(name, description, iconKey, displayOrder));
    }

    private List<ExpertiseField> fields() {
        return repository.findAllByOrderByCreatedAtDesc().stream().filter(item -> item.getTitle().startsWith(FIELD))
                .map(this::field).sorted(Comparator.comparingInt(ExpertiseField::getDisplayOrder)
                        .thenComparing(ExpertiseField::getName)).toList();
    }

    private List<Achiever> achievers() {
        Map<Long, ExpertiseField> fields = fieldMap();
        return repository.findAllByOrderByCreatedAtDesc().stream().filter(item -> item.getTitle().startsWith(ACHIEVER))
                .map(item -> achiever(item, fields)).filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparingInt((Achiever item) -> item.getExpertiseField().getDisplayOrder())
                        .thenComparingInt(Achiever::getDisplayOrder).thenComparing(Achiever::getFullName)).toList();
    }

    private Map<Long, ExpertiseField> fieldMap() {
        Map<Long, ExpertiseField> result = new LinkedHashMap<>();
        fields().forEach(field -> result.put(field.getId(), field));
        return result;
    }

    private ExpertiseField requireActiveField(Long id) {
        ExpertiseField field = fieldMap().get(id);
        if (field == null || !field.isActive())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select an active expertise field");
        return field;
    }

    private Broadcast require(Long id, String prefix, String message) {
        return repository.findById(id).filter(item -> item.getTitle().startsWith(prefix))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, message));
    }

    private ExpertiseField field(Broadcast item) {
        Map<String, String> values = data(item);
        ExpertiseField field = new ExpertiseField();
        field.setId(item.getId()); field.setName(item.getHostName());
        field.setDescription(values.getOrDefault("summary", ""));
        field.setIconKey(values.getOrDefault("category", "STAR"));
        field.setDisplayOrder(number(values.get("source"), 100));
        field.setActive(item.getStatus() == BroadcastStatus.LIVE || item.getStatus() == BroadcastStatus.DRAFT);
        return field;
    }

    private Achiever achiever(Broadcast item, Map<Long, ExpertiseField> fields) {
        Map<String, String> values = data(item);
        ExpertiseField field;
        try { field = fields.get(Long.parseLong(values.getOrDefault("category", "0"))); }
        catch (NumberFormatException exception) { return null; }
        if (field == null) return null;
        Achiever achiever = new Achiever();
        achiever.setId(item.getId()); achiever.setExpertiseField(field); achiever.setFullName(item.getHostName());
        achiever.setTitle(values.getOrDefault("byline", "")); achiever.setAchievement(values.getOrDefault("summary", ""));
        achiever.setBiography(values.getOrDefault("details", "")); achiever.setImageUrl(emptyToNull(item.getMediaUrl()));
        achiever.setProfileUrl(emptyToNull(values.get("source"))); achiever.setDisplayOrder(number(values.get("url"), 100));
        achiever.setActive(item.getStatus() == BroadcastStatus.LIVE || item.getStatus() == BroadcastStatus.DRAFT);
        achiever.setUpdatedAt(item.getUpdatedAt());
        return achiever;
    }

    private void applyProfile(User user, Broadcast item) {
        Map<String, String> values = item == null ? Map.of() : data(item);
        user.setCurrentPost(emptyToNull(values.get("byline")));
        user.setAddress(emptyToNull(values.get("summary")));
        user.setPosition(emptyToNull(values.get("category")));
        user.setSchool(emptyToNull(values.get("source")));
        user.setCollege(emptyToNull(values.get("url")));
        applyProfileDetails(user, values.get("details"));
        user.setPhotoUrl(item == null ? null : emptyToNull(item.getMediaUrl()));
        user.setProfileCompletion(profileCompletion(user));
    }

    private int profileCompletion(User user) {
        int completed = 0;
        int total = 13;
        if (!blank(user.getFullName())) completed++;
        if (!blank(user.getEmail())) completed++;
        if (!blank(user.getPhoneNumber())) completed++;
        if (!blank(user.getAddress())) completed++;
        if (!blank(user.getPhotoUrl())) completed++;
        if (!blank(user.getCurrentPost()) || !blank(user.getPosition())) completed++;
        if (!blank(user.getSchool())) completed++;
        if (!blank(user.getCollege())) completed++;
        if (!blank(user.getBestAchievement())) completed++;
        if (!blank(user.getProfileCategory())) completed++;
        if (!blank(user.getWorkStatus()) || !blank(user.getEmploymentType())) completed++;
        if (!blank(user.getDateOfBirth())) completed++;
        if (user.getHelpFields() != null && !user.getHelpFields().isEmpty()) completed++;
        return Math.min(100, Math.round(completed * 100f / total));
    }

    private String profileDetails(String bestAchievement, String profileCategory, String workStatus, String employmentType,
            String dateOfBirth, boolean lookingForJob) {
        try {
            Map<String, String> values = new LinkedHashMap<>();
            values.put("bestAchievement", trim(bestAchievement));
            values.put("profileCategory", trim(profileCategory));
            values.put("workStatus", trim(workStatus));
            values.put("employmentType", trim(employmentType));
            values.put("dateOfBirth", trim(dateOfBirth));
            values.put("lookingForJob", Boolean.toString(lookingForJob));
            String json = objectMapper.writeValueAsString(values);
            return json.length() <= 560 ? json : trim(bestAchievement);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile details are invalid", exception);
        }
    }

    private void applyProfileDetails(User user, String details) {
        if (details == null || details.isBlank()) {
            user.setBestAchievement(null);
            user.setProfileCategory(null);
            user.setWorkStatus(null);
            user.setEmploymentType(null);
            user.setDateOfBirth(null);
            user.setLookingForJob(false);
            return;
        }
        try {
            Map<String, String> values = objectMapper.readValue(details, new TypeReference<>() {});
            user.setBestAchievement(emptyToNull(values.get("bestAchievement")));
            user.setProfileCategory(emptyToNull(values.get("profileCategory")));
            user.setWorkStatus(emptyToNull(values.get("workStatus")));
            user.setEmploymentType(emptyToNull(values.get("employmentType")));
            user.setDateOfBirth(emptyToNull(values.get("dateOfBirth")));
            user.setLookingForJob(Boolean.parseBoolean(values.getOrDefault("lookingForJob", "false")));
        } catch (JsonProcessingException exception) {
            user.setBestAchievement(emptyToNull(details));
            user.setProfileCategory(null);
            user.setWorkStatus(null);
            user.setEmploymentType(null);
            user.setDateOfBirth(null);
            user.setLookingForJob(false);
        }
    }

    private Broadcast content(String marker, String hostName, String mediaUrl, BroadcastStatus status) {
        Broadcast item = new Broadcast(); item.setTitle(marker); item.setHostName(hostName);
        item.setMediaUrl(mediaUrl); item.setMediaType(BroadcastMediaType.PODCAST); item.setStatus(status);
        item.setDescription(payload("", "", "", "", "", ""));
        return item;
    }

    private String payload(String byline, String summary, String category, String source, String url, String details) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("byline", byline); values.put("summary", summary); values.put("category", category);
        values.put("source", source); values.put("url", url); values.put("details", details);
        try {
            String json = objectMapper.writeValueAsString(values);
            if (json.length() > 1200) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Directory details are too long");
            return json;
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Directory details are invalid", exception);
        }
    }

    private Map<String, String> data(Broadcast item) {
        try { return objectMapper.readValue(item.getDescription(), new TypeReference<>() {}); }
        catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Directory data is invalid", exception);
        }
    }

    private String slug(String value) {
        String base = value.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (base.length() > 60) base = base.substring(0, 60);
        return base + "-" + UUID.randomUUID();
    }
    private int number(String value, int fallback) { try { return Integer.parseInt(value); } catch (Exception ignored) { return fallback; } }
    private String blankToEmpty(String value) { return value == null ? "" : value.trim(); }
    private String emptyToNull(String value) { return value == null || value.isBlank() ? null : value; }
    private String trim(String value) { return value == null ? "" : value.trim(); }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
