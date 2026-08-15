package com.sc.community.service;

import com.sc.community.dto.CommentDtos.CommentResponse;
import com.sc.community.dto.CommentDtos.CreateCommentRequest;
import com.sc.community.dto.PostDtos.CreatePostRequest;
import com.sc.community.dto.PostDtos.PostResponse;
import com.sc.community.dto.PostDtos.SupportResponse;
import com.sc.community.dto.PostDtos.FeedEvent;
import com.sc.community.dto.PostDtos.UpdatePostRequest;
import com.sc.community.entity.Category;
import com.sc.community.entity.Comment;
import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import com.sc.community.entity.User;
import com.sc.community.entity.Report;
import com.sc.community.repository.CategoryRepository;
import com.sc.community.repository.CommentRepository;
import com.sc.community.repository.PostRepository;
import com.sc.community.repository.ReportRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final CurrentUserService currentUserService;
    private final ReportRepository reportRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final HelpChatService helpChatService;
    private static final String SUPPORT_REASON = "__SUPPORT__";

    public PostService(PostRepository postRepository, CategoryRepository categoryRepository,
            CommentRepository commentRepository, CurrentUserService currentUserService,
            ReportRepository reportRepository, SimpMessagingTemplate messagingTemplate, HelpChatService helpChatService) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.commentRepository = commentRepository;
        this.currentUserService = currentUserService;
        this.reportRepository = reportRepository;
        this.messagingTemplate = messagingTemplate;
        this.helpChatService = helpChatService;
    }

    @Transactional
    public List<PostResponse> feed(Long categoryId) {
        List<Post> posts = categoryId == null
                ? postRepository.findByStatusOrderByCreatedAtDesc(PostStatus.ACTIVE)
                : postRepository.findByCategoryIdAndStatusOrderByCreatedAtDesc(categoryId, PostStatus.ACTIVE);
        posts = posts.stream().filter(post -> !CommunitySpaceMarkers.isDebateContent(post.getContent())).toList();
        if (posts.isEmpty()) return List.of();
        Long currentUserId = currentUserService.currentUser().getId();
        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, Long> supportCounts = counts(reportRepository.countGroupedByPostIdsAndReason(postIds, SUPPORT_REASON));
        Map<Long, Long> commentCounts = counts(commentRepository.countGroupedByPostIds(postIds));
        Set<Long> supportedIds = Set.copyOf(reportRepository.supportedPostIds(postIds, currentUserId, SUPPORT_REASON));
        return posts.stream().map(post -> PostResponse.from(post,
                supportCounts.getOrDefault(post.getId(), 0L),
                commentCounts.getOrDefault(post.getId(), 0L),
                supportedIds.contains(post.getId()))).toList();
    }

    @Transactional
    public PostResponse create(CreatePostRequest request) {
        User user = currentUserService.verifiedUser();
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        Post post = new Post();
        post.setUser(user);
        post.setCategory(category);
        post.setContent(request.content().trim());
        post.setImageUrl(cleanOptional(request.imageUrl()));
        Post saved = postRepository.save(post);
        helpChatService.notifyNewPost(saved);
        publish("POST_CREATED", saved.getId());
        return response(saved, user.getId());
    }

    @Transactional
    public PostResponse update(Long postId, UpdatePostRequest request) {
        User user = currentUserService.verifiedUser();
        Post post = postRepository.findLockedById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (!post.getUser().getId().equals(user.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the post creator can edit this post");
        if (post.getStatus() != PostStatus.ACTIVE)
            throw new ResponseStatusException(HttpStatus.GONE, "Closed posts cannot be edited");
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        post.setCategory(category); post.setContent(request.content().trim()); post.setImageUrl(cleanOptional(request.imageUrl()));
        publish("POST_UPDATED", postId);
        return response(post, user.getId());
    }

    @Transactional
    public void delete(Long postId) {
        helpChatService.deletePost(postId);
        publish("POST_REMOVED", postId);
    }

    @Transactional
    public List<CommentResponse> comments(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        boolean anonymous = CommunitySpaceMarkers.isDebateContent(post.getContent());
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(comment -> anonymous ? CommentResponse.anonymous(comment) : CommentResponse.from(comment)).toList();
    }

    @Transactional
    public CommentResponse comment(Long postId, CreateCommentRequest request) {
        User user = currentUserService.verifiedUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Comments are disabled for this post");
        }
        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setCommentText(request.commentText());
        Comment saved = commentRepository.save(comment);
        publish("COMMENT_CREATED", postId);
        return CommentResponse.from(saved);
    }

    @Transactional
    public SupportResponse toggleSupport(Long postId) {
        User user = currentUserService.verifiedUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Support is disabled for this post");
        }
        var existing = reportRepository.findByPostIdAndReportedByUserIdAndReason(postId, user.getId(), SUPPORT_REASON);
        boolean supported;
        if (existing.isPresent()) {
            reportRepository.delete(existing.get());
            supported = false;
        } else {
            Report support = new Report();
            support.setPost(post);
            support.setReportedByUser(user);
            support.setReason(SUPPORT_REASON);
            reportRepository.save(support);
            supported = true;
        }
        long count = reportRepository.countByPostIdAndReason(postId, SUPPORT_REASON);
        publish("SUPPORT_UPDATED", postId);
        return new SupportResponse(postId, count, supported);
    }

    private PostResponse response(Post post, Long currentUserId) {
        return PostResponse.from(post,
                reportRepository.countByPostIdAndReason(post.getId(), SUPPORT_REASON),
                commentRepository.countByPostId(post.getId()),
                reportRepository.existsByPostIdAndReportedByUserIdAndReason(post.getId(), currentUserId, SUPPORT_REASON));
    }

    private Map<Long, Long> counts(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(), row -> ((Number) row[1]).longValue()));
    }

    private void publish(String type, Long postId) {
        Runnable send = () -> messagingTemplate.convertAndSend("/topic/feed", new FeedEvent(type, postId));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { send.run(); }
            });
        } else {
            send.run();
        }
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
