package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.entity.EventGalleryImage;
import com.sc.community.repository.EventGalleryImageRepository;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ImageUploadServiceTest {
    @Mock private EventGalleryImageRepository repository;
    @Mock private CurrentUserService currentUserService;
    private ImageUploadService service;

    @BeforeEach
    void setUp() { service = new ImageUploadService(repository, currentUserService, 5 * 1024 * 1024); }

    @Test
    void acceptsVerifiedPngAndReturnsInternalUrl() throws Exception {
        when(repository.save(any(EventGalleryImage.class))).thenAnswer(invocation -> {
            EventGalleryImage image = invocation.getArgument(0);
            ReflectionTestUtils.setField(image, "id", 42L);
            return image;
        });
        var file = new MockMultipartFile("file", "photo.png", "image/png", validPng());

        var response = service.upload(file);

        assertThat(response.imageUrl()).isEqualTo("/api/public/gallery/42/image");
        assertThat(response.contentType()).isEqualTo("image/png");
        verify(currentUserService).verifiedUser();
        verify(repository).save(any(EventGalleryImage.class));
    }

    @Test
    void rejectsSpoofedImageContent() {
        var file = new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes());
        assertThatThrownBy(() -> service.upload(file))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE));
    }

    @Test
    void rejectsOversizedPayloadBeforeStorage() {
        var file = new MockMultipartFile("file", "large.jpg", "image/jpeg", new byte[101]);
        ImageUploadService smallLimitService = new ImageUploadService(repository, currentUserService, 100);
        assertThatThrownBy(() -> smallLimitService.upload(file))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
    }

    private byte[] validPng() throws Exception {
        BufferedImage image = new BufferedImage(12, 12, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
