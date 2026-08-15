package com.sc.community.controller;

import com.sc.community.dto.CommunitySpaceDtos.BlogResponse;
import com.sc.community.dto.CommunitySpaceDtos.DebateCommentResponse;
import com.sc.community.dto.CommunitySpaceDtos.DebateResponse;
import com.sc.community.dto.CommunitySpaceDtos.SaveBlogRequest;
import com.sc.community.dto.CommunitySpaceDtos.SaveDebateRequest;
import com.sc.community.dto.CommentDtos.CreateCommentRequest;
import com.sc.community.service.DebateService;
import com.sc.community.service.MemberBlogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/member-space")
public class MemberSpaceController {
    private final MemberBlogService blogs;
    private final DebateService debates;

    public MemberSpaceController(MemberBlogService blogs, DebateService debates) {
        this.blogs = blogs;
        this.debates = debates;
    }

    @GetMapping("/blogs") public List<BlogResponse> blogs() { return blogs.list(false); }
    @GetMapping("/blogs/mine") public List<BlogResponse> myBlogs() { return blogs.list(true); }
    @PostMapping("/blogs") @ResponseStatus(HttpStatus.CREATED)
    public BlogResponse createBlog(@Valid @RequestBody SaveBlogRequest request) { return blogs.create(request); }
    @PatchMapping("/blogs/{blogId}")
    public BlogResponse updateBlog(@PathVariable Long blogId, @Valid @RequestBody SaveBlogRequest request) { return blogs.update(blogId, request); }
    @DeleteMapping("/blogs/{blogId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBlog(@PathVariable Long blogId) { blogs.delete(blogId); }

    @GetMapping("/debates") public List<DebateResponse> debates() { return debates.list(); }
    @PostMapping("/debates") @ResponseStatus(HttpStatus.CREATED)
    public DebateResponse createDebate(@Valid @RequestBody SaveDebateRequest request) { return debates.create(request); }
    @PatchMapping("/debates/{debateId}")
    public DebateResponse updateDebate(@PathVariable Long debateId, @Valid @RequestBody SaveDebateRequest request) { return debates.update(debateId, request); }
    @DeleteMapping("/debates/{debateId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDebate(@PathVariable Long debateId) { debates.delete(debateId); }
    @GetMapping("/debates/{debateId}/comments")
    public List<DebateCommentResponse> comments(@PathVariable Long debateId) { return debates.comments(debateId); }
    @PostMapping("/debates/{debateId}/comments") @ResponseStatus(HttpStatus.CREATED)
    public DebateCommentResponse addComment(@PathVariable Long debateId, @Valid @RequestBody CreateCommentRequest request) {
        return debates.comment(debateId, request.commentText());
    }
}
