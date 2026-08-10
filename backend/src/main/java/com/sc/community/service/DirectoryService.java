package com.sc.community.service;

import com.sc.community.dto.DirectoryDtos.AchieverResponse;
import com.sc.community.dto.DirectoryDtos.CreateAchieverRequest;
import com.sc.community.dto.DirectoryDtos.CreateExpertiseFieldRequest;
import com.sc.community.dto.DirectoryDtos.ExpertiseFieldResponse;
import com.sc.community.dto.UserResponse;
import com.sc.community.entity.Achiever;
import com.sc.community.entity.ExpertiseField;
import com.sc.community.entity.User;
import com.sc.community.repository.AchieverRepository;
import com.sc.community.repository.ExpertiseFieldRepository;
import com.sc.community.repository.UserRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DirectoryService {
    private final ExpertiseFieldRepository fieldRepository;
    private final AchieverRepository achieverRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public DirectoryService(ExpertiseFieldRepository fieldRepository, AchieverRepository achieverRepository,
            UserRepository userRepository, CurrentUserService currentUserService) {
        this.fieldRepository = fieldRepository;
        this.achieverRepository = achieverRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<ExpertiseFieldResponse> publicFields() {
        return fieldRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(ExpertiseFieldResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ExpertiseFieldResponse> adminFields() {
        return fieldRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(ExpertiseFieldResponse::from).toList();
    }

    @Transactional
    public ExpertiseFieldResponse createField(CreateExpertiseFieldRequest request) {
        fieldRepository.findByNameIgnoreCase(request.name().trim()).ifPresent(field -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An expertise field with this name already exists");
        });
        ExpertiseField field = new ExpertiseField();
        field.setName(request.name().trim());
        field.setDescription(request.description().trim());
        field.setIconKey(request.iconKey().trim().toUpperCase());
        field.setDisplayOrder(request.displayOrder());
        field.setActive(true);
        return ExpertiseFieldResponse.from(fieldRepository.save(field));
    }

    @Transactional
    public ExpertiseFieldResponse setFieldActive(Long fieldId, boolean active) {
        ExpertiseField field = requireField(fieldId);
        field.setActive(active);
        return ExpertiseFieldResponse.from(fieldRepository.save(field));
    }

    @Transactional(readOnly = true)
    public List<AchieverResponse> publicAchievers() {
        return achieverRepository
                .findByActiveTrueAndExpertiseFieldActiveTrueOrderByExpertiseFieldDisplayOrderAscDisplayOrderAscFullNameAsc()
                .stream().map(AchieverResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AchieverResponse> adminAchievers() {
        return achieverRepository.findAllByOrderByDisplayOrderAscFullNameAsc().stream()
                .map(AchieverResponse::from).toList();
    }

    @Transactional
    public AchieverResponse createAchiever(CreateAchieverRequest request) {
        ExpertiseField field = requireField(request.expertiseFieldId());
        Achiever achiever = new Achiever();
        achiever.setExpertiseField(field);
        achiever.setFullName(request.fullName().trim());
        achiever.setTitle(request.title().trim());
        achiever.setAchievement(request.achievement().trim());
        achiever.setBiography(request.biography().trim());
        achiever.setImageUrl(blankToNull(request.imageUrl()));
        achiever.setProfileUrl(blankToNull(request.profileUrl()));
        achiever.setDisplayOrder(request.displayOrder());
        achiever.setActive(true);
        return AchieverResponse.from(achieverRepository.save(achiever));
    }

    @Transactional
    public AchieverResponse setAchieverActive(Long achieverId, boolean active) {
        Achiever achiever = requireAchiever(achieverId);
        achiever.setActive(active);
        return AchieverResponse.from(achieverRepository.save(achiever));
    }

    @Transactional
    public void deleteAchiever(Long achieverId) {
        achieverRepository.delete(requireAchiever(achieverId));
    }

    @Transactional
    public UserResponse updateMyHelpFields(Set<Long> fieldIds) {
        User current = currentUserService.verifiedUser();
        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setHelpFields(resolveActiveFields(fieldIds));
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public LinkedHashSet<ExpertiseField> resolveActiveFields(Set<Long> fieldIds) {
        if (fieldIds == null || fieldIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one field where you can help");
        }
        if (fieldIds.size() > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select no more than 8 fields");
        }
        List<ExpertiseField> fields = fieldRepository.findAllById(fieldIds).stream().filter(ExpertiseField::isActive).toList();
        if (fields.size() != fieldIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected expertise fields are unavailable");
        }
        fields = fields.stream().sorted((a, b) -> {
            int order = Integer.compare(a.getDisplayOrder(), b.getDisplayOrder());
            return order != 0 ? order : a.getName().compareToIgnoreCase(b.getName());
        }).toList();
        return new LinkedHashSet<>(fields);
    }

    private ExpertiseField requireField(Long fieldId) {
        return fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expertise field not found"));
    }

    private Achiever requireAchiever(Long achieverId) {
        return achieverRepository.findById(achieverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Achiever not found"));
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
