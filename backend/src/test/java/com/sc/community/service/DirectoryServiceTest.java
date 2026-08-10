package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastMediaType;
import com.sc.community.entity.BroadcastStatus;
import com.sc.community.entity.User;
import com.sc.community.repository.BroadcastRepository;
import com.sc.community.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DirectoryServiceTest {
    @Mock private BroadcastRepository repository;
    @Mock private UserRepository userRepository;
    @Mock private CurrentUserService currentUserService;
    private DirectoryService service;

    @BeforeEach
    void setUp() {
        service = new DirectoryService(repository, userRepository, currentUserService, new ObjectMapper());
    }

    @Test
    void resolvesOnlyActiveFieldsInDisplayOrder() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                field(2L, "Medicine", 20, true), field(1L, "Law", 10, true)));

        var resolved = service.resolveActiveFields(Set.of(1L, 2L));

        assertThat(resolved).extracting(item -> item.getId()).containsExactly(1L, 2L);
    }

    @Test
    void rejectsDisabledHelpField() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(field(1L, "Law", 10, false)));

        assertThatThrownBy(() -> service.resolveActiveFields(Set.of(1L)))
                .isInstanceOfSatisfying(ResponseStatusException.class, error ->
                        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void updatesCurrentUsersHelpProfileInExistingContentStore() {
        User current = new User(); current.setId(9L);
        User stored = new User(); stored.setId(9L); stored.setFullName("Member"); stored.setEmail("member@example.com");
        when(currentUserService.verifiedUser()).thenReturn(current);
        when(userRepository.findById(9L)).thenReturn(Optional.of(stored));
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(field(1L, "Law", 10, true)));
        when(repository.save(any(Broadcast.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.updateMyHelpFields(Set.of(1L));

        assertThat(response.helpFieldNames()).containsExactly("Law");
        assertThat(response.profileComplete()).isTrue();
        verify(repository).save(any(Broadcast.class));
    }

    private Broadcast field(Long id, String name, int order, boolean active) {
        Broadcast item = new Broadcast(); item.setId(id);
        item.setTitle(ManagedContentService.PREFIX + "EXPERTISE:" + name.toLowerCase());
        item.setHostName(name); item.setMediaUrl(""); item.setMediaType(BroadcastMediaType.PODCAST);
        item.setStatus(active ? BroadcastStatus.LIVE : BroadcastStatus.PAUSED);
        item.setDescription("{\"byline\":\"\",\"summary\":\"Guidance\",\"category\":\"STAR\",\"source\":\"" + order + "\",\"url\":\"\",\"details\":\"\"}");
        return item;
    }
}
