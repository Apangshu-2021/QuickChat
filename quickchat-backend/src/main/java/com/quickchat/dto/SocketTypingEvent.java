package com.quickchat.dto;

import java.util.List;

/**
 * Data Transfer Object representing a real-time typing indicator event.
 * 
 * Transported over STOMP:
 * - Published by client to: {@code /app/typing}
 * - Broadcasted by server to: {@code /topic/user/{memberId}/started-typing}
 * 
 * Sample JSON Event:
 * <pre>{@code
 * {
 *   "chat": "664b1f23a9b1c2001e9d1234",
 *   "sender": "664b1f23a9b1c2001e9d5678",
 *   "members": [
 *     "664b1f23a9b1c2001e9d5678",
 *     "664b1f23a9b1c2001e9d9999"
 *   ]
 * }
 * }</pre>
 */
public class SocketTypingEvent {

    /**
     * Unique identifier of the conversation/chat where typing is happening.
     */
    private String chat;

    /**
     * User ID of the participant who is currently typing.
     */
    private String sender;

    /**
     * List of participant user IDs in the chat who should receive the typing indicator.
     */
    private List<String> members;

    public SocketTypingEvent() {}

    public String getChat() {
        return chat;
    }

    public void setChat(String chat) {
        this.chat = chat;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members;
    }
}
