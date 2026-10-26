package com.quickchat.service;

import com.quickchat.dto.ApiResponse;
import com.quickchat.dto.CreateChatRequest;
import com.quickchat.model.Chat;
import com.quickchat.model.User;
import com.quickchat.repository.ChatRepository;
import com.quickchat.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    public ChatService(ChatRepository chatRepository, UserRepository userRepository) {
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ApiResponse createNewChat(CreateChatRequest request) {
        ApiResponse response = new ApiResponse();
        try {
            if (request.getMembers() == null || request.getMembers().size() < 2) {
                response.setStatus(false);
                response.setMessage("At least two members are required to create a chat");
                return response;
            }

            // Check if a conversation between these two users already exists
            String user1 = request.getMembers().get(0);
            String user2 = request.getMembers().get(1);
            List<Chat> existingChats = chatRepository.findChatBetweenUsers(user1, user2);
            if (!existingChats.isEmpty()) {
                response.setStatus(true);
                response.setMessage("Chat already exists");
                response.setChat(existingChats.get(0));
                return response;
            }

            List<User> members = new ArrayList<>();
            for (String memberId : request.getMembers()) {
                userRepository.findById(memberId).ifPresent(members::add);
            }

            Chat chat = new Chat();
            chat.setMembers(members);
            chat.setUnreadMessages(0);
            chat = chatRepository.save(chat);

            response.setStatus(true);
            response.setMessage("Chat created successfully");
            response.setChat(chat);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage(e.getMessage());
            return response;
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse getAllChats(String currentUserId) {
        ApiResponse response = new ApiResponse();
        try {
            List<Chat> chats = chatRepository.findAllChatsByUserId(currentUserId);
            response.setStatus(true);
            response.setChats(chats);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage(e.getMessage());
            return response;
        }
    }
}
