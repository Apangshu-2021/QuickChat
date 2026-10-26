package com.quickchat.dto;

import java.util.List;

/**
 * Data Transfer Object representing an unread messages cleared event (read receipts).
 * 
 * Transported over STOMP:
 * - Published by client to: {@code /app/clear-unread-messages}
 * - Broadcasted by server to: {@code /topic/user/{memberId}/unread-messages-cleared}
 * 
 * Sample JSON Event:
 * <pre>{@code
 * {
 *   "chat": "664b1f23a9b1c2001e9d1234",
 *   "members": [
 *     "664b1f23a9b1c2001e9d5678",
 *     "664b1f23a9b1c2001e9d9999"
 *   ]
 * }
 * }</pre>
 */
public class SocketClearUnreadEvent {

    /**
     * Unique identifier of the chat conversation whose unread messages have been viewed/cleared.
     */
    private String chat;

    /**
     * List of participant user IDs in the chat who should be notified that messages were read.
     */
    private List<String> members;

    public SocketClearUnreadEvent() {}

    public String getChat() {
        return chat;
    }

    public void setChat(String chat) {
        this.chat = chat;
    }

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members;
    }
}
