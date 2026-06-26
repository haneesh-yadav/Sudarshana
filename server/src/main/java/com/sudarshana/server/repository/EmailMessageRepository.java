package com.sudarshana.server.repository;

import com.sudarshana.server.model.EmailMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailMessageRepository extends JpaRepository<EmailMessage, String> {
    List<EmailMessage> findByThreadId(String threadId);
    
    List<EmailMessage> findByThreadIdAndOwnerId(String threadId, Long userId);

    @Query("SELECT DISTINCT m.threadId FROM EmailMessage m")
    List<String> findDistinctThreadIds();

    @Query("SELECT DISTINCT m.threadId FROM EmailMessage m WHERE m.owner.id = :userId")
    List<String> findDistinctThreadIdsByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @Query("SELECT m FROM EmailMessage m WHERE m.owner.id = :userId")
    List<EmailMessage> findByOwnerId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @Query("SELECT m FROM EmailMessage m WHERE m.owner.id = :userId AND (" +
           "LOWER(m.sender) = LOWER(:contact) OR LOWER(m.sender) LIKE CONCAT('%<', LOWER(:contact), '>%') OR " +
           "LOWER(m.recipient) = LOWER(:contact) OR LOWER(m.recipient) LIKE CONCAT('%<', LOWER(:contact), '>%'))")
    List<EmailMessage> findByUserAndContact(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("contact") String contact);
}

