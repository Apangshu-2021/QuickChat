package com.quickchat.repository;

import com.quickchat.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    @Query("SELECT m FROM Message m WHERE m.chatEntity.id = :chatId ORDER BY m.createdAt ASC")
    List<Message> findByChatIdOrderByCreatedAtAsc(@Param("chatId") String chatId);

    @Modifying
    @Query("UPDATE Message m SET m.read = true WHERE m.chatEntity.id = :chatId AND m.read = false")
    int markAllAsReadInChat(@Param("chatId") String chatId);
}
