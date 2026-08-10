package com.sc.community.controller;

import com.sc.community.dto.DirectoryDtos.AchieverResponse;
import com.sc.community.dto.DirectoryDtos.ExpertiseFieldResponse;
import com.sc.community.service.DirectoryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class DirectoryController {
    private final DirectoryService directoryService;

    public DirectoryController(DirectoryService directoryService) { this.directoryService = directoryService; }

    @GetMapping("/expertise-fields")
    public List<ExpertiseFieldResponse> expertiseFields() { return directoryService.publicFields(); }

    @GetMapping("/achievers")
    public List<AchieverResponse> achievers() { return directoryService.publicAchievers(); }
}
