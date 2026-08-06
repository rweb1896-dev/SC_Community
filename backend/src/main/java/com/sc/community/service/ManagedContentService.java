package com.sc.community.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sc.community.dto.ManagedContentDtos.ManagedContentResponse;
import com.sc.community.dto.ManagedContentDtos.SaveManagedContentRequest;
import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastMediaType;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.repository.BroadcastRepository;
import jakarta.transaction.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ManagedContentService {
    public static final String PREFIX = "__SC_MANAGED__:";
    private final BroadcastRepository repository;
    private final ObjectMapper objectMapper;

    public ManagedContentService(BroadcastRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<ManagedContentResponse> all() {
        return repository.findAllByOrderByCreatedAtDesc().stream().filter(this::isManaged).map(this::response).toList();
    }

    @Transactional
    public ManagedContentResponse save(SaveManagedContentRequest request) {
        String marker = PREFIX + request.type() + ":" + request.key();
        Broadcast item = repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(candidate -> marker.equals(candidate.getTitle())).findFirst().orElseGet(Broadcast::new);
        item.setTitle(marker);
        item.setHostName(request.title().trim());
        item.setMediaUrl(request.imageUrl().trim());
        item.setMediaType(request.type().equals("LEADER") ? BroadcastMediaType.VIDEO : BroadcastMediaType.PODCAST);
        item.setDescription(payload(request));
        if (item.getId() == null) item.setStatus(BroadcastStatus.LIVE);
        return response(repository.save(item));
    }

    @Transactional
    public ManagedContentResponse status(Long recordId, String status) {
        Broadcast item = find(recordId);
        item.setStatus(switch (status) {
            case "ACTIVE" -> BroadcastStatus.LIVE;
            case "BLOCKED" -> BroadcastStatus.PAUSED;
            case "REMOVED" -> BroadcastStatus.ENDED;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown content status");
        });
        return response(repository.save(item));
    }

    public boolean isManaged(Broadcast item) {
        return item.getTitle() != null && item.getTitle().startsWith(PREFIX);
    }

    private Broadcast find(Long id) {
        return repository.findById(id).filter(this::isManaged)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Managed content not found"));
    }

    private String payload(SaveManagedContentRequest request) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("byline", request.byline().trim());
        values.put("summary", request.summary().trim());
        values.put("category", request.category().trim());
        values.put("source", clean(request.source()));
        values.put("url", clean(request.url()));
        values.put("details", clean(request.details()));
        try {
            String json = objectMapper.writeValueAsString(values);
            if (json.length() > 1200) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content details are too long");
            return json;
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content details are invalid", exception);
        }
    }

    private ManagedContentResponse response(Broadcast item) {
        String[] marker = item.getTitle().substring(PREFIX.length()).split(":", 2);
        if (marker.length != 2) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Managed content marker is invalid");
        try {
            Map<String, String> values = objectMapper.readValue(item.getDescription(), new TypeReference<>() {});
            return new ManagedContentResponse(item.getId(), marker[0], marker[1], status(item.getStatus()),
                    item.getHostName(), values.getOrDefault("byline", ""), values.getOrDefault("summary", ""),
                    values.getOrDefault("category", ""), values.getOrDefault("source", ""),
                    values.getOrDefault("url", ""), item.getMediaUrl(), values.getOrDefault("details", ""), item.getUpdatedAt());
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Managed content data is invalid", exception);
        }
    }

    private String status(BroadcastStatus status) {
        return switch (status) {
            case LIVE, DRAFT -> "ACTIVE";
            case PAUSED -> "BLOCKED";
            case ENDED -> "REMOVED";
        };
    }

    private String clean(String value) { return value == null ? "" : value.trim(); }
}
