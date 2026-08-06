package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sc.community.dto.ManagedContentDtos.SaveManagedContentRequest;
import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.repository.BroadcastRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ManagedContentServiceTest {
    @Mock private BroadcastRepository repository;
    private ManagedContentService service;

    @BeforeEach
    void setUp() { service = new ManagedContentService(repository, new ObjectMapper()); }

    @Test
    void storesLeaderInsideNamespacedExistingBroadcastRecord() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(repository.save(any(Broadcast.class))).thenAnswer(invocation -> {
            Broadcast item = invocation.getArgument(0); item.setId(41L); return item;
        });
        var response = service.save(new SaveManagedContentRequest("LEADER", "new-leader", "New Leader",
                "Community organiser", "Built a durable learning network.", "CURRENT", "Education",
                "https://example.com/source", "https://example.com/photo.jpg", "Profile overview"));
        assertThat(response.type()).isEqualTo("LEADER");
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.title()).isEqualTo("New Leader");
    }

    @Test
    void contentCanBeBlockedAndRestoredWithoutDeletion() {
        Broadcast item = managed(41L);
        when(repository.findById(41L)).thenReturn(Optional.of(item));
        when(repository.save(item)).thenReturn(item);
        assertThat(service.status(41L, "BLOCKED").status()).isEqualTo("BLOCKED");
        assertThat(service.status(41L, "ACTIVE").status()).isEqualTo("ACTIVE");
    }

    private Broadcast managed(Long id) {
        Broadcast item = new Broadcast(); item.setId(id); item.setTitle("__SC_MANAGED__:BOOK:test");
        item.setHostName("Test"); item.setDescription("{\"byline\":\"Author\",\"summary\":\"Summary\",\"category\":\"FREE\",\"source\":\"English\",\"url\":\"https://example.com/test.pdf\",\"details\":\"Source\"}");
        item.setMediaUrl("/favicon.svg"); item.setStatus(BroadcastStatus.LIVE); return item;
    }
}
