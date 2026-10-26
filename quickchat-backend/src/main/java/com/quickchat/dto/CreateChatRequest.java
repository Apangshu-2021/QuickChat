package com.quickchat.dto;

import java.util.List;

public class CreateChatRequest {
    private List<String> members;

    public CreateChatRequest() {}

    public CreateChatRequest(List<String> members) {
        this.members = members;
    }

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members;
    }
}
