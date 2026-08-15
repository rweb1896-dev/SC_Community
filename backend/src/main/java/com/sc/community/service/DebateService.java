package com.sc.community.service;

import com.sc.community.dto.CommunitySpaceDtos.DebateCommentResponse;
import com.sc.community.dto.CommunitySpaceDtos.DebateResponse;
import com.sc.community.dto.CommunitySpaceDtos.SaveDebateRequest;
import com.sc.community.entity.Category;
import com.sc.community.entity.Comment;
import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import com.sc.community.entity.User;
import com.sc.community.repository.CategoryRepository;
import com.sc.community.repository.CommentRepository;
import com.sc.community.repository.PostRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DebateService {
    private static final String DEBATE_CATEGORY = "Open Forum/SOS";
    private final PostRepository posts;
    private final CategoryRepository categories;
    private final CommentRepository comments;
    private final CurrentUserService current;

    public DebateService(PostRepository posts, CategoryRepository categories, CommentRepository comments,
            CurrentUserService current) {
        this.posts = posts;
        this.categories = categories;
        this.comments = comments;
        this.current = current;
    }

    @Transactional(readOnly = true)
    public List<DebateResponse> list() {
        User user = current.verifiedUser();
        Category category = category();
        return posts.findByCategoryIdAndStatusOrderByCreatedAtDesc(category.getId(), PostStatus.ACTIVE).stream()
                .filter(post -> CommunitySpaceMarkers.isDebateContent(post.getContent()))
                .map(post -> response(post, user.getId())).toList();
    }

    @Transactional
    public DebateResponse create(SaveDebateRequest request) {
        User user = current.verifiedUser();
        Post post = new Post();
        post.setUser(user);
        post.setCategory(category());
        post.setContent(encoded(request));
        post.setImageUrl(clean(request.imageUrl()));
        return response(posts.save(post), user.getId());
    }

    @Transactional
    public DebateResponse update(Long debateId, SaveDebateRequest request) {
        User user = current.verifiedUser();
        Post post = require(debateId);
        requireOwner(post, user);
        post.setContent(encoded(request));
        post.setImageUrl(clean(request.imageUrl()));
        return response(post, user.getId());
    }

    @Transactional
    public void delete(Long debateId) {
        User user = current.verifiedUser();
        Post post = require(debateId);
        requireOwner(post, user);
        post.setStatus(PostStatus.BLOCKED);
    }

    @Transactional(readOnly = true)
    public List<DebateCommentResponse> comments(Long debateId) {
        require(debateId);
        return comments.findByPostIdOrderByCreatedAtAsc(debateId).stream().map(this::commentResponse).toList();
    }

    @Transactional
    public DebateCommentResponse comment(Long debateId, String body) {
        User user = current.verifiedUser();
        Post post = require(debateId);
        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setCommentText(body.trim());
        return commentResponse(comments.save(comment));
    }

    private DebateResponse response(Post post, Long viewerId) {
        String[] content = decoded(post.getContent());
        boolean mine = post.getUser().getId().equals(viewerId);
        return new DebateResponse(post.getId(), mine, post.getUser().getId(), "Member #" + post.getUser().getId(),
                content[0], content[1], post.getImageUrl(), post.getCreatedAt(), comments.countByPostId(post.getId()));
    }

    private DebateCommentResponse commentResponse(Comment comment) {
        return new DebateCommentResponse(comment.getId(), comment.getPost().getId(), comment.getUser().getId(),
                "Member #" + comment.getUser().getId(), comment.getCommentText(), comment.getCreatedAt());
    }

    private Post require(Long debateId) {
        Post post = posts.findById(debateId)
                .filter(item -> CommunitySpaceMarkers.isDebateContent(item.getContent()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Debate topic not found"));
        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.GONE, "This debate is closed");
        }
        return post;
    }

    private void requireOwner(Post post, User user) {
        if (!post.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the topic author can change this debate");
        }
    }

    private Category category() {
        return categories.findByName(DEBATE_CATEGORY)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Debate category is not available"));
    }

    private String encoded(SaveDebateRequest request) {
        return CommunitySpaceMarkers.DEBATE_PREFIX + request.title().trim() + "\n\n" + request.body().trim();
    }

    private String[] decoded(String value) {
        String content = value.substring(CommunitySpaceMarkers.DEBATE_PREFIX.length());
        String[] parts = content.split("\\n\\n", 2);
        return new String[] { parts[0].trim(), parts.length > 1 ? parts[1].trim() : "" };
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
