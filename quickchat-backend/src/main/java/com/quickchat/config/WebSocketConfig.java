package com.quickchat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration class for STOMP-based WebSocket messaging.
 * 
 * Enables and configures real-time bidirectional communication between the
 * client
 * (e.g., React frontend via SockJS / StompJS) and the Spring Boot backend.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configures the message broker used to route messages between clients and
     * server controllers.
     *
     * @param config the {@link MessageBrokerRegistry} to configure destination
     *               prefixes
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable an in-memory message broker to relay messages back to subscribed
        // clients.
        // - "/topic": Commonly used for broadcast/pub-sub messages (e.g., online users
        // status, group chats).
        // - "/queue": Commonly used for point-to-point private messages.
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages sent from clients destined for server-side handlers
        // (@MessageMapping methods).
        // Example: Client publishing to "/app/send-message" routes to the controller
        // method mapped to "/send-message".
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers STOMP endpoints mapping the handshake URLs where clients connect to
     * establish WebSocket sessions.
     *
     * @param registry the {@link StompEndpointRegistry} used to register WebSocket
     *                 endpoints
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        // Having both allows React frontend (via sockjs-client) and external tools
        // like Postman or mobile apps (via standard ws://) to connect to the exact same
        // backend broker.

        // -------------------------------------------------------------------------
        // 1. SockJS STOMP Endpoint
        // -------------------------------------------------------------------------
        // What it does: Enables the SockJS protocol wrapper around WebSockets.
        // How it connects:
        // - The client first sends an HTTP GET request to /ws/info to check server capabilities.
        // - It then attempts to upgrade to a WebSocket connection at /ws/<server-id>/<session-id>/websocket.
        // - Automatic Fallback: If WebSockets are blocked (by corporate firewalls, restrictive proxies,
        //   or older browsers), SockJS seamlessly falls back to HTTP-based alternatives like
        //   XHR Streaming or XHR Long Polling without breaking the application.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // -------------------------------------------------------------------------
        // 2. Pure / Native STOMP Endpoint
        // -------------------------------------------------------------------------
        // What it does: Exposes a pure, standard WebSocket endpoint without the SockJS protocol layer.
        // How it connects:
        // - The client connects directly via standard WebSocket URL scheme (ws:// or wss://):
        //   e.g., ws://localhost:8080/ws
        // - There is no /info preflight request and no HTTP polling fallback.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}
