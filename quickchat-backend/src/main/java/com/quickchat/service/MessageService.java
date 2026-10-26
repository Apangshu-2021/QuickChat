package com.quickchat.service;

import com.quickchat.dto.ApiResponse;
import com.quickchat.dto.NewMessageRequest;
import com.quickchat.model.Chat;
import com.quickchat.model.Message;
import com.quickchat.model.User;
import com.quickchat.repository.ChatRepository;
import com.quickchat.repository.MessageRepository;
import com.quickchat.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public MessageService(MessageRepository messageRepository,
                          ChatRepository chatRepository,
                          UserRepository userRepository,
                          FileStorageService fileStorageService) {
        this.messageRepository = messageRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ApiResponse saveNewMessageAndUpdateChat(NewMessageRequest request) {
        ApiResponse response = new ApiResponse();
        try {
            Optional<Chat> chatOpt = chatRepository.findById(request.getChat());
            Optional<User> senderOpt = userRepository.findById(request.getSender());

            if (chatOpt.isEmpty()) {
                response.setStatus(false);
                response.setMessage("Chat not found");
                return response;
            }

            if (senderOpt.isEmpty()) {
                response.setStatus(false);
                response.setMessage("Sender not found");
                return response;
            }

            String storedImageUrl = null;
            if (request.getImage() != null && !request.getImage().trim().isEmpty()) {
                storedImageUrl = fileStorageService.storeBase64Image(request.getImage());
            }

            Message message = new Message(chatOpt.get(), senderOpt.get(), request.getText(), storedImageUrl);
            Message savedMessage = messageRepository.save(message);

            Chat chat = chatOpt.get();
            chat.setLastMessage(savedMessage);
            chat.setUnreadMessages(chat.getUnreadMessages() != null ? chat.getUnreadMessages() + 1 : 1);
            chat.setUpdatedAt(java.time.LocalDateTime.now());
            chatRepository.save(chat);

            response.setStatus(true);
            response.setMessage("Message sent successfully");
            response.setSavedMessage(savedMessage);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage("Error sending message");
            response.setError(e.getMessage());
            return response;
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse getAllMessagesOfChat(String chatId) {
        ApiResponse response = new ApiResponse();
        try {
            List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
            response.setStatus(true);
            response.setMessage("Message fetched successfully");
            response.setMessages(messages);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage("Error sending message");
            response.setError(e.getMessage());
            return response;
        }
    }

    @Transactional
    public ApiResponse clearUnreadMessagesOfChat(String chatId) {
        ApiResponse response = new ApiResponse();
        try {
            Optional<Chat> chatOpt = chatRepository.findById(chatId);
            if (chatOpt.isEmpty()) {
                response.setStatus(false);
                response.setMessage("Chat not found");
                return response;
            }

            Chat chat = chatOpt.get();
            chat.setUnreadMessages(0);
            chat = chatRepository.save(chat);

            messageRepository.markAllAsReadInChat(chatId);

            response.setStatus(true);
            response.setMessage("Unread messages cleared successfully");
            response.setChat(chat);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage("Error clearing unread messages");
            response.setError(e.getMessage());
            return response;
        }
    }
}
