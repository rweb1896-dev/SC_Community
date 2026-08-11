package com.sc.community.controller;
import com.sc.community.dto.HelpChatDtos.*; import com.sc.community.entity.PostStatus; import com.sc.community.service.HelpChatService; import jakarta.validation.Valid; import java.util.List; import org.springframework.http.HttpStatus; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/help")
public class HelpChatController{
 private final HelpChatService service; public HelpChatController(HelpChatService service){this.service=service;}
 @PostMapping("/posts/{postId}/offer") @ResponseStatus(HttpStatus.CREATED) public ConversationResponse offer(@PathVariable Long postId){return service.offer(postId);}
 @PostMapping("/posts/{postId}/volunteer") @ResponseStatus(HttpStatus.CREATED) public VolunteerRequestResponse volunteer(@PathVariable Long postId){return service.volunteer(postId);}
 @PostMapping("/posts/{postId}/request-all") public MyHelpPostResponse requestAll(@PathVariable Long postId){return service.requestAll(postId);}
 @PostMapping("/posts/{postId}/close") public MyHelpPostResponse close(@PathVariable Long postId){return service.closePost(postId);}
 @GetMapping("/posts/mine") public List<MyHelpPostResponse> mine(@RequestParam(defaultValue="ACTIVE") PostStatus status){return service.myPosts(status);}
 @GetMapping("/conversations") public List<ConversationResponse> conversations(@RequestParam(defaultValue="ACTIVE") String view){return service.list(view);}
 @GetMapping("/conversations/{id}/messages") public List<HelpMessageResponse> messages(@PathVariable Long id){return service.messageHistory(id);}
 @PostMapping("/conversations/{id}/messages") public HelpMessageResponse send(@PathVariable Long id,@Valid @RequestBody SendHelpMessageRequest request){return service.send(id,request.messageBody());}
 @PostMapping("/conversations/{id}/end") public ConversationResponse end(@PathVariable Long id,@Valid @RequestBody(required=false) EndConversationRequest request){return service.end(id,request==null?null:request.reason());}
 @PostMapping("/conversations/{id}/reconnect") @ResponseStatus(HttpStatus.CREATED) public ReconnectResponse reconnect(@PathVariable Long id){return service.requestReconnect(id);}
 @GetMapping("/reconnect-requests/incoming") public List<ReconnectResponse> incoming(){return service.incoming();}
 @PostMapping("/reconnect-requests/{id}/accept") public ReconnectResponse accept(@PathVariable Long id){return service.decide(id,true);}
 @PostMapping("/reconnect-requests/{id}/decline") public ReconnectResponse decline(@PathVariable Long id){return service.decide(id,false);}
 @GetMapping("/volunteer-requests/incoming") public List<VolunteerRequestResponse> incomingVolunteers(){return service.incomingVolunteers();}
 @PostMapping("/volunteer-requests/{id}/open-chat") public VolunteerRequestResponse openVolunteerChat(@PathVariable Long id){return service.decideVolunteer(id,true);}
 @PostMapping("/volunteer-requests/{id}/decline") public VolunteerRequestResponse declineVolunteer(@PathVariable Long id){return service.decideVolunteer(id,false);}
 @PostMapping("/conversations/{id}/block") @ResponseStatus(HttpStatus.NO_CONTENT) public void block(@PathVariable Long id){service.block(id);}
 @PostMapping("/conversations/{id}/report") @ResponseStatus(HttpStatus.NO_CONTENT) public void report(@PathVariable Long id,@RequestBody(required=false) EndConversationRequest request){service.report(id,request==null?null:request.reason());}
 @GetMapping("/notifications") public List<NotificationResponse> notifications(){return service.notificationList();}
 @PatchMapping("/notifications/{id}/read") public NotificationResponse read(@PathVariable Long id){return service.readNotification(id);}
}
