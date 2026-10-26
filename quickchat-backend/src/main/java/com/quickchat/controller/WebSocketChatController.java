package com.quickchat.controller;

import com.quickchat.dto.SocketClearUnreadEvent;
import com.quickchat.dto.SocketMessageEvent;
import com.quickchat.dto.SocketTypingEvent;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Controller responsible for handling real-time WebSocket messaging and presence management.
 * 
 * It handles incoming STOMP messages mapped via {@code @MessageMapping} (prefixed with "/app"),
 * broadcasts updates to active subscribers through {@link SimpMessagingTemplate}, and exposes
 * an HTTP REST endpoint to query currently online users.
 */
@RestController
public class WebSocketChatController {

    /**
     * Spring template for sending STOMP messages to broker destinations (e.g., /topic/...).
     */
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Thread-safe set storing unique user IDs of currently connected/online users.
     * Backed by ConcurrentHashMap to support concurrent reads and writes from multiple WebSocket sessions.
     */
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    public WebSocketChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Handles real-time message sending between chat participants.
     * 
     * Routing:
     * - Client publishes to: {@code /app/send-message}
     * - Server broadcasts to: {@code /topic/user/{memberId}/receive-message} for each recipient
     * 
     * When a user sends a chat message, this method iterates through all chat members
     * (including sender and receivers) and routes the message payload to each user's
     * dedicated private topic so their UI can update in real-time.
     *
     * @param message the chat message event containing sender, message text, media, and participant IDs
     */
    @MessageMapping("/send-message")
    public void sendMessage(@Payload SocketMessageEvent message) {
        if (message.getMembers() != null) {
            for (String memberId : message.getMembers()) {
                messagingTemplate.convertAndSend("/topic/user/" + memberId + "/receive-message", message);
            }
        }
    }

    /**
     * Handles real-time typing indicators.
     * 
     * Routing:
     * - Client publishes to: {@code /app/typing}
     * - Server broadcasts to: {@code /topic/user/{memberId}/started-typing} for each member
     * 
     * Triggered as the user types in a chat box. Notifies other conversation participants
     * so they can display animated typing indicators (e.g. "User is typing...").
     *
     * @param event the typing event containing chatId, sender info, and recipient members
     */
    @MessageMapping("/typing")
    public void typing(@Payload SocketTypingEvent event) {
        if (event.getMembers() != null) {
            for (String memberId : event.getMembers()) {
                messagingTemplate.convertAndSend("/topic/user/" + memberId + "/started-typing", event);
            }
        }
    }

    /**
     * Handles real-time read receipts and clearing unread message badges.
     * 
     * Routing:
     * - Client publishes to: {@code /app/clear-unread-messages}
     * - Server broadcasts to: {@code /topic/user/{memberId}/unread-messages-cleared}
     * 
     * Triggered when a user opens an active chat room and views unread messages.
     * Notifies all conversation members so unread counters and badge icons can sync across devices.
     *
     * @param event the event payload containing chatId and member IDs
     */
    @MessageMapping("/clear-unread-messages")
    public void clearUnreadMessages(@Payload SocketClearUnreadEvent event) {
        if (event.getMembers() != null) {
            for (String memberId : event.getMembers()) {
                messagingTemplate.convertAndSend("/topic/user/" + memberId + "/unread-messages-cleared", event);
            }
        }
    }

    /**
     * Marks a user as online when they connect or join the chat.
     * 
     * Routing:
     * - Client publishes to: {@code /app/came-online}
     * - Server broadcasts to: {@code /topic/online-users} (via broadcastOnlineUsers)
     * 
     * Sanitizes incoming user ID (stripping extra quotes/whitespace), adds the user ID
     * to the thread-safe {@code onlineUsers} set, and broadcasts the updated online list.
     *
     * @param userId the unique ID of the user coming online
     */
    @MessageMapping("/came-online")
    public void cameOnline(@Payload String userId) {
        if (userId != null && !userId.trim().isEmpty()) {
            onlineUsers.add(userId.trim().replaceAll("\"", ""));
            broadcastOnlineUsers();
        }
    }

    /**
     * Marks a user as offline when they gracefully log out or leave the application.
     * 
     * Routing:
     * - Client publishes to: {@code /app/went-offline}
     * - Server broadcasts to: {@code /topic/online-users} (via broadcastOnlineUsers)
     * 
     * Removes the user ID from the {@code onlineUsers} set and broadcasts the updated
     * presence list to all connected subscribers.
     *
     * @param userId the unique ID of the user going offline
     */
    @MessageMapping("/went-offline")
    public void wentOffline(@Payload String userId) {
        if (userId != null && !userId.trim().isEmpty()) {
            onlineUsers.remove(userId.trim().replaceAll("\"", ""));
            broadcastOnlineUsers();
        }
    }

    /**
     * REST endpoint to fetch the snapshot of currently online users.
     * 
     * HTTP: GET /api/online-users
     * 
     * Useful for frontend initial load or page refreshes before WebSocket subscription
     * messages arrive, ensuring active status indicators reflect the current state immediately.
     *
     * @return a snapshot list containing user IDs currently online
     */
    @GetMapping("/api/online-users")
    public List<String> getOnlineUsers() {
        return new ArrayList<>(onlineUsers);
    }

    /**
     * Helper method to broadcast the latest online users list to all subscribed clients.
     * 
     * Destination: {@code /topic/online-users}
     * Subscribers: All frontend clients listening for presence updates
     */
    private void broadcastOnlineUsers() {
        messagingTemplate.convertAndSend("/topic/online-users", new ArrayList<>(onlineUsers));
    }

    /**
     * Public cleanup method invoked by {@code WebSocketEventListener} when a connection drops unexpectedly.
     * 
     * If a user abruptly closes their browser tab or loses network connection without sending
     * {@code /app/went-offline}, this method ensures they are removed from the active set
     * and subscribers receive an updated presence list.
     *
     * @param userId the ID of the disconnected user to remove
     */
    public void removeUser(String userId) {
        if (userId != null) {
            onlineUsers.remove(userId);
            broadcastOnlineUsers();
        }
    }
}
