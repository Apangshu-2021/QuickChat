package com.quickchat.controller;

import com.quickchat.dto.ApiResponse;
import com.quickchat.dto.CreateChatRequest;
import com.quickchat.model.User;
import com.quickchat.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/create-new-chat")
    public ResponseEntity<ApiResponse> createNewChat(@RequestBody CreateChatRequest request) {
        ApiResponse response = chatService.createNewChat(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-all-chats")
    public ResponseEntity<ApiResponse> getAllChats(@AuthenticationPrincipal User currentUser) {
        ApiResponse response = chatService.getAllChats(currentUser.getId());
        return ResponseEntity.ok(response);
    }
}
