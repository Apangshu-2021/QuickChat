package com.quickchat.dto;

public class ClearUnreadRequest {
    private String chat;

    public ClearUnreadRequest() {}

    public ClearUnreadRequest(String chat) {
        this.chat = chat;
    }

    public String getChat() {
        return chat;
    }

    public void setChat(String chat) {
        this.chat = chat;
    }
}
