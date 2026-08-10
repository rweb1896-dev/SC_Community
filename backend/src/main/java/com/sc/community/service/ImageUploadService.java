package com.sc.community.service;

import com.sc.community.dto.UploadDtos.ImageUploadResponse;
import com.sc.community.entity.EventGalleryImage;
import com.sc.community.repository.EventGalleryImageRepository;
import jakarta.transaction.Transactional;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ImageUploadService {
    public static final String POST_IMAGE_PREFIX = "__POST_IMAGE__:";
    private final EventGalleryImageRepository repository;
    private final CurrentUserService currentUserService;
    private final long maxBytes;

    public ImageUploadService(EventGalleryImageRepository repository, CurrentUserService currentUserService,
            @Value("${app.post-image.max-upload-bytes:5242880}") long maxBytes) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.maxBytes = maxBytes;
    }

    @Transactional
    public ImageUploadResponse upload(MultipartFile file) {
        currentUserService.verifiedUser();
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a JPG or PNG image");
        }
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image must be 5 MB or smaller");
        }
        byte[] data;
        try { data = file.getBytes(); }
        catch (IOException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image could not be read", exception); }
        String contentType = detect(data);
        validateDimensions(data);

        EventGalleryImage image = new EventGalleryImage();
        image.setTitle(POST_IMAGE_PREFIX + UUID.randomUUID());
        image.setOriginalFileName(contentType.equals("image/png") ? "post.png" : "post.jpg");
        image.setContentType(contentType);
        image.setSizeBytes(data.length);
        image.setImageData(data);
        EventGalleryImage saved = repository.save(image);
        return new ImageUploadResponse("/api/public/gallery/" + saved.getId() + "/image", contentType, data.length);
    }

    private String detect(byte[] data) {
        boolean jpeg = data.length >= 3 && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8 && (data[2] & 0xff) == 0xff;
        boolean png = data.length >= 8 && (data[0] & 0xff) == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47
                && data[4] == 0x0d && data[5] == 0x0a && data[6] == 0x1a && data[7] == 0x0a;
        if (jpeg) return "image/jpeg";
        if (png) return "image/png";
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only valid JPG and PNG images are supported");
    }

    private void validateDimensions(byte[] data) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(data));
            if (image == null || image.getWidth() > 6000 || image.getHeight() > 6000
                    || (long) image.getWidth() * image.getHeight() > 25_000_000L) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image dimensions are too large");
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Image data is invalid", exception);
        }
    }
}
