package com.sc.community.service;

import com.sc.community.dto.PublicContentDtos.BroadcastResponse;
import com.sc.community.dto.PublicContentDtos.CreateBroadcastRequest;
import com.sc.community.dto.PublicContentDtos.CreateEventRequest;
import com.sc.community.dto.PublicContentDtos.EventResponse;
import com.sc.community.dto.PublicContentDtos.GalleryImageResponse;
import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.entity.CommunityEvent;
import com.sc.community.entity.EventStatus;
import com.sc.community.entity.EventGalleryImage;
import com.sc.community.repository.BroadcastRepository;
import com.sc.community.repository.CommunityEventRepository;
import com.sc.community.repository.EventGalleryImageRepository;
import jakarta.transaction.Transactional;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicContentService {
    private final CommunityEventRepository eventRepository;
    private final BroadcastRepository broadcastRepository;
    private final EventGalleryImageRepository galleryRepository;
    private final long maxGalleryUploadBytes;

    public PublicContentService(
            CommunityEventRepository eventRepository,
            BroadcastRepository broadcastRepository,
            EventGalleryImageRepository galleryRepository,
            @Value("${app.gallery.max-upload-bytes:8388608}") long maxGalleryUploadBytes) {
        this.eventRepository = eventRepository;
        this.broadcastRepository = broadcastRepository;
        this.galleryRepository = galleryRepository;
        this.maxGalleryUploadBytes = maxGalleryUploadBytes;
    }

    @Transactional
    public List<EventResponse> events() {
        return eventRepository.findAllByOrderByEventAtAsc().stream().map(EventResponse::from).toList();
    }

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        CommunityEvent event = new CommunityEvent();
        event.setTitle(request.title().trim());
        event.setSummary(request.summary().trim());
        event.setVenue(request.venue().trim());
        event.setEventAt(request.eventAt());
        event.setRegistrationUrl(cleanOptional(request.registrationUrl()));
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEventStatus(Long eventId, EventStatus status) {
        CommunityEvent event = findEvent(eventId);
        event.setStatus(status);
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        CommunityEvent event = findEvent(eventId);
        galleryRepository.findAllByEventId(eventId).forEach(image -> image.setEvent(null));
        eventRepository.delete(event);
    }

    @Transactional
    public List<BroadcastResponse> broadcasts() {
        return broadcastRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(broadcast -> !broadcast.getTitle().startsWith(ManagedContentService.PREFIX))
                .map(BroadcastResponse::from).toList();
    }

    @Transactional
    public List<BroadcastResponse> publicBroadcasts() {
        return broadcastRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(broadcast -> !broadcast.getTitle().startsWith(ManagedContentService.PREFIX))
                .filter(broadcast -> broadcast.getStatus() != BroadcastStatus.DRAFT)
                .map(BroadcastResponse::from)
                .toList();
    }

    @Transactional
    public BroadcastResponse createBroadcast(CreateBroadcastRequest request) {
        Broadcast broadcast = new Broadcast();
        broadcast.setTitle(request.title().trim());
        broadcast.setDescription(request.description().trim());
        broadcast.setHostName(request.hostName().trim());
        broadcast.setMediaType(request.mediaType());
        broadcast.setMediaUrl(request.mediaUrl().trim());
        broadcast.setScheduledAt(request.scheduledAt());
        return BroadcastResponse.from(broadcastRepository.save(broadcast));
    }

    @Transactional
    public BroadcastResponse updateBroadcastStatus(Long broadcastId, BroadcastStatus status) {
        Broadcast broadcast = findBroadcast(broadcastId);
        if (status == BroadcastStatus.LIVE) {
            broadcastRepository.findByStatus(BroadcastStatus.LIVE).stream()
                    .filter(item -> !item.getId().equals(broadcastId))
                    .filter(item -> !item.getTitle().startsWith(ManagedContentService.PREFIX))
                    .forEach(item -> item.setStatus(BroadcastStatus.PAUSED));
        }
        broadcast.setStatus(status);
        return BroadcastResponse.from(broadcastRepository.save(broadcast));
    }

    @Transactional
    public void deleteBroadcast(Long broadcastId) {
        broadcastRepository.delete(findBroadcast(broadcastId));
    }

    @Transactional
    public List<GalleryImageResponse> gallery() {
        return galleryRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(image -> !image.getTitle().startsWith(ImageUploadService.POST_IMAGE_PREFIX))
                .map(GalleryImageResponse::from)
                .toList();
    }

    @Transactional
    public GalleryImageResponse uploadGalleryImage(
            MultipartFile file,
            String title,
            String caption,
            Long eventId) {
        if (title == null || title.isBlank() || title.trim().length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo title is required and must be under 160 characters");
        }
        if (caption != null && caption.trim().length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo caption must be under 500 characters");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a JPG or PNG image");
        }
        if (file.getSize() > maxGalleryUploadBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image must be 8 MB or smaller");
        }

        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image could not be read", exception);
        }
        String contentType = detectContentType(data);
        validateDimensions(data);

        EventGalleryImage image = new EventGalleryImage();
        image.setEvent(eventId == null ? null : findEvent(eventId));
        image.setTitle(title.trim());
        image.setCaption(cleanOptional(caption));
        image.setOriginalFileName(cleanFileName(file.getOriginalFilename(), contentType));
        image.setContentType(contentType);
        image.setSizeBytes(data.length);
        image.setImageData(data);
        return GalleryImageResponse.from(galleryRepository.save(image));
    }

    @Transactional
    public GalleryImageData galleryImage(Long imageId) {
        EventGalleryImage image = findGalleryImage(imageId);
        return new GalleryImageData(
                image.getImageData(), image.getContentType(), image.getOriginalFileName(), image.getSizeBytes());
    }

    @Transactional
    public void deleteGalleryImage(Long imageId) {
        galleryRepository.delete(findGalleryImage(imageId));
    }

    private CommunityEvent findEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private Broadcast findBroadcast(Long broadcastId) {
        return broadcastRepository.findById(broadcastId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Broadcast not found"));
    }

    private EventGalleryImage findGalleryImage(Long imageId) {
        return galleryRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gallery image not found"));
    }

    private String detectContentType(byte[] data) {
        boolean jpeg = data.length >= 3
                && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8 && (data[2] & 0xff) == 0xff;
        boolean png = data.length >= 8
                && (data[0] & 0xff) == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47
                && data[4] == 0x0d && data[5] == 0x0a && data[6] == 0x1a && data[7] == 0x0a;
        if (jpeg) return "image/jpeg";
        if (png) return "image/png";
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only valid JPG and PNG images are supported");
    }

    private void validateDimensions(byte[] data) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(data));
            if (image == null) {
                throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Image data is invalid");
            }
            long pixels = (long) image.getWidth() * image.getHeight();
            if (image.getWidth() > 8000 || image.getHeight() > 8000 || pixels > 40_000_000L) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image dimensions are too large");
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Image data is invalid", exception);
        }
    }

    private String cleanFileName(String value, String contentType) {
        String fallback = contentType.equals("image/png") ? "gallery.png" : "gallery.jpg";
        if (value == null || value.isBlank()) return fallback;
        String cleaned = value.replaceAll("[^A-Za-z0-9._-]", "_");
        return cleaned.isBlank() ? fallback : cleaned.substring(0, Math.min(cleaned.length(), 255));
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record GalleryImageData(byte[] data, String contentType, String fileName, long sizeBytes) {
    }
}
