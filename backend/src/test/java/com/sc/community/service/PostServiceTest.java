package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.entity.Category;
import com.sc.community.entity.Post;
import com.sc.community.entity.User;
import com.sc.community.entity.UserStatus;
import com.sc.community.repository.CategoryRepository;
import com.sc.community.repository.CommentRepository;
import com.sc.community.repository.PostRepository;
import com.sc.community.repository.ReportRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {
    @Mock private PostRepository postRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private ReportRepository reportRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    private PostService service;
    private User user;
    private Post post;

    @BeforeEach
    void setUp() {
        service = new PostService(postRepository, categoryRepository, commentRepository, currentUserService, reportRepository, messagingTemplate);
        user = new User(); user.setId(7L); user.setFullName("Verified Member"); user.setStatus(UserStatus.VERIFIED);
        Category category = new Category(); category.setId(3L); category.setName("Health Help");
        post = new Post(); post.setId(11L); post.setUser(user); post.setCategory(category); post.setContent("Useful update"); post.setCreatedAt(Instant.now());
    }

    @Test
    void feedReturnsPersistedEngagementCounts() {
        when(currentUserService.currentUser()).thenReturn(user);
        when(postRepository.findByStatusOrderByCreatedAtDesc(any())).thenReturn(List.of(post));
        when(reportRepository.countGroupedByPostIdsAndReason(List.of(11L), "__SUPPORT__"))
                .thenReturn(List.<Object[]>of(new Object[] {11L, 4L}));
        when(commentRepository.countGroupedByPostIds(List.of(11L)))
                .thenReturn(List.<Object[]>of(new Object[] {11L, 2L}));
        when(reportRepository.supportedPostIds(List.of(11L), 7L, "__SUPPORT__")).thenReturn(List.of(11L));

        var response = service.feed(null).get(0);

        assertThat(response.supportCount()).isEqualTo(4);
        assertThat(response.commentCount()).isEqualTo(2);
        assertThat(response.supportedByCurrentUser()).isTrue();
    }

    @Test
    void supportToggleCreatesOnePersistentSupportAndPublishesUpdate() {
        when(currentUserService.verifiedUser()).thenReturn(user);
        when(postRepository.findById(11L)).thenReturn(Optional.of(post));
        when(reportRepository.findByPostIdAndReportedByUserIdAndReason(11L, 7L, "__SUPPORT__")).thenReturn(Optional.empty());
        when(reportRepository.countByPostIdAndReason(11L, "__SUPPORT__")).thenReturn(1L);

        var response = service.toggleSupport(11L);

        assertThat(response.supported()).isTrue();
        assertThat(response.supportCount()).isEqualTo(1);
        verify(reportRepository).save(any());
        verify(messagingTemplate).convertAndSend(org.mockito.ArgumentMatchers.eq("/topic/feed"), any(Object.class));
    }
}
