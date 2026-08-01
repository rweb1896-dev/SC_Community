package com.sc.community.controller;

import com.sc.community.dto.PublicContentDtos.BroadcastResponse;
import com.sc.community.dto.PublicContentDtos.CreateBroadcastRequest;
import com.sc.community.dto.PublicContentDtos.CreateEventRequest;
import com.sc.community.dto.PublicContentDtos.EventResponse;
import com.sc.community.dto.PublicContentDtos.GalleryImageResponse;
import com.sc.community.dto.PublicContentDtos.UpdateBroadcastStatusRequest;
import com.sc.community.dto.PublicContentDtos.UpdateEventStatusRequest;
import com.sc.community.service.PublicContentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/content")
public class AdminPublicContentController {
    private final PublicContentService contentService;

    public AdminPublicContentController(PublicContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/events")
    public List<EventResponse> events() {
        return contentService.events();
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@Valid @RequestBody CreateEventRequest request) {
        return contentService.createEvent(request);
    }

    @PatchMapping("/events/{eventId}/status")
    public EventResponse eventStatus(
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateEventStatusRequest request) {
        return contentService.updateEventStatus(eventId, request.status());
    }

    @DeleteMapping("/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long eventId) {
        contentService.deleteEvent(eventId);
    }

    @GetMapping("/broadcasts")
    public List<BroadcastResponse> broadcasts() {
        return contentService.broadcasts();
    }

    @PostMapping("/broadcasts")
    @ResponseStatus(HttpStatus.CREATED)
    public BroadcastResponse createBroadcast(@Valid @RequestBody CreateBroadcastRequest request) {
        return contentService.createBroadcast(request);
    }

    @PatchMapping("/broadcasts/{broadcastId}/status")
    public BroadcastResponse broadcastStatus(
            @PathVariable Long broadcastId,
            @Valid @RequestBody UpdateBroadcastStatusRequest request) {
        return contentService.updateBroadcastStatus(broadcastId, request.status());
    }

    @DeleteMapping("/broadcasts/{broadcastId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBroadcast(@PathVariable Long broadcastId) {
        contentService.deleteBroadcast(broadcastId);
    }

    @GetMapping("/gallery")
    public List<GalleryImageResponse> gallery() {
        return contentService.gallery();
    }

    @PostMapping(value = "/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GalleryImageResponse uploadGalleryImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) Long eventId) {
        return contentService.uploadGalleryImage(file, title, caption, eventId);
    }

    @DeleteMapping("/gallery/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGalleryImage(@PathVariable Long imageId) {
        contentService.deleteGalleryImage(imageId);
    }
}
