package com.sc.community.controller;

import com.sc.community.dto.PublicContentDtos.BroadcastResponse;
import com.sc.community.dto.PublicContentDtos.EventResponse;
import com.sc.community.dto.PublicContentDtos.GalleryImageResponse;
import com.sc.community.service.PublicContentService;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicContentController {
    private final PublicContentService contentService;

    public PublicContentController(PublicContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/events")
    public List<EventResponse> events() {
        return contentService.events();
    }

    @GetMapping("/broadcasts")
    public List<BroadcastResponse> broadcasts() {
        return contentService.publicBroadcasts();
    }

    @GetMapping("/gallery")
    public List<GalleryImageResponse> gallery() {
        return contentService.gallery();
    }

    @GetMapping("/gallery/{imageId}/image")
    public ResponseEntity<byte[]> galleryImage(@PathVariable Long imageId) {
        PublicContentService.GalleryImageData image = contentService.galleryImage(imageId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .contentLength(image.sizeBytes())
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(image.fileName(), StandardCharsets.UTF_8).build().toString())
                .body(image.data());
    }
}
