package com.quickchat.config;

import com.quickchat.controller.WebSocketChatController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Event listener that manages WebSocket connection lifecycle events.
 * 
 * Specifically listens for session disconnect events to perform cleanup
 * operations,
 * such as automatically marking users as offline and notifying active clients
 * when
 * a client connection is terminated unexpectedly (e.g., closing the tab,
 * browser crash, or network loss).
 * 
 * Why it is needed:
 * Graceful Disconnect: When a user logs out cleanly, the frontend can publish
 * to /app/went-offline.
 * Ungraceful Disconnect: If a user suddenly closes their browser window, loses
 * Wi-Fi, or the computer sleeps, the frontend cannot send a message. This
 * listener serves as the server-side safety net to ensure "ghost" users don't
 * remain marked as online forever.
 */
@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final WebSocketChatController webSocketChatController;

    public WebSocketEventListener(WebSocketChatController webSocketChatController) {
        this.webSocketChatController = webSocketChatController;
    }

    /**
     * Handles WebSocket session disconnection events published by Spring Framework.
     * 
     * When a client disconnects without cleanly sending a "went-offline" message
     * (e.g., network timeout, tab close), this method retrieves the stored user
     * identity
     * from the session attributes, removes them from the online users set, and
     * broadcasts
     * the updated presence list to all connected subscribers.
     *
     * @param event the {@link SessionDisconnectEvent} triggered when a WebSocket
     *              session closes
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        // Wrap the underlying message to access STOMP headers and session attributes
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        if (headerAccessor.getSessionAttributes() != null) {
            String userId = (String) headerAccessor.getSessionAttributes().get("userId");
            if (userId != null) {
                logger.info("User disconnected from WebSocket: {}", userId);
                // Remove user from active presence list and broadcast update
                webSocketChatController.removeUser(userId);
            }
        }
    }
}
