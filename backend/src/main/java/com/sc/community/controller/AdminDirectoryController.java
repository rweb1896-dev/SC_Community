package com.sc.community.controller;

import com.sc.community.dto.DirectoryDtos.AchieverResponse;
import com.sc.community.dto.DirectoryDtos.CreateAchieverRequest;
import com.sc.community.dto.DirectoryDtos.CreateExpertiseFieldRequest;
import com.sc.community.dto.DirectoryDtos.ExpertiseFieldResponse;
import com.sc.community.dto.DirectoryDtos.UpdateActiveRequest;
import com.sc.community.service.DirectoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/directory")
public class AdminDirectoryController {
    private final DirectoryService directoryService;

    public AdminDirectoryController(DirectoryService directoryService) { this.directoryService = directoryService; }

    @GetMapping("/expertise-fields")
    public List<ExpertiseFieldResponse> fields() { return directoryService.adminFields(); }

    @PostMapping("/expertise-fields")
    public ExpertiseFieldResponse createField(@Valid @RequestBody CreateExpertiseFieldRequest request) {
        return directoryService.createField(request);
    }

    @PatchMapping("/expertise-fields/{fieldId}/active")
    public ExpertiseFieldResponse setFieldActive(@PathVariable Long fieldId,
            @RequestBody UpdateActiveRequest request) {
        return directoryService.setFieldActive(fieldId, request.active());
    }

    @GetMapping("/achievers")
    public List<AchieverResponse> achievers() { return directoryService.adminAchievers(); }

    @PostMapping("/achievers")
    public AchieverResponse createAchiever(@Valid @RequestBody CreateAchieverRequest request) {
        return directoryService.createAchiever(request);
    }

    @PatchMapping("/achievers/{achieverId}/active")
    public AchieverResponse setAchieverActive(@PathVariable Long achieverId,
            @RequestBody UpdateActiveRequest request) {
        return directoryService.setAchieverActive(achieverId, request.active());
    }

    @DeleteMapping("/achievers/{achieverId}")
    public void deleteAchiever(@PathVariable Long achieverId) { directoryService.deleteAchiever(achieverId); }
}
