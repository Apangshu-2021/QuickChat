package com.quickchat.dto;

public class ProfilePicRequest {
    private String image;

    public ProfilePicRequest() {}

    public ProfilePicRequest(String image) {
        this.image = image;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
