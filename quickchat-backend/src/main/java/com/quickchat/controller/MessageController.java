package com.quickchat.controller;

import com.quickchat.dto.ApiResponse;
import com.quickchat.dto.ClearUnreadRequest;
import com.quickchat.dto.NewMessageRequest;
import com.quickchat.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/new-message")
    public ResponseEntity<ApiResponse> saveNewMessageAndUpdateChat(@RequestBody NewMessageRequest request) {
        ApiResponse response = messageService.saveNewMessageAndUpdateChat(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-all-messages/{chatId}")
    public ResponseEntity<ApiResponse> getAllMessagesOfChat(@PathVariable("chatId") String chatId) {
        ApiResponse response = messageService.getAllMessagesOfChat(chatId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/clear-unread-messages")
    public ResponseEntity<ApiResponse> clearUnreadMessagesOfChat(@RequestBody ClearUnreadRequest request) {
        ApiResponse response = messageService.clearUnreadMessagesOfChat(request.getChat());
        return ResponseEntity.ok(response);
    }
}
