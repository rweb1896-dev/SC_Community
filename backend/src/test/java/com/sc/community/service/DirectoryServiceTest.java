package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.dto.DirectoryDtos.CreateAchieverRequest;
import com.sc.community.entity.Achiever;
import com.sc.community.entity.ExpertiseField;
import com.sc.community.entity.User;
import com.sc.community.repository.AchieverRepository;
import com.sc.community.repository.ExpertiseFieldRepository;
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
    @Mock private ExpertiseFieldRepository fieldRepository;
    @Mock private AchieverRepository achieverRepository;
    @Mock private UserRepository userRepository;
    @Mock private CurrentUserService currentUserService;

    private DirectoryService service;

    @BeforeEach
    void setUp() {
        service = new DirectoryService(fieldRepository, achieverRepository, userRepository, currentUserService);
    }

    @Test
    void resolvesOnlyActiveFieldsInDisplayOrder() {
        ExpertiseField later = field(2L, "Medicine", 20, true);
        ExpertiseField first = field(1L, "Law", 10, true);
        when(fieldRepository.findAllById(Set.of(1L, 2L))).thenReturn(List.of(later, first));

        var resolved = service.resolveActiveFields(Set.of(1L, 2L));

        assertThat(resolved).extracting(ExpertiseField::getId).containsExactly(1L, 2L);
    }

    @Test
    void rejectsMissingOrDisabledHelpField() {
        when(fieldRepository.findAllById(Set.of(1L, 2L))).thenReturn(List.of(field(1L, "Law", 10, true)));

        assertThatThrownBy(() -> service.resolveActiveFields(Set.of(1L, 2L)))
                .isInstanceOfSatisfying(ResponseStatusException.class, error ->
                        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void updatesCurrentUsersHelpProfile() {
        ExpertiseField law = field(1L, "Law", 10, true);
        User current = new User(); current.setId(9L);
        User stored = new User(); stored.setId(9L); stored.setFullName("Member"); stored.setEmail("member@example.com");
        when(currentUserService.verifiedUser()).thenReturn(current);
        when(userRepository.findById(9L)).thenReturn(Optional.of(stored));
        when(fieldRepository.findAllById(Set.of(1L))).thenReturn(List.of(law));
        when(userRepository.save(stored)).thenReturn(stored);

        var response = service.updateMyHelpFields(Set.of(1L));

        assertThat(response.helpFieldNames()).containsExactly("Law");
        assertThat(response.profileComplete()).isTrue();
        verify(userRepository).save(stored);
    }

    @Test
    void createsAchieverUnderSelectedCategory() {
        ExpertiseField field = field(4L, "Business & Entrepreneurship", 40, true);
        when(fieldRepository.findById(4L)).thenReturn(Optional.of(field));
        when(achieverRepository.save(any(Achiever.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createAchiever(new CreateAchieverRequest(4L, "A Person", "Founder",
                "Built a community business", "Mentors new founders", "", "", 2));

        assertThat(response.expertiseFieldName()).isEqualTo("Business & Entrepreneurship");
        assertThat(response.imageUrl()).isNull();
    }

    private ExpertiseField field(Long id, String name, int displayOrder, boolean active) {
        ExpertiseField field = new ExpertiseField();
        field.setId(id); field.setName(name); field.setDescription(name + " guidance");
        field.setIconKey("STAR"); field.setDisplayOrder(displayOrder); field.setActive(active);
        return field;
    }
}
