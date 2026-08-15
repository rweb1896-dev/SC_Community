package com.sc.community.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sc.community.dto.CommunitySpaceDtos.BlogResponse;
import com.sc.community.dto.CommunitySpaceDtos.SaveBlogRequest;
import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastMediaType;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.entity.User;
import com.sc.community.repository.BroadcastRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MemberBlogService {
    private final BroadcastRepository broadcasts;
    private final CurrentUserService current;
    private final ObjectMapper objectMapper;

    public MemberBlogService(BroadcastRepository broadcasts, CurrentUserService current, ObjectMapper objectMapper) {
        this.broadcasts = broadcasts;
        this.current = current;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<BlogResponse> list(boolean onlyMine) {
        User user = current.verifiedUser();
        return broadcasts.findAllByOrderByCreatedAtDesc().stream()
                .filter(item -> CommunitySpaceMarkers.isBlogMarker(item.getTitle()))
                .filter(item -> item.getStatus() == BroadcastStatus.LIVE)
                .filter(item -> !onlyMine || ownerId(item).equals(user.getId()))
                .map(item -> response(item, user.getId())).toList();
    }

    @Transactional
    public BlogResponse create(SaveBlogRequest request) {
        User user = current.verifiedUser();
        Broadcast blog = new Broadcast();
        blog.setTitle(CommunitySpaceMarkers.BLOG_PREFIX + UUID.randomUUID());
        blog.setHostName(user.getId().toString());
        blog.setDescription(payload(request.title(), request.body()));
        blog.setMediaUrl(clean(request.imageUrl()));
        blog.setMediaType(BroadcastMediaType.PODCAST);
        blog.setStatus(BroadcastStatus.LIVE);
        return response(broadcasts.save(blog), user.getId());
    }

    @Transactional
    public BlogResponse update(Long blogId, SaveBlogRequest request) {
        User user = current.verifiedUser();
        Broadcast blog = require(blogId);
        requireOwner(blog, user);
        if (blog.getStatus() != BroadcastStatus.LIVE) {
            throw new ResponseStatusException(HttpStatus.GONE, "This blog is no longer available for editing");
        }
        blog.setDescription(payload(request.title(), request.body()));
        blog.setMediaUrl(clean(request.imageUrl()));
        return response(broadcasts.save(blog), user.getId());
    }

    @Transactional
    public void delete(Long blogId) {
        User user = current.verifiedUser();
        Broadcast blog = require(blogId);
        requireOwner(blog, user);
        blog.setStatus(BroadcastStatus.ENDED);
        broadcasts.save(blog);
    }

    private BlogResponse response(Broadcast blog, Long viewerId) {
        Map<String, String> content = content(blog);
        Long owner = ownerId(blog);
        boolean mine = owner.equals(viewerId);
        return new BlogResponse(blog.getId(), mine, mine ? "You" : "Member #" + owner,
                content.getOrDefault("title", "Untitled"), content.getOrDefault("body", ""),
                emptyToNull(blog.getMediaUrl()), blog.getCreatedAt(), blog.getUpdatedAt());
    }

    private Broadcast require(Long blogId) {
        Broadcast blog = broadcasts.findById(blogId)
                .filter(item -> CommunitySpaceMarkers.isBlogMarker(item.getTitle()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found"));
        return blog;
    }

    private void requireOwner(Broadcast blog, User user) {
        if (!ownerId(blog).equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the blog author can change this blog");
        }
    }

    private Long ownerId(Broadcast blog) {
        try {
            return Long.parseLong(blog.getHostName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blog owner is invalid");
        }
    }

    private String payload(String title, String body) {
        try {
            return objectMapper.writeValueAsString(Map.of("title", title.trim(), "body", body.trim()));
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blog text is invalid", exception);
        }
    }

    private Map<String, String> content(Broadcast blog) {
        try {
            return objectMapper.readValue(blog.getDescription(), new TypeReference<>() { });
        } catch (JsonProcessingException exception) {
            return Map.of("title", "Untitled", "body", "");
        }
    }

    private String clean(String value) { return value == null ? "" : value.trim(); }
    private String emptyToNull(String value) { return value == null || value.isBlank() ? null : value; }
}
