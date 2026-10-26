package com.quickchat.controller;

import com.quickchat.dto.ApiResponse;
import com.quickchat.dto.LoginRequest;
import com.quickchat.dto.ProfilePicRequest;
import com.quickchat.dto.RegisterRequest;
import com.quickchat.model.User;
import com.quickchat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        ApiResponse response = userService.registerUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> loginUser(@Valid @RequestBody LoginRequest request) {
        ApiResponse response = userService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-current-user")
    public ResponseEntity<ApiResponse> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        ApiResponse response = userService.getCurrentUser(currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-all-users")
    public ResponseEntity<ApiResponse> getAllUsers(@AuthenticationPrincipal User currentUser) {
        ApiResponse response = userService.getAllUsers(currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update-profile-picture")
    public ResponseEntity<ApiResponse> updateProfilePicture(@AuthenticationPrincipal User currentUser,
                                                            @RequestBody ProfilePicRequest request) {
        ApiResponse response = userService.updateProfilePicture(currentUser.getId(), request.getImage());
        return ResponseEntity.ok(response);
    }
}
