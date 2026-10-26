package com.quickchat.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.quickchat.model.Chat;
import com.quickchat.model.Message;
import com.quickchat.model.User;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    private boolean status;
    private String message;
    private Object user;
    private List<User> allUsers;
    private Chat chat;
    private List<Chat> chats;
    private Message savedMessage;
    private List<Message> messages;
    private String error;

    public ApiResponse() {}

    public static ApiResponse success(String message) {
        ApiResponse res = new ApiResponse();
        res.setStatus(true);
        res.setMessage(message);
        return res;
    }

    public static ApiResponse error(String message) {
        ApiResponse res = new ApiResponse();
        res.setStatus(false);
        res.setMessage(message);
        return res;
    }

    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getUser() {
        return user;
    }

    public void setUser(Object user) {
        this.user = user;
    }

    public List<User> getAllUsers() {
        return allUsers;
    }

    public void setAllUsers(List<User> allUsers) {
        this.allUsers = allUsers;
    }

    public Chat getChat() {
        return chat;
    }

    public void setChat(Chat chat) {
        this.chat = chat;
    }

    public List<Chat> getChats() {
        return chats;
    }

    public void setChats(List<Chat> chats) {
        this.chats = chats;
    }

    public Message getSavedMessage() {
        return savedMessage;
    }

    public void setSavedMessage(Message savedMessage) {
        this.savedMessage = savedMessage;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
