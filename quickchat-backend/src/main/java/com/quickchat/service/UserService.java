package com.quickchat.service;

import com.quickchat.config.JwtTokenProvider;
import com.quickchat.dto.ApiResponse;
import com.quickchat.dto.AuthResponseUser;
import com.quickchat.dto.LoginRequest;
import com.quickchat.dto.RegisterRequest;
import com.quickchat.model.User;
import com.quickchat.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final FileStorageService fileStorageService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ApiResponse registerUser(RegisterRequest request) {
        ApiResponse response = new ApiResponse();
        try {
            Optional<User> existing = userRepository.findByEmail(request.getEmail());
            if (existing.isPresent()) {
                response.setStatus(false);
                response.setMessage("User with this email already exists");
                return response;
            }

            User user = new User(
                    request.getName(),
                    request.getEmail(),
                    passwordEncoder.encode(request.getPassword())
            );
            user = userRepository.save(user);

            String token = tokenProvider.generateToken(user.getId());
            AuthResponseUser authUser = new AuthResponseUser(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getProfilePic(),
                    token
            );

            response.setStatus(true);
            response.setUser(authUser);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage(e.getMessage());
            return response;
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse loginUser(LoginRequest request) {
        ApiResponse response = new ApiResponse();
        try {
            Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
            if (userOptional.isEmpty()) {
                response.setStatus(false);
                response.setMessage("Incorrect email");
                return response;
            }

            User user = userOptional.get();
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                response.setStatus(false);
                response.setMessage("Incorrect password");
                return response;
            }

            String token = tokenProvider.generateToken(user.getId());
            AuthResponseUser authUser = new AuthResponseUser(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getProfilePic(),
                    token
            );

            response.setStatus(true);
            response.setUser(authUser);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage(e.getMessage());
            return response;
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse getCurrentUser(User currentUser) {
        ApiResponse response = new ApiResponse();
        response.setStatus(true);
        response.setUser(currentUser);
        return response;
    }

    @Transactional(readOnly = true)
    public ApiResponse getAllUsers(String currentUserId) {
        ApiResponse response = new ApiResponse();
        try {
            List<User> users = userRepository.findByIdNot(currentUserId);
            response.setStatus(true);
            response.setAllUsers(users);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage(e.getMessage());
            return response;
        }
    }

    @Transactional
    public ApiResponse updateProfilePicture(String userId, String imageBase64) {
        ApiResponse response = new ApiResponse();
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                response.setStatus(false);
                response.setMessage("User not found");
                return response;
            }

            String imageUrl = fileStorageService.storeBase64Image(imageBase64);
            User user = userOpt.get();
            user.setProfilePic(imageUrl);
            user = userRepository.save(user);

            response.setStatus(true);
            response.setUser(user);
            return response;
        } catch (Exception e) {
            response.setStatus(false);
            response.setMessage(e.getMessage());
            return response;
        }
    }
}
