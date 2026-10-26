package com.quickchat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthResponseUser {
    private String id;
    private String name;
    private String email;
    private String profilePic;
    private String token;

    public AuthResponseUser() {}

    public AuthResponseUser(String id, String name, String email, String profilePic, String token) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.profilePic = profilePic;
        this.token = token;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
