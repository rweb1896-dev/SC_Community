package com.sc.community.controller;

import com.sc.community.dto.CommentDtos.CommentResponse;
import com.sc.community.dto.CommentDtos.CreateCommentRequest;
import com.sc.community.dto.PostDtos.CreatePostRequest;
import com.sc.community.dto.PostDtos.PostResponse;
import com.sc.community.dto.PostDtos.SupportResponse;
import com.sc.community.dto.PostDtos.UpdatePostRequest;
import com.sc.community.service.PostService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public List<PostResponse> feed(@RequestParam(required = false) Long categoryId) {
        return postService.feed(categoryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@Valid @RequestBody CreatePostRequest request) {
        return postService.create(request);
    }

    @PatchMapping("/{postId}")
    public PostResponse update(@PathVariable Long postId, @Valid @RequestBody UpdatePostRequest request) {
        return postService.update(postId, request);
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long postId) { postService.delete(postId); }

    @GetMapping("/{postId}/comments")
    public List<CommentResponse> comments(@PathVariable Long postId) {
        return postService.comments(postId);
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse comment(@PathVariable Long postId, @Valid @RequestBody CreateCommentRequest request) {
        return postService.comment(postId, request);
    }

    @PostMapping("/{postId}/support")
    public SupportResponse support(@PathVariable Long postId) {
        return postService.toggleSupport(postId);
    }
}
