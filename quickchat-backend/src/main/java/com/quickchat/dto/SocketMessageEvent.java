package com.quickchat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Data Transfer Object representing a real-time chat message event.
 * 
 * Transported over STOMP:
 * - Published by client to: {@code /app/send-message}
 * - Broadcasted by server to: {@code /topic/user/{memberId}/receive-message}
 */
public class SocketMessageEvent {

    private String id;

    /**
     * Unique identifier of the conversation/chat room this message belongs to.
     */
    private String chat;

    /**
     * User ID of the participant who sent the message.
     */
    private String sender;

    /**
     * Text content of the chat message (null or empty if only sending an image/media).
     */
    private String text;

    /**
     * URL / path to an uploaded image or attachment (null if text-only).
     */
    private String image;

    /**
     * List of participant user IDs in this chat who should receive the message.
     * The backend iterates over this list to deliver to each member's private topic.
     */
    private List<String> members;

    /**
     * ISO-8601 timestamp string when the message was created on the client.
     */
    private String createdAt;

    /**
     * Flag indicating whether the message has been viewed/read by the recipients.
     * Defaults to {@code false} when initially sent.
     */
    private boolean read;

    /**
     * Client-generated UUID (v4) used for message deduplication, optimistic UI rendering,
     * and tracking pending messages before database confirmation.
     */
    private String uuid;

    public SocketMessageEvent() {}

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

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
