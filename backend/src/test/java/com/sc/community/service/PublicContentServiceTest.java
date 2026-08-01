package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.entity.CommunityEvent;
import com.sc.community.entity.EventGalleryImage;
import com.sc.community.repository.BroadcastRepository;
import com.sc.community.repository.CommunityEventRepository;
import com.sc.community.repository.EventGalleryImageRepository;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PublicContentServiceTest {
    @Mock private CommunityEventRepository eventRepository;
    @Mock private BroadcastRepository broadcastRepository;
    @Mock private EventGalleryImageRepository galleryRepository;

    private PublicContentService service;

    @BeforeEach
    void setUp() {
        service = new PublicContentService(eventRepository, broadcastRepository, galleryRepository, 8 * 1024 * 1024);
    }

    @Test
    void uploadsValidatedPngAndLinksItToAnEvent() throws Exception {
        CommunityEvent event = event(17L, "Rights workshop");
        when(eventRepository.findById(17L)).thenReturn(Optional.of(event));
        when(galleryRepository.save(any(EventGalleryImage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file", "workshop.png", "image/png", validPng());
        var response = service.uploadGalleryImage(file, "Workshop participants", "Opening session", 17L);

        assertThat(response.title()).isEqualTo("Workshop participants");
        assertThat(response.eventId()).isEqualTo(17L);
        assertThat(response.contentType()).isEqualTo("image/png");
        assertThat(response.sizeBytes()).isPositive();
        verify(galleryRepository).save(any(EventGalleryImage.class));
    }

    @Test
    void rejectsFilesWhoseBytesAreNotAnImage() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.jpg", "image/jpeg", "not an image".getBytes());

        assertThatThrownBy(() -> service.uploadGalleryImage(file, "Invalid", null, null))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE));
    }

    @Test
    void deletingAnEventKeepsItsGalleryPhotos() {
        CommunityEvent event = event(9L, "Community meeting");
        EventGalleryImage image = new EventGalleryImage();
        image.setEvent(event);
        when(eventRepository.findById(9L)).thenReturn(Optional.of(event));
        when(galleryRepository.findAllByEventId(9L)).thenReturn(List.of(image));

        service.deleteEvent(9L);

        assertThat(image.getEvent()).isNull();
        verify(eventRepository).delete(event);
    }

    private CommunityEvent event(Long id, String title) {
        CommunityEvent event = new CommunityEvent();
        event.setId(id);
        event.setTitle(title);
        event.setSummary("Summary");
        event.setVenue("Venue");
        event.setEventAt(Instant.now());
        return event;
    }

    private byte[] validPng() throws Exception {
        BufferedImage image = new BufferedImage(12, 12, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
