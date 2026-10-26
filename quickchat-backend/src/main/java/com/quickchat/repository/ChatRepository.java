package com.quickchat.repository;

import com.quickchat.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, String> {

    @Query("SELECT DISTINCT c FROM Chat c JOIN c.members m WHERE m.id = :userId ORDER BY c.updatedAt DESC")
    List<Chat> findAllChatsByUserId(@Param("userId") String userId);

    @Query("SELECT DISTINCT c FROM Chat c JOIN c.members m1 JOIN c.members m2 WHERE ((m1.id = :user1Id AND m2.id = :user2Id) OR (m1.id = :user2Id AND m2.id = :user1Id)) AND m1.id != m2.id AND size(c.members) = 2")
    List<Chat> findChatBetweenUsers(@Param("user1Id") String user1Id, @Param("user2Id") String user2Id);
}
