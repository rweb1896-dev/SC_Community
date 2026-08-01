package com.sc.community.repository;

import com.sc.community.entity.EventGalleryImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventGalleryImageRepository extends JpaRepository<EventGalleryImage, Long> {
    List<EventGalleryImage> findAllByOrderByCreatedAtDesc();
    List<EventGalleryImage> findAllByEventId(Long eventId);
}
