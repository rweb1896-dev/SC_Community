package com.sc.community.service;

import com.sc.community.dto.CommentDtos.CommentResponse;
import com.sc.community.dto.CommentDtos.CreateCommentRequest;
import com.sc.community.dto.PostDtos.CreatePostRequest;
import com.sc.community.dto.PostDtos.PostResponse;
import com.sc.community.entity.Category;
import com.sc.community.entity.Comment;
import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import com.sc.community.entity.User;
import com.sc.community.repository.CategoryRepository;
import com.sc.community.repository.CommentRepository;
import com.sc.community.repository.PostRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final CurrentUserService currentUserService;

    public PostService(PostRepository postRepository, CategoryRepository categoryRepository, CommentRepository commentRepository, CurrentUserService currentUserService) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.commentRepository = commentRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public List<PostResponse> feed(Long categoryId) {
        List<Post> posts = categoryId == null
                ? postRepository.findByStatusOrderByCreatedAtDesc(PostStatus.ACTIVE)
                : postRepository.findByCategoryIdAndStatusOrderByCreatedAtDesc(categoryId, PostStatus.ACTIVE);
        return posts.stream().map(PostResponse::from).toList();
    }

    @Transactional
    public PostResponse create(CreatePostRequest request) {
        User user = currentUserService.verifiedUser();
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        Post post = new Post();
        post.setUser(user);
        post.setCategory(category);
        post.setContent(request.content());
        post.setImageUrl(request.imageUrl());
        return PostResponse.from(postRepository.save(post));
    }

    @Transactional
    public List<CommentResponse> comments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(CommentResponse::from).toList();
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
        return CommentResponse.from(commentRepository.save(comment));
    }
}
