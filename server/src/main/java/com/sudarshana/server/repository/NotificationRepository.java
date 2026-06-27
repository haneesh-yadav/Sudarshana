package com.sudarshana.server.repository;

import com.sudarshana.server.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByTimestampDesc(Long userId);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.read = false ORDER BY n.timestamp DESC")
    List<Notification> findUnreadByUserId(@Param("userId") Long userId);

    long countByUserIdAndReadFalse(Long userId);
}
