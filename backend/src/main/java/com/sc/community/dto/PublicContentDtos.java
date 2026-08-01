package com.sc.community.dto;

import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastMediaType;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.entity.CommunityEvent;
import com.sc.community.entity.EventStatus;
import com.sc.community.entity.EventGalleryImage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class PublicContentDtos {
    private PublicContentDtos() {
    }

    public record CreateEventRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 1200) String summary,
            @NotBlank @Size(max = 180) String venue,
            @NotNull Instant eventAt,
            @Size(max = 1000) @Pattern(regexp = "^$|https?://.+") String registrationUrl
    ) {
    }

    public record UpdateEventStatusRequest(@NotNull EventStatus status) {
    }

    public record EventResponse(
            Long id,
            String title,
            String summary,
            String venue,
            Instant eventAt,
            String registrationUrl,
            EventStatus status,
            Instant createdAt
    ) {
        public static EventResponse from(CommunityEvent event) {
            return new EventResponse(
                    event.getId(), event.getTitle(), event.getSummary(), event.getVenue(),
                    event.getEventAt(), event.getRegistrationUrl(), event.getStatus(), event.getCreatedAt());
        }
    }

    public record CreateBroadcastRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 1200) String description,
            @NotBlank @Size(max = 120) String hostName,
            @NotNull BroadcastMediaType mediaType,
            @NotBlank @Size(max = 1200) @Pattern(regexp = "https?://.+") String mediaUrl,
            Instant scheduledAt
    ) {
    }

    public record UpdateBroadcastStatusRequest(@NotNull BroadcastStatus status) {
    }

    public record BroadcastResponse(
            Long id,
            String title,
            String description,
            String hostName,
            BroadcastMediaType mediaType,
            String mediaUrl,
            BroadcastStatus status,
            Instant scheduledAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static BroadcastResponse from(Broadcast broadcast) {
            return new BroadcastResponse(
                    broadcast.getId(), broadcast.getTitle(), broadcast.getDescription(), broadcast.getHostName(),
                    broadcast.getMediaType(), broadcast.getMediaUrl(), broadcast.getStatus(),
                    broadcast.getScheduledAt(), broadcast.getCreatedAt(), broadcast.getUpdatedAt());
        }
    }

    public record GalleryImageResponse(
            Long id,
            Long eventId,
            String eventTitle,
            String title,
            String caption,
            String imageUrl,
            String contentType,
            long sizeBytes,
            Instant createdAt
    ) {
        public static GalleryImageResponse from(EventGalleryImage image) {
            CommunityEvent event = image.getEvent();
            return new GalleryImageResponse(
                    image.getId(),
                    event == null ? null : event.getId(),
                    event == null ? null : event.getTitle(),
                    image.getTitle(),
                    image.getCaption(),
                    "/api/public/gallery/" + image.getId() + "/image",
                    image.getContentType(),
                    image.getSizeBytes(),
                    image.getCreatedAt());
        }
    }
}
